import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveLangset, selectLocales } from './generate-seo-pages.mjs';

test('resolveLangset: default resolves to en', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.LANGSET;

  try {
    // Clean argv and env
    process.argv = ['node', 'script.mjs'];
    delete process.env.LANGSET;

    assert.equal(resolveLangset(), 'en');
  } finally {
    process.argv = originalArgv;
    process.env.LANGSET = originalEnv;
  }
});

test('resolveLangset: env var LANGSET is used when set', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.LANGSET;

  try {
    process.argv = ['node', 'script.mjs'];
    process.env.LANGSET = 'fr';

    assert.equal(resolveLangset(), 'fr');
  } finally {
    process.argv = originalArgv;
    process.env.LANGSET = originalEnv;
  }
});

test('resolveLangset: CLI flag --langset= takes precedence over env var', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.LANGSET;

  try {
    process.argv = ['node', 'script.mjs', '--langset=de'];
    process.env.LANGSET = 'fr';

    assert.equal(resolveLangset(), 'de');
  } finally {
    process.argv = originalArgv;
    process.env.LANGSET = originalEnv;
  }
});

test('selectLocales: all returns every available locale', () => {
  const locales = ['en', 'fr', 'de', 'it'];
  const result = selectLocales('all', locales);
  assert.deepEqual(result, locales);
});

test('selectLocales: en-only default', () => {
  const locales = ['en', 'fr', 'de', 'it'];
  const result = selectLocales('en', locales);
  assert.deepEqual(result, ['en']);
});

test('selectLocales: delimited list with en force-included even if not listed', () => {
  const locales = ['en', 'fr', 'de', 'it'];
  const result = selectLocales('fr,de', locales);
  assert.deepEqual(result, ['en', 'fr', 'de']);
});

test('selectLocales: respects order from availableLocales, not request order', () => {
  const locales = ['en', 'de', 'fr', 'it'];
  const result = selectLocales('fr,de', locales);
  // Should preserve the order from availableLocales
  assert.deepEqual(result, ['en', 'de', 'fr']);
});

test('selectLocales: unknown locale in list throws', () => {
  const locales = ['en', 'fr', 'de'];
  assert.throws(
    () => selectLocales('fr,unknown', locales),
    /LANGSET requested unknown locale\(s\): unknown/,
  );
});

test('selectLocales: multiple unknown locales in error message', () => {
  const locales = ['en', 'fr', 'de'];
  assert.throws(
    () => selectLocales('fr,unknown1,unknown2', locales),
    /LANGSET requested unknown locale\(s\): unknown1, unknown2/,
  );
});

test('selectLocales: whitespace in delimited list is trimmed', () => {
  const locales = ['en', 'fr', 'de', 'it'];
  const result = selectLocales(' fr , de ', locales);
  assert.deepEqual(result, ['en', 'fr', 'de']);
});

test('selectLocales: empty string or whitespace-only input defaults to en', () => {
  const locales = ['en', 'fr', 'de'];
  const result = selectLocales('  ', locales);
  assert.deepEqual(result, ['en']);
});
