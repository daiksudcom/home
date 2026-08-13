import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY;
const receiptPath = process.env.DEPLOYMENT_RECEIPT_PATH;
assert(repository, 'GITHUB_REPOSITORY is required');
assert(receiptPath, 'DEPLOYMENT_RECEIPT_PATH is required');
const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
assert.equal(receipt.sourceSha, process.env.GITHUB_SHA, 'receipt source SHA differs from this run');

function gh(args, input) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    env: process.env,
    input: input ? `${JSON.stringify(input)}\n` : undefined,
  });
}

const deployment = JSON.parse(
  gh(['api', '--method', 'POST', `repos/${repository}/deployments`, '--input', '-'], {
    ref: receipt.sourceSha,
    environment: 'production',
    auto_merge: false,
    required_contexts: [],
    production_environment: true,
    payload: receipt,
  }),
);
gh(
  [
    'api',
    '--method',
    'POST',
    `repos/${repository}/deployments/${deployment.id}/statuses`,
    '--input',
    '-',
  ],
  {
    state: 'success',
    environment_url: process.env.PRODUCTION_ORIGIN,
    log_url: `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    description: `Production smoke passed for ${receipt.tag}`,
  },
);
process.stdout.write(`${deployment.id}\n`);
