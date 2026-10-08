import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkLocales, englishGameBlock, localeFiles, mergeGameBlock, mergeManifest, placeholdersOf, validateGameBlock } from './game-translations.mjs';

const english = await englishGameBlock();
const clone = (value) => JSON.parse(JSON.stringify(value));

test('the English game block validates against itself', () => {
  assert.deepEqual(validateGameBlock(english, clone(english)), []);
});

test('validation reports missing keys, extra keys, blanks, array length and placeholder changes', () => {
  const broken = clone(english);
  delete broken.title;
  broken.extraKey = 'x';
  broken.stop = '  ';
  broken.levelNames.pop();
  broken.piketteMessage = 'Pikette guards the object.'; // dropped {object}
  broken.share.textReached = 'I scored {score} at level {level}.'; // dropped {total}
  broken.objects.sofa = 5;
  const problems = validateGameBlock(english, broken).join('\n');
  assert.match(problems, /MISSING game\.title/);
  assert.match(problems, /EXTRA game\.extraKey/);
  assert.match(problems, /EMPTY game\.stop/);
  assert.match(problems, /LEN game\.levelNames/);
  assert.match(problems, /PLACEHOLDERS game\.piketteMessage/);
  assert.match(problems, /PLACEHOLDERS game\.share\.textReached/);
  assert.match(problems, /TYPE game\.objects\.sofa/);
});

test('placeholders are compared as a sorted set so translators may reorder them', () => {
  assert.deepEqual(placeholdersOf('{total} / {level} {score}'), ['level', 'score', 'total']);
  const reordered = clone(english);
  reordered.share.textReached = 'Level {level} of {total}: {score}';
  assert.deepEqual(validateGameBlock(english, reordered), []);
});

test('mergeGameBlock appends a game key, keeping CRLF line endings and every other byte', () => {
  const raw = '{\r\n  "nav": {\r\n    "home": "ACCUEIL"\r\n  }\r\n}\r\n';
  const merged = mergeGameBlock(raw, { title: 'JEU', list: ['a', 'b'] });
  assert.equal(JSON.parse(merged).game.title, 'JEU');
  assert.equal(JSON.parse(merged).nav.home, 'ACCUEIL');
  assert.ok(merged.startsWith(raw.slice(0, raw.lastIndexOf('}\r\n') - 2)));
  assert.equal(merged.includes('\r\n'), true);
  assert.equal(/[^\r]\n/.test(merged), false, 'no bare LF in a CRLF file');
  assert.ok(merged.endsWith('}\r\n'));
});

test('mergeGameBlock replaces an existing game block, including braces inside strings', () => {
  const raw = '{\n  "game": {\n    "title": "old } { \\" brace",\n    "inner": { "x": 1 }\n  },\n  "footer": "keep"\n}\n';
  const merged = mergeGameBlock(raw, { title: 'NEW' });
  const parsed = JSON.parse(merged);
  assert.deepEqual(parsed.game, { title: 'NEW' });
  assert.equal(parsed.footer, 'keep');
  assert.equal(merged.match(/"game"/g).length, 1);
});

test('mergeManifest validates everything first and writes nothing when one locale is invalid', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-game-merge-'));
  try {
    fs.writeFileSync(path.join(dir, 'fr.json'), '{\n  "nav": {}\n}\n');
    fs.writeFileSync(path.join(dir, 'de.json'), '{\n  "nav": {}\n}\n');
    const bad = clone(english);
    delete bad.title;
    await assert.rejects(mergeManifest({ locales: { fr: clone(english), de: bad } }, dir), /Nothing written[\s\S]*de:/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'fr.json'), 'utf8')).game, undefined);

    const written = await mergeManifest({ locales: { fr: clone(english) } }, dir);
    assert.deepEqual(written, ['fr']);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'fr.json'), 'utf8')).game, english);
    await assert.rejects(mergeManifest({ locales: { zz: clone(english) } }, dir), /Unknown locale/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('mergeManifest leaves earlier locale files untouched when a later existing file is malformed', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-game-preflight-'));
  try {
    const first = '{\n  "nav": {}\n}\n';
    fs.writeFileSync(path.join(dir, 'aa.json'), first);
    fs.writeFileSync(path.join(dir, 'bb.json'), '{ invalid existing JSON');
    await assert.rejects(mergeManifest({ locales: { aa: clone(english), bb: clone(english) } }, dir));
    assert.equal(fs.readFileSync(path.join(dir, 'aa.json'), 'utf8'), first);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every locale that already has a game block has a valid one', () => {
  const report = checkLocales(english, localeFiles());
  for (const [locale, problems] of Object.entries(report)) {
    if (problems !== null) assert.deepEqual(problems, [], `${locale}.json game block`);
  }
});
