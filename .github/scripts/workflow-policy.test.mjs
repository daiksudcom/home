import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { latestTag } from './drift-check.mjs';

const workflowDirectory = '.github/workflows';
const workflows = readdirSync(workflowDirectory).filter((name) => name.endsWith('.yml'));

/**
 * The comment beside a pin is the only human-readable record of what was reviewed, so a
 * mislabeled version is treated as a supply chain defect rather than a cosmetic mistake.
 */
const REVIEWED_ACTION_PINS = new Map([
  ['actions/checkout', { sha: '3d3c42e5aac5ba805825da76410c181273ba90b1', version: 'v7.0.1' }],
  ['actions/setup-node', { sha: '53b83947a5a98c8d113130e565377fae1a50d02f', version: 'v6.3.0' }],
  ['pnpm/action-setup', { sha: '41ff72655975bd51cab0327fa583b6e92b6d3061', version: 'v4.2.0' }],
  [
    'actions/upload-artifact',
    { sha: '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a', version: 'v7.0.1' },
  ],
  ['actions/labeler', { sha: 'bf12e9b00b37c5c0ca2b87b79b2daf7891dbda13', version: 'v7.0.0' }],
]);

test('every external action is pinned to a full commit SHA', () => {
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    for (const match of source.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
      if (match[1].startsWith('./')) continue;
      assert.match(match[1], /^[^@]+@[0-9a-f]{40}$/, `${filename}: ${match[1]} is not immutable`);
    }
  }
});

test('pinned SHAs agree with the version recorded beside them', () => {
  const seen = new Set();
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    for (const [, action, sha, comment] of source.matchAll(
      /uses:\s*([^@\s]+)@([0-9a-f]{40})\s*#\s*(\S+)/g,
    )) {
      const reviewed = REVIEWED_ACTION_PINS.get(action);
      assert(reviewed, `${filename}: ${action} has no reviewed pin on record`);
      assert.equal(sha, reviewed.sha, `${filename}: ${action} is pinned to an unreviewed SHA`);
      assert.equal(
        comment,
        reviewed.version,
        `${filename}: ${action}@${sha} is ${reviewed.version}, not ${comment}`,
      );
      seen.add(action);
    }
  }
  assert.ok(seen.size > 0, 'no pinned actions were inspected');
});

test('privileged labeler never checks out or executes pull request code', () => {
  const source = readFileSync(join(workflowDirectory, 'labeler.yml'), 'utf8');
  assert.doesNotMatch(source, /actions\/checkout/);
  assert.doesNotMatch(source, /^\s+run:/m);
  assert.match(source, /pull_request_target:/);
  assert.match(source, /pull-requests: write/);
});

test('deploy keeps the running job, gates itself, and never touches feature flags', () => {
  const source = readFileSync(join(workflowDirectory, 'deploy.yml'), 'utf8');
  assert.match(source, /cancel-in-progress: false/);
  assert.match(source, /vars\.DEPLOY_ENABLED == 'true'/);
  assert.match(source, /workflow_dispatch:/, 'a failed deploy must be retriable by hand');
  assert.match(source, /CLOUDFLARE_DEPLOY_API_TOKEN/);
  assert.doesNotMatch(source, /FLAGSHIP/i, 'feature flags belong to the flags repository');
  assert.doesNotMatch(source, /RELEASE_ENABLED/, 'product release no longer happens here');
});

test('tagging and deploying stay in one workflow and survive a replay', () => {
  const source = readFileSync(join(workflowDirectory, 'deploy.yml'), 'utf8');
  assert.match(source, /policy\.mjs revision/, 'the tag is derived from the revision');
  assert.match(source, /already exists for this revision/, 'a replay must not create a second tag');
  assert.match(source, /refusing to move it/, 'an existing tag must never be moved');
  assert.match(source, /already exists; continuing/, 'the release step must be idempotent');
  assert.match(source, /drift-check\.mjs/, 'the run proves the latest tag matches production');
  assert.match(
    source,
    /if: steps\.tag\.outputs\.core-changed == 'true'/,
    'build identifiers must not create a GitHub Release',
  );
  assert.equal(
    workflows.includes('release.yml'),
    false,
    'a separate release workflow could never be triggered by a GITHUB_TOKEN tag push',
  );
});

test('no feature flag or release descriptor contract remains in this repository', () => {
  const entries = readdirSync('.github');
  assert.equal(entries.includes('features'), false);
  assert.equal(entries.includes('releases'), false);
  for (const filename of readdirSync('.github/scripts')) {
    if (filename.endsWith('.test.mjs')) continue;
    const source = readFileSync(join('.github/scripts', filename), 'utf8');
    assert.doesNotMatch(source, /flagship/i, `${filename} still references Cloudflare Flagship`);
  }
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    assert.doesNotMatch(source, /flagship/i, `${filename} still references Cloudflare Flagship`);
  }
});

test('the newest tag is decided by precedence and topology, never lexically', () => {
  const never = () => false;
  assert.equal(latestTag(['v0.9.0', 'v0.10.0'], never), 'v0.10.0');
  assert.ok('v0.10.0' < 'v0.9.0', 'the lexical order this guards against still holds');

  // Equal cores carry equal precedence, so only the commit graph can break the tie.
  const ordered = new Set(['v0.2.0|v0.2.0+20260813040210']);
  assert.equal(
    latestTag(['v0.2.0', 'v0.2.0+20260813040210'], (candidate, other) =>
      ordered.has(`${candidate}|${other}`),
    ),
    'v0.2.0+20260813040210',
  );
  assert.equal(latestTag(['v0.2.0', 'v0.2.0+20260813040210'], never), 'v0.2.0');
});

test('repository reconciliation is additive and release notes keep the category order', () => {
  const settings = readFileSync('.github/settings.yml', 'utf8');
  assert.match(settings, /labels: additive/);
  assert.match(settings, /rulesets: additive/);

  const release = readFileSync('.github/release.yml', 'utf8');
  const titles = [...release.matchAll(/^\s+- title: ['"]([^'"]+)['"]/gm)].map((match) => match[1]);
  assert.deepEqual(titles, [
    '💥 BREAKING CHANGE',
    '⚠️ DEPRECATED',
    '🚀 Features',
    '🐛 Bug Fixes',
    '⏪ Reverts',
    '📝 Documentation',
    '🧹 Maintenance',
    '🔧 Other Changes',
  ]);
});
