import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { resolveTag, validateVersionBump } from './policy-lib.mjs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function packageVersion(revision) {
  const source =
    revision === null
      ? readFileSync('package.json', 'utf8')
      : git(['show', `${revision}:package.json`]);
  const { version } = JSON.parse(source);
  assert(version, 'package.json must declare a version');
  return version;
}

/**
 * The squashed subject is the durable record of intent, so it decides the required bump
 * instead of the branch name, which disappears once the pull request is merged.
 */
function validatePullRequest({ baseSha, subject }) {
  const result = validateVersionBump({
    previous: packageVersion(baseSha),
    next: packageVersion(null),
    subject,
  });
  process.stdout.write(
    `${result.impact} impact requires version ${result.expected}; the branch matches.\n`,
  );
  return result;
}

function resolveRevision(sha) {
  const previousTag = git(['describe', '--tags', '--abbrev=0', `${sha}^`, '--match', 'v*']).replace(
    /^v/,
    '',
  );
  const core = previousTag.split('+')[0];
  const subject = git(['show', '-s', '--format=%s', sha]);
  const result = validateVersionBump({ previous: core, next: packageVersion(sha), subject });
  const tag = resolveTag({
    version: result.expected,
    coreChanged: result.coreChanged,
    commitEpoch: git(['show', '-s', '--format=%ct', sha]),
  });
  return { ...result, tag, version: result.expected };
}

const [command, ...args] = process.argv.slice(2);

if (command === 'pull-request') {
  const baseSha = process.env.BASE_SHA;
  const subject = process.env.PR_TITLE;
  assert(baseSha, 'BASE_SHA is required');
  assert(subject, 'PR_TITLE is required');
  validatePullRequest({ baseSha, subject });
} else if (command === 'revision') {
  const sha = args[0] ?? process.env.GITHUB_SHA;
  assert(sha, 'a commit SHA is required');
  const { tag, version, coreChanged } = resolveRevision(sha);
  process.stdout.write(`${JSON.stringify({ tag, version, coreChanged })}\n`);
} else {
  process.stderr.write('usage: policy.mjs <pull-request|revision [sha]>\n');
  process.exit(1);
}
