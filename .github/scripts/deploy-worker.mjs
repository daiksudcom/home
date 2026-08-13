import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { classifyProcessFailure, isRetriableFailure, parseTag } from './policy-lib.mjs';

const MAX_ATTEMPTS = 3;

const required = ['GITHUB_SHA', 'CLOUDFLARE_WORKER_NAME', 'PRODUCTION_ORIGIN', 'DEPLOY_TAG'];
for (const name of required) assert(process.env[name], `${name} is required`);
assert(
  ['wrangler.json', 'wrangler.jsonc', 'wrangler.toml'].some(existsSync),
  'DEPLOY_ENABLED requires a committed Wrangler configuration',
);

const sha = process.env.GITHUB_SHA;
const workerName = process.env.CLOUDFLARE_WORKER_NAME;
const productionOrigin = process.env.PRODUCTION_ORIGIN;
const receiptPath = process.env.DEPLOYMENT_RECEIPT_PATH ?? 'deployment-receipt.json';
const deployTag = process.env.DEPLOY_TAG;
const { core: version, build } = parseTag(deployTag);

/**
 * Every remote call funnels through one policy: transient transport faults are retried up
 * to three times and anything we caused ourselves fails immediately, so a broken build is
 * never re-sent to production.
 */
async function withRetries(label, run) {
  let lastOutput = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await run();
    if (result.ok) return result.value;
    lastOutput = result.output;
    if (!isRetriableFailure(classifyProcessFailure(result.output))) {
      throw new Error(
        `${label} failed for an internal reason and was not retried:\n${result.output}`,
      );
    }
    if (attempt < MAX_ATTEMPTS) {
      process.stderr.write(
        `${label} hit a transient failure (attempt ${attempt}/${MAX_ATTEMPTS}); retrying.\n`,
      );
      await delay(2_000 * attempt);
    }
  }
  throw new Error(`${label} still failed after ${MAX_ATTEMPTS} attempts:\n${lastOutput}`);
}

function runWrangler(args, env = {}) {
  const result = spawnSync('pnpm', ['exec', 'wrangler', ...args, '--env', 'production'], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  if (result.status === 0) return { ok: true, value: result.stdout };
  return { ok: false, output: `${result.stdout ?? ''}\n${result.stderr ?? ''}` };
}

function wrangler(args, { env, label } = {}) {
  return withRetries(label ?? `wrangler ${args.slice(0, 2).join(' ')}`, () =>
    runWrangler(args, env),
  );
}

function readWranglerOutput(path, type) {
  const entries = readFileSync(path, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const entry = entries.findLast((candidate) => candidate.type === type);
  assert(entry, `Wrangler did not write a ${type} result`);
  return entry;
}

async function smoke(origin, paths, label) {
  const results = [];
  for (const path of paths) {
    const url = new URL(path, origin);
    url.searchParams.set('__home_smoke', sha.slice(0, 12));
    const status = await withRetries(`${label} smoke ${url}`, async () => {
      try {
        const response = await fetch(url, {
          headers: { 'cache-control': 'no-cache', 'user-agent': 'home-deploy-smoke/1' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) return { ok: false, output: `HTTP ${response.status}` };
        return { ok: true, value: response.status };
      } catch (error) {
        return { ok: false, output: `${error.code ?? ''} ${error.message}` };
      }
    });
    results.push({ path, status });
  }
  return results;
}

const status = runWrangler(['deployments', 'status', '--name', workerName, '--json']);
let previousVersionId;
if (status.ok) {
  const deployment = JSON.parse(status.value);
  assert(Array.isArray(deployment.versions), 'current deployment has no version list');
  assert.equal(
    deployment.versions.length,
    1,
    'production must be at a single 100% Worker version before deploy',
  );
  assert.equal(
    deployment.versions[0].percentage,
    100,
    'production Worker version must serve 100% before deploy',
  );
  previousVersionId = deployment.versions[0].version_id;
} else {
  assert.match(
    status.output,
    /has no deployments/i,
    `could not inspect current deployment: ${status.output}`,
  );
}

const outputDirectory = process.env.RUNNER_TEMP ?? '.tmp';
mkdirSync(outputDirectory, { recursive: true });
const uploadOutput = join(outputDirectory, 'wrangler-version-upload.jsonl');
writeFileSync(uploadOutput, '');
await wrangler(
  [
    'versions',
    'upload',
    '--name',
    workerName,
    '--strict',
    '--tag',
    sha,
    '--message',
    `GitHub ${sha}`,
  ],
  { env: { WRANGLER_OUTPUT_FILE_PATH: uploadOutput }, label: 'Worker version upload' },
);
const uploaded = readWranglerOutput(uploadOutput, 'version-upload');
assert(uploaded.version_id, 'uploaded Worker version has no ID');
assert(uploaded.preview_url, 'version preview URLs must be enabled for pre-deploy smoke tests');
const previewSmoke = await smoke(uploaded.preview_url, ['/'], 'preview');

const deployOutput = join(outputDirectory, 'wrangler-version-deploy.jsonl');
writeFileSync(deployOutput, '');
await wrangler(
  [
    'versions',
    'deploy',
    `${uploaded.version_id}@100%`,
    '--name',
    workerName,
    '--message',
    `Deploy ${deployTag}`,
    '--yes',
  ],
  { env: { WRANGLER_OUTPUT_FILE_PATH: deployOutput }, label: 'Worker version deploy' },
);
const deployed = readWranglerOutput(deployOutput, 'version-deploy');

let productionSmoke;
try {
  productionSmoke = await smoke(productionOrigin, ['/'], 'production');
} catch (error) {
  if (previousVersionId) {
    process.stderr.write(
      `Production smoke failed; restoring Worker version ${previousVersionId}. The tag stays in place and the drift check reports the divergence until a fix-forward deploy succeeds.\n`,
    );
    await wrangler([
      'versions',
      'deploy',
      `${previousVersionId}@100%`,
      '--name',
      workerName,
      '--message',
      `Automatic rollback after failed ${deployTag}`,
      '--yes',
    ]);
  }
  throw error;
}

const receipt = {
  schemaVersion: 1,
  repository: process.env.GITHUB_REPOSITORY,
  sourceSha: sha,
  tag: deployTag,
  version,
  build,
  workerName,
  workerVersionId: uploaded.version_id,
  deploymentId: deployed.deployment_id,
  previousWorkerVersionId: previousVersionId ?? null,
  previewSmoke,
  productionSmoke,
  deployedAt: new Date().toISOString(),
};
mkdirSync(dirname(receiptPath), { recursive: true });
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`Deployed ${deployTag} (${sha}) as Worker version ${uploaded.version_id}.\n`);
