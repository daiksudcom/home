import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';

import { assertDeploymentMatchesTag, compareTagPrecedence, parseTag } from './policy-lib.mjs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/**
 * Build metadata carries no SemVer precedence, so tags are never ordered lexically or by
 * core alone. Commit topology decides which tag is newest and equal cores fall back to it.
 */
export function latestTag(tags, isAncestor) {
  let latest = null;
  for (const tag of tags) {
    parseTag(tag);
    if (latest === null) {
      latest = tag;
      continue;
    }
    const precedence = compareTagPrecedence(tag, latest);
    if (precedence > 0 || (precedence === 0 && isAncestor(latest, tag))) latest = tag;
  }
  return latest;
}

function resolveReceipt(repository) {
  const deployments = JSON.parse(
    execFileSync(
      'gh',
      ['api', `repos/${repository}/deployments?environment=production&per_page=100`],
      { encoding: 'utf8', env: process.env },
    ),
  );
  for (const deployment of deployments) {
    const statuses = JSON.parse(
      execFileSync(
        'gh',
        ['api', `repos/${repository}/deployments/${deployment.id}/statuses?per_page=1`],
        { encoding: 'utf8', env: process.env },
      ),
    );
    if (statuses[0]?.state !== 'success') continue;
    if (!deployment.payload || typeof deployment.payload !== 'object') continue;
    if (deployment.payload.sourceSha !== deployment.sha) continue;
    return deployment.payload;
  }
  return null;
}

if (process.argv[1]?.endsWith('drift-check.mjs')) {
  const repository = process.env.GITHUB_REPOSITORY;
  assert(repository, 'GITHUB_REPOSITORY is required');

  const tags = git(['tag', '--list', 'v*']).split('\n').filter(Boolean);
  assert(tags.length > 0, 'no release tag exists yet');

  const tag = latestTag(
    tags,
    (candidate, other) =>
      spawnSync('git', [
        'merge-base',
        '--is-ancestor',
        `${candidate}^{commit}`,
        `${other}^{commit}`,
      ]).status === 0,
  );
  const receipt = resolveReceipt(repository);
  assertDeploymentMatchesTag({ tag, receipt });
  process.stdout.write(`Latest tag ${tag} matches the deployed revision ${receipt.sourceSha}.\n`);
}
