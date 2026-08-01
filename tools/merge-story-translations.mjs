// Deterministically merges a pre-generated translations manifest for a new story into every
// public/i18n/<locale>.json file. The manifest itself (LocalStories/<slug>/translations.json,
// gitignored) is produced separately, by AI translation — this script only does the mechanical
// merge + validation, per docs/sdd task 3.
//
// Usage: node tools/merge-story-translations.mjs <slug>

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { loadEnglishContent } from './generate-seo-pages.mjs';

const ROOT = process.cwd();

/**
 * Reads CONTENT_LOCALES out of src/app/i18n/locale-registry.ts by regex, the same way
 * tools/seo-page-generator.test.mjs does — the .ts file is not directly importable by plain
 * Node, and compiling it would be overkill for a single array literal.
 */
export function getContentLocales(root = ROOT) {
  const registrySource = fs.readFileSync(
    path.join(root, 'src/app/i18n/locale-registry.ts'),
    'utf8',
  );
  const blockMatch = registrySource.match(
    /CONTENT_LOCALES: readonly LocaleCode\[\] = \[([\s\S]*?)\];/,
  );
  if (!blockMatch) {
    throw new Error('Could not find CONTENT_LOCALES array in locale-registry.ts');
  }
  return [...blockMatch[1].matchAll(/['"]([a-z]{2})['"]/g)].map((match) => match[1]);
}

/**
 * Validates that manifest.locales covers exactly the locales this script knows how to write
 * (CONTENT_LOCALES minus 'en' — English lives in en.content.ts, not a public/i18n/*.json file).
 * Reports every missing locale in one error, and every unrecognized one in another, rather than
 * failing on the first problem found.
 */
export function validateManifestLocales(manifestLocales, contentLocales) {
  const requiredLocales = contentLocales.filter((locale) => locale !== 'en');
  const provided = new Set(Object.keys(manifestLocales ?? {}));

  const missing = requiredLocales.filter((locale) => !provided.has(locale));
  if (missing.length) {
    throw new Error(
      `translations.json is missing required locale(s): ${missing.sort().join(', ')}`,
    );
  }

  const knownLocales = new Set(contentLocales);
  const unknown = [...provided].filter((locale) => !knownLocales.has(locale));
  if (unknown.length) {
    throw new Error(
      `translations.json contains unrecognized locale(s) not in CONTENT_LOCALES: ${unknown.sort().join(', ')}`,
    );
  }
}

/**
 * Checks a single locale's translation block has the shape mergeLocaleContent() depends on.
 * Without this, a missing field (e.g. manifest author forgot "story") would silently write
 * `undefined` into the merged object — JSON.stringify drops undefined properties instead of
 * erroring, which would corrupt the locale file quietly. Fail loudly instead.
 */
export function validateTranslationShape(locale, translation) {
  const problems = [];
  if (!translation || typeof translation !== 'object') {
    throw new Error(`translations.json locales.${locale} must be an object`);
  }
  if (typeof translation.nav !== 'string' || !translation.nav.trim()) {
    problems.push('nav (non-empty string)');
  }
  if (typeof translation.adventureTitle !== 'string' || !translation.adventureTitle.trim()) {
    problems.push('adventureTitle (non-empty string)');
  }
  if (typeof translation.adventureTeaser !== 'string' || !translation.adventureTeaser.trim()) {
    problems.push('adventureTeaser (non-empty string)');
  }
  if (!translation.story || typeof translation.story !== 'object') {
    problems.push('story (object)');
  }
  if (problems.length) {
    throw new Error(
      `translations.json locales.${locale} is missing/invalid field(s): ${problems.join(', ')}`,
    );
  }
}

/**
 * Finds the English adventures[] entry the manifest's top-level "link" refers to. link/image
 * are never taken from the manifest's (translated) locale blocks — they must be byte-identical
 * across every locale, so the real en.content.ts entry is the only source of truth.
 */
export function findEnglishAdventure(englishContent, link) {
  const match = englishContent.adventures.find((adventure) => adventure.link === link);
  if (!match) {
    throw new Error(
      `translations.json's "link" ("${link}") does not match any adventures[] entry in ` +
        `en.content.ts — copy the exact link from the English adventures[] entry for this story.`,
    );
  }
  return match;
}

/**
 * Pure merge: returns a new locale-content object with nav[storyKey], a new adventures[] entry,
 * and content[storyKey] inserted in the correct positions:
 * - nav[storyKey] is inserted in the same relative position as storyKey appears in en.content.ts
 *   (typically before blog/shop, per consistent key ordering across all locale files)
 * - adventures[] entry is appended at the end (array order reflects chronological story addition)
 * - content[storyKey] is inserted immediately before the blog key (matching precedent from
 *   theftAndDestruction and other stories in the source .ts file)
 */
export function mergeLocaleContent(localeContent, storyKey, localeTranslation, englishAdventure) {
  // Rebuild nav with the new story key inserted before 'blog' (or at the end if 'blog' doesn't exist).
  const nav = {};
  let navInserted = false;
  for (const key of Object.keys(localeContent.nav)) {
    if (key === 'blog' && !navInserted) {
      nav[storyKey] = localeTranslation.nav;
      navInserted = true;
    }
    nav[key] = localeContent.nav[key];
  }
  if (!navInserted) {
    nav[storyKey] = localeTranslation.nav;
  }

  // adventures[] entry is appended at the end (array order genuinely means story publication order).
  const adventures = [
    ...localeContent.adventures,
    {
      title: localeTranslation.adventureTitle,
      teaser: localeTranslation.adventureTeaser,
      link: englishAdventure.link,
      image: englishAdventure.image,
    },
  ];

  // Rebuild the top-level object with content[storyKey] inserted before 'blog'.
  const result = {};
  let contentInserted = false;
  for (const key of Object.keys(localeContent)) {
    if (key === 'blog' && !contentInserted) {
      result[storyKey] = localeTranslation.story;
      contentInserted = true;
    }
    if (key === 'nav') {
      result.nav = nav;
    } else if (key === 'adventures') {
      result.adventures = adventures;
    } else {
      result[key] = localeContent[key];
    }
  }
  if (!contentInserted) {
    result[storyKey] = localeTranslation.story;
  }

  return result;
}

/**
 * Orchestrates the full merge for one story slug: loads the manifest, validates it, loads
 * English content to resolve link/image, then merges + writes every required locale file.
 * Options exist purely for test isolation (temp directories, injected English content) —
 * production use (the CLI entrypoint below) relies entirely on the defaults.
 */
export async function mergeStoryTranslations(slug, options = {}) {
  const root = options.root ?? ROOT;
  const i18nDir = options.i18nDir ?? path.join(root, 'public/i18n');
  const manifestPath =
    options.manifestPath ?? path.join(root, 'LocalStories', slug, 'translations.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No translations manifest found at ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (typeof manifest.storyKey !== 'string' || !manifest.storyKey) {
    throw new Error('translations.json is missing a top-level "storyKey" string field');
  }
  if (typeof manifest.link !== 'string' || !manifest.link) {
    throw new Error('translations.json is missing a top-level "link" string field');
  }
  if (!manifest.locales || typeof manifest.locales !== 'object') {
    throw new Error('translations.json is missing a top-level "locales" object field');
  }

  const contentLocales = options.contentLocales ?? getContentLocales(root);
  validateManifestLocales(manifest.locales, contentLocales);

  const englishContent = options.englishContent ?? (await loadEnglishContent());
  const englishAdventure = findEnglishAdventure(englishContent, manifest.link);

  const requiredLocales = contentLocales.filter((locale) => locale !== 'en');
  for (const locale of requiredLocales) {
    validateTranslationShape(locale, manifest.locales[locale]);
  }

  // Read + validate every locale file up front, before writing any of them, so a problem found
  // partway through (missing file, already-merged story) fails the whole run instead of leaving
  // some locale files merged and others not.
  const localeReads = requiredLocales.map((locale) => {
    const localePath = path.join(i18nDir, `${locale}.json`);
    if (!fs.existsSync(localePath)) {
      throw new Error(`No locale file found at ${localePath}`);
    }
    const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    if (Object.prototype.hasOwnProperty.call(localeContent, manifest.storyKey)) {
      throw new Error(
        `${localePath} already has a top-level "${manifest.storyKey}" key — this story looks ` +
          `already merged. Refusing to overwrite; remove it first if you intend to re-run.`,
      );
    }
    return { locale, localePath, localeContent };
  });

  const mergedLocales = [];
  for (const { locale, localePath, localeContent } of localeReads) {
    const merged = mergeLocaleContent(
      localeContent,
      manifest.storyKey,
      manifest.locales[locale],
      englishAdventure,
    );
    fs.writeFileSync(localePath, JSON.stringify(merged, null, 2) + '\n');
    mergedLocales.push(locale);
  }

  return { storyKey: manifest.storyKey, link: manifest.link, locales: mergedLocales };
}

/**
 * Runs tools/validate-locales.mjs via execFileSync (array args, no shell string interpolation —
 * the slug never reaches this call, but this is also just the right way to shell out) and
 * surfaces its stdout. Returns whether it passed, so the caller can propagate a non-zero exit.
 */
function runLocaleValidation(root) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [path.join(root, 'tools/validate-locales.mjs')],
      { cwd: root, encoding: 'utf8' },
    );
    process.stdout.write(stdout);
    return true;
  } catch (error) {
    if (typeof error.stdout === 'string') process.stdout.write(error.stdout);
    if (typeof error.stderr === 'string') process.stderr.write(error.stderr);
    return false;
  }
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node tools/merge-story-translations.mjs <slug>');
    process.exitCode = 1;
    return;
  }
  if (!/^[\w-]+$/.test(slug)) {
    throw new Error(`Unsafe slug: ${slug}`);
  }

  const result = await mergeStoryTranslations(slug);
  console.log(
    `merge-story-translations: merged "${result.storyKey}" into ${result.locales.length} locale(s): ${result.locales.join(', ')}`,
  );

  const validationOk = runLocaleValidation(ROOT);
  if (!validationOk) {
    console.error(
      'merge-story-translations: validate-locales.mjs reported problems above — exiting non-zero.',
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
