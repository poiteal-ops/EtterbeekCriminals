// Helpers for translating the Catch the Criminal game and its How to Play guide.
//
// The game copy lives in EN_CONTENT.game (src/app/i18n/content/en.content.ts). A locale shows its own
// game once its public/i18n/<locale>.json has a top-level "game" block; until then the page shows English
// plus the English-only banner. These helpers keep that hand-off mechanical:
//
//   node tools/game-translations.mjs export [out.json]   write the English game block to translate
//   node tools/game-translations.mjs merge <manifest>    validate and merge translated blocks into the locale files
//   node tools/game-translations.mjs check [locale...]   validate the game block of the given (or all) locales
//
// Manifest shape: { "locales": { "fr": { ...translated game block... }, "de": { ... } } }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadEnglishContent } from './generate-seo-pages.mjs';

const ROOT = process.cwd();
const I18N_DIR = path.join(ROOT, 'public/i18n');
const DEFAULT_EXPORT = path.join(ROOT, 'LocalStories/game-translations/en.game.json');

const PLACEHOLDER = /\{(\w+)\}/g;

export function placeholdersOf(text) {
  return [...String(text).matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

/**
 * Compares a translated game block with the English one. Returns a list of problems (empty = valid):
 * missing/extra keys, wrong types, array length changes, blank strings, and any change to the
 * {placeholders} each string must keep.
 */
export function validateGameBlock(english, candidate, prefix = 'game', problems = []) {
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate) !== Array.isArray(english)) {
    problems.push(`TYPE ${prefix} should be ${Array.isArray(english) ? 'an array' : 'an object'}`);
    return problems;
  }
  if (Array.isArray(english)) {
    if (english.length !== candidate.length) problems.push(`LEN ${prefix} ref=${english.length} got=${candidate.length}`);
    english.forEach((value, index) => compareValue(value, candidate[index], `${prefix}[${index}]`, problems));
    return problems;
  }
  for (const key of Object.keys(english)) {
    if (!(key in candidate)) problems.push(`MISSING ${prefix}.${key}`);
  }
  for (const key of Object.keys(candidate)) {
    if (!(key in english)) problems.push(`EXTRA ${prefix}.${key}`);
  }
  for (const key of Object.keys(english)) {
    if (key in candidate) compareValue(english[key], candidate[key], `${prefix}.${key}`, problems);
  }
  return problems;
}

function compareValue(english, candidate, location, problems) {
  if (candidate === undefined) return;
  if (english !== null && typeof english === 'object') {
    validateGameBlock(english, candidate, location, problems);
  } else if (typeof english !== typeof candidate) {
    problems.push(`TYPE ${location} ref=${typeof english} got=${typeof candidate}`);
  } else if (typeof candidate === 'string') {
    if (candidate.trim() === '') problems.push(`EMPTY ${location}`);
    const wanted = placeholdersOf(english).join(',');
    const found = placeholdersOf(candidate).join(',');
    if (wanted !== found) problems.push(`PLACEHOLDERS ${location} must contain {${wanted.split(',').filter(Boolean).join('} {')}}`);
  }
}

/** The English game block as plain JSON (what a translator receives). */
export async function englishGameBlock() {
  const english = await loadEnglishContent();
  return JSON.parse(JSON.stringify(english.game));
}

/** Index just past the value that starts at `start` (an object brace) in JSON text; string-aware. */
function endOfObject(text, start) {
  let depth = 0;
  let inString = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (char === '\\') index++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return index + 1;
  }
  throw new Error('Unbalanced JSON object');
}

/**
 * Inserts or replaces the top-level "game" key in a locale JSON file's raw text. Works on the text, not
 * on a parsed object, so the rest of the file (and its CRLF/LF line endings) stays byte-for-byte unchanged.
 */
export function mergeGameBlock(rawText, gameBlock) {
  const eol = rawText.includes('\r\n') ? '\r\n' : '\n';
  const body = JSON.stringify(gameBlock, null, 2).split('\n').join(`${eol}  `);
  const entry = `"game": ${body}`;
  const existing = /^ {2}"game"\s*:\s*\{/m.exec(rawText);
  if (existing) {
    const objectStart = existing.index + existing[0].length - 1;
    const keyStart = existing.index + 2;
    return rawText.slice(0, keyStart) + entry + rawText.slice(endOfObject(rawText, objectStart));
  }
  const closing = rawText.lastIndexOf('}');
  const before = rawText.slice(0, closing).replace(/\s+$/, '');
  return `${before},${eol}  ${entry}${eol}${rawText.slice(closing)}`;
}

export function localeFiles(dir = I18N_DIR) {
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort();
}

export function checkLocales(english, locales, dir = I18N_DIR) {
  const report = {};
  for (const locale of locales) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), 'utf8'));
    report[locale] = data.game === undefined ? null : validateGameBlock(english, data.game);
  }
  return report;
}

export async function mergeManifest(manifest, dir = I18N_DIR) {
  const english = await englishGameBlock();
  const locales = Object.keys(manifest?.locales ?? {});
  if (!locales.length) throw new Error('Manifest "locales" is empty - nothing to merge.');
  const known = new Set(localeFiles(dir));
  const unknown = locales.filter((locale) => !known.has(locale));
  if (unknown.length) throw new Error(`Unknown locale(s): ${unknown.join(', ')}`);
  const failures = [];
  for (const locale of locales) {
    const problems = validateGameBlock(english, manifest.locales[locale]);
    if (problems.length) failures.push(`${locale}: ${problems.slice(0, 20).join('; ')}`);
  }
  if (failures.length) throw new Error(`Nothing written. Invalid game block(s):\n${failures.join('\n')}`);
  const pending = [];
  for (const locale of locales) {
    const file = path.join(dir, `${locale}.json`);
    const merged = mergeGameBlock(fs.readFileSync(file, 'utf8'), manifest.locales[locale]);
    JSON.parse(merged); // refuse to write anything that is not valid JSON
    pending.push([file, merged]);
  }
  for (const [file, merged] of pending) fs.writeFileSync(file, merged);
  return locales;
}

async function main(argv) {
  const [command, ...args] = argv;
  if (command === 'export') {
    const target = path.resolve(args[0] ?? DEFAULT_EXPORT);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(await englishGameBlock(), null, 2)}\n`);
    console.log(`English game block written to ${target}`);
  } else if (command === 'merge') {
    if (!args[0]) throw new Error('Usage: merge <manifest.json>');
    const written = await mergeManifest(JSON.parse(fs.readFileSync(path.resolve(args[0]), 'utf8')));
    console.log(`Merged game block into: ${written.join(', ')}`);
  } else if (command === 'check') {
    const english = await englishGameBlock();
    const report = checkLocales(english, args.length ? args : localeFiles());
    let failed = false;
    for (const [locale, problems] of Object.entries(report)) {
      if (problems === null) console.log(`${locale}: no game block (English fallback)`);
      else if (problems.length) { failed = true; console.log(`${locale}: ${problems.length} problem(s)`); problems.slice(0, 20).forEach((p) => console.log(`   ${p}`)); }
      else console.log(`${locale}: game OK`);
    }
    process.exit(failed ? 1 : 0);
  } else {
    console.log('Usage: node tools/game-translations.mjs export [out.json] | merge <manifest.json> | check [locale...]');
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exit(1); });
}

export const TOOL_PATH = fileURLToPath(import.meta.url);
