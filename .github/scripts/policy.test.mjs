import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertDeploymentMatchesTag,
  classifyProcessFailure,
  compareTagPrecedence,
  isRetriableFailure,
  parseTag,
  requiredVersion,
  resolveTag,
  utcBuildTimestamp,
  validateVersionBump,
  versionImpact,
} from './policy-lib.mjs';

test('conventional commit types map to the intended version impact', () => {
  assert.equal(versionImpact('feat: add a feed'), 'minor');
  assert.equal(versionImpact('perf: cache the feed'), 'minor');
  assert.equal(versionImpact('fix: correct the feed'), 'patch');
  assert.equal(versionImpact('revert: undo the feed'), 'patch');
  for (const type of ['docs', 'chore', 'ci', 'test', 'build', 'refactor', 'style']) {
    assert.equal(versionImpact(`${type}: adjust things`), 'none');
  }
  assert.equal(versionImpact('feat(api)!: drop the legacy route'), 'major');
  assert.equal(versionImpact('feat: rework\n\nBREAKING CHANGE: removed'), 'major');
  assert.throws(() => versionImpact('unknown: something'), /unsupported commit type/);
  assert.throws(() => versionImpact('no conventional prefix'), /not a Conventional Commit/);
});

test('a zero major keeps breaking changes inside a minor bump', () => {
  assert.equal(requiredVersion('0.1.0', 'major'), '0.2.0');
  assert.equal(requiredVersion('1.4.2', 'major'), '2.0.0');
  assert.equal(requiredVersion('0.1.0', 'minor'), '0.2.0');
  assert.equal(requiredVersion('0.1.0', 'patch'), '0.1.1');
  assert.equal(requiredVersion('0.1.0', 'none'), '0.1.0');
});

test('the pull request subject decides the required version bump', () => {
  assert.deepEqual(
    validateVersionBump({ previous: '0.1.0', next: '0.2.0', subject: 'feat: add' }),
    {
      impact: 'minor',
      expected: '0.2.0',
      coreChanged: true,
    },
  );
  assert.deepEqual(
    validateVersionBump({ previous: '0.1.0', next: '0.1.0', subject: 'docs: tidy' }),
    { impact: 'none', expected: '0.1.0', coreChanged: false },
  );
  assert.throws(
    () => validateVersionBump({ previous: '0.1.0', next: '0.1.1', subject: 'feat: add' }),
    /requires a minor bump to 0\.2\.0/,
  );
  assert.throws(
    () => validateVersionBump({ previous: '0.1.0', next: '0.2.0', subject: 'docs: tidy' }),
    /must not change the version/,
  );
});

test('the build identifier is derived from the commit so retries reuse one tag', () => {
  const commitEpoch = 1786593730;
  assert.equal(utcBuildTimestamp(commitEpoch), '20260813040210');
  assert.equal(utcBuildTimestamp('1786593730'), '20260813040210');
  assert.equal(utcBuildTimestamp(1_000_000), '19700112134640');

  const first = resolveTag({ version: '0.1.0', coreChanged: false, commitEpoch });
  const retry = resolveTag({ version: '0.1.0', coreChanged: false, commitEpoch });
  assert.equal(first, 'v0.1.0+20260813040210');
  assert.equal(first, retry);
  assert.equal(resolveTag({ version: '0.2.0', coreChanged: true, commitEpoch }), 'v0.2.0');
  assert.throws(() => utcBuildTimestamp('not-an-epoch'), /invalid commit epoch/);
});

test('tags are never ordered lexically because build metadata carries no precedence', () => {
  assert.deepEqual(parseTag('v0.2.0'), { core: '0.2.0', build: null });
  assert.deepEqual(parseTag('v0.2.0+20260813040210'), { core: '0.2.0', build: '20260813040210' });
  assert.equal(compareTagPrecedence('v0.2.0+20260813040210', 'v0.2.0'), 0);
  assert.ok(compareTagPrecedence('v0.10.0', 'v0.9.0') > 0);
  assert.ok('v0.10.0' < 'v0.9.0', 'the lexical order this guards against still holds');
  assert.throws(() => parseTag('0.2.0'), /must start with v/);
  assert.throws(() => parseTag('v0.2.0+2026'), /YYYYMMDDHHmmss/);
});

test('only external failures are retried', () => {
  for (const status of [500, 502, 503, 504, 429]) {
    assert.equal(isRetriableFailure({ status }), true, `${status} is transient`);
  }
  for (const status of [400, 401, 403, 404, 409, 422]) {
    assert.equal(isRetriableFailure({ status }), false, `${status} is caused by our own inputs`);
  }
  for (const code of ['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ENOTFOUND']) {
    assert.equal(isRetriableFailure({ code }), true, `${code} is transient`);
  }
  assert.equal(isRetriableFailure({ code: 'ERR_INVALID_ARG_TYPE' }), false);
  assert.equal(isRetriableFailure({}), false);
});

test('wrangler output is classified before anything is retried', () => {
  const transient = [
    'A request to the Cloudflare API failed with status 503',
    'HTTP 502 Bad Gateway',
    'Too Many Requests',
    'Error: connect ETIMEDOUT 104.16.0.1:443',
    'FetchError: request failed, reason: socket hang up',
    'Service Unavailable',
  ];
  for (const output of transient) {
    assert.equal(
      isRetriableFailure(classifyProcessFailure(output)),
      true,
      `expected a retry for: ${output}`,
    );
  }

  const internal = [
    'Authentication error [code: 10000]',
    'A request to the Cloudflare API failed with status 403',
    'HTTP 401 Unauthorized',
    'Missing entry-point: wrangler.toml was not found',
    "ParseError: Unexpected token '<'",
    'Error: Build failed with 3 errors',
  ];
  for (const output of internal) {
    assert.equal(
      isRetriableFailure(classifyProcessFailure(output)),
      false,
      `expected no retry for: ${output}`,
    );
  }
});

test('the latest tag must equal the deployed version', () => {
  assertDeploymentMatchesTag({ tag: 'v0.2.0', receipt: { version: '0.2.0', build: null } });
  assertDeploymentMatchesTag({
    tag: 'v0.2.0+20260813040210',
    receipt: { version: '0.2.0', build: '20260813040210' },
  });
  assert.throws(
    () => assertDeploymentMatchesTag({ tag: 'v0.3.0', receipt: { version: '0.2.0' } }),
    /does not match the deployed version/,
  );
  assert.throws(
    () =>
      assertDeploymentMatchesTag({
        tag: 'v0.2.0+20260813040210',
        receipt: { version: '0.2.0', build: '20260813040000' },
      }),
    /does not match the deployed build/,
  );
  assert.throws(
    () => assertDeploymentMatchesTag({ tag: 'v0.2.0', receipt: null }),
    /no successful production deployment receipt/,
  );
});
