import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  findEnglishAdventure,
  getContentLocales,
  mergeLocaleContent,
  mergeStoryTranslations,
  validateManifestLocales,
  validateTranslationShape,
} from './merge-story-translations.mjs';

function fixtureEnglishContent() {
  return {
    adventures: [
      { title: 'THE COUCH', teaser: 'A slow demolition.', link: '/couch', image: 'assets/images/couch.jpg' },
      {
        title: 'THEFT AND DESTRUCTION',
        teaser: 'A shoe, recovered separately.',
        link: '/theft-and-destruction',
        image: 'assets/images/theft-shoe.jpg',
      },
    ],
  };
}

function fixtureLocaleContent(prefix) {
  return {
    nav: { home: `${prefix} HOME`, couch: `${prefix} COUCH` },
    home: { tagline: `${prefix} tagline` },
    adventures: [
      { title: `${prefix} COUCH`, teaser: `${prefix} teaser`, link: '/couch', image: 'assets/images/couch.jpg' },
    ],
    footer: `${prefix} footer`,
  };
}

// --- Pure unit tests -------------------------------------------------------

test('mergeLocaleContent inserts nav/adventures/content keys without disturbing existing keys', () => {
  const localeContent = fixtureLocaleContent('FR');
  const englishAdventure = fixtureEnglishContent().adventures[1];
  const translation = {
    nav: 'VOL ET DESTRUCTION',
    adventureTitle: 'VOL ET DESTRUCTION',
    adventureTeaser: 'Une chaussure, récupérée séparément.',
    story: { kicker: 'Dossier', title: 'VOL ET DESTRUCTION' },
  };

  const merged = mergeLocaleContent(localeContent, 'theftAndDestruction', translation, englishAdventure);

  // Existing keys untouched.
  assert.equal(merged.nav.home, 'FR HOME');
  assert.equal(merged.nav.couch, 'FR COUCH');
  assert.equal(merged.home.tagline, 'FR tagline');
  assert.equal(merged.footer, 'FR footer');
  assert.equal(merged.adventures[0].title, 'FR COUCH');

  // New keys inserted correctly.
  assert.equal(merged.nav.theftAndDestruction, 'VOL ET DESTRUCTION');
  assert.equal(merged.adventures.length, 2);
  assert.deepEqual(merged.adventures[1], {
    title: 'VOL ET DESTRUCTION',
    teaser: 'Une chaussure, récupérée séparément.',
    link: '/theft-and-destruction',
    image: 'assets/images/theft-shoe.jpg',
  });
  assert.deepEqual(merged.theftAndDestruction, { kicker: 'Dossier', title: 'VOL ET DESTRUCTION' });

  // Original object not mutated.
  assert.equal(localeContent.adventures.length, 1);
  assert.equal(localeContent.nav.theftAndDestruction, undefined);
});

test('mergeLocaleContent takes link/image from the English adventure, ignoring whatever the manifest supplies for those fields', () => {
  const localeContent = fixtureLocaleContent('DE');
  const englishAdventure = fixtureEnglishContent().adventures[1];
  const translation = {
    nav: 'DIEBSTAHL',
    adventureTitle: 'DIEBSTAHL',
    adventureTeaser: 'Ein Schuh.',
    story: { kicker: 'Akte' },
    // A manifest author should never be able to override link/image this way.
    link: '/some-other-translated-slug',
    image: 'assets/images/wrong-image.jpg',
  };

  const merged = mergeLocaleContent(localeContent, 'theftAndDestruction', translation, englishAdventure);

  assert.equal(merged.adventures[1].link, '/theft-and-destruction');
  assert.equal(merged.adventures[1].image, 'assets/images/theft-shoe.jpg');
});

test('validateManifestLocales throws naming every missing locale at once', () => {
  const contentLocales = ['en', 'fr', 'de', 'nl'];
  assert.throws(
    () => validateManifestLocales({ fr: {} }, contentLocales),
    /missing required locale\(s\): de, nl/,
  );
});

test('validateManifestLocales throws on an unrecognized locale key not in CONTENT_LOCALES', () => {
  const contentLocales = ['en', 'fr', 'de'];
  assert.throws(
    () => validateManifestLocales({ fr: {}, de: {}, xx: {} }, contentLocales),
    /unrecognized locale\(s\).*xx/,
  );
});

test('validateManifestLocales passes when every required locale is present, extras ignored if known', () => {
  const contentLocales = ['en', 'fr', 'de'];
  assert.doesNotThrow(() => validateManifestLocales({ fr: {}, de: {}, en: {} }, contentLocales));
});

test('findEnglishAdventure throws a clear error when the manifest link matches no English adventures[] entry', () => {
  assert.throws(
    () => findEnglishAdventure(fixtureEnglishContent(), '/does-not-exist'),
    /does not match any adventures\[\] entry/,
  );
});

test('findEnglishAdventure returns the matching entry', () => {
  const match = findEnglishAdventure(fixtureEnglishContent(), '/couch');
  assert.equal(match.title, 'THE COUCH');
});

test('validateTranslationShape throws when required fields are missing', () => {
  assert.throws(
    () => validateTranslationShape('fr', { nav: 'X', adventureTitle: 'Y' }),
    /adventureTeaser.*story|story.*adventureTeaser/,
  );
});

test('validateTranslationShape accepts a well-formed translation block', () => {
  assert.doesNotThrow(() =>
    validateTranslationShape('fr', {
      nav: 'X',
      adventureTitle: 'Y',
      adventureTeaser: 'Z',
      story: { kicker: 'k' },
    }),
  );
});

// --- Orchestrator tests, using temp directories -----------------------------

function setupTempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thieffry-merge-'));
  fs.mkdirSync(path.join(root, 'src/app/i18n'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/i18n'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'src/app/i18n/locale-registry.ts'),
    `export const CONTENT_LOCALES: readonly LocaleCode[] = [\n  'en',\n  'fr',\n  'de',\n];\n`,
  );
  fs.writeFileSync(
    path.join(root, 'public/i18n/fr.json'),
    JSON.stringify(fixtureLocaleContent('FR'), null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(root, 'public/i18n/de.json'),
    JSON.stringify(fixtureLocaleContent('DE'), null, 2) + '\n',
  );
  return root;
}

function writeManifest(root, slug, manifest) {
  const dir = path.join(root, 'LocalStories', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'translations.json'), JSON.stringify(manifest, null, 2));
}

test('mergeStoryTranslations merges a manifest into every required locale file on disk', async () => {
  const root = setupTempRepo();
  try {
    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        de: {
          nav: 'DIEBSTAHL',
          adventureTitle: 'DIEBSTAHL',
          adventureTeaser: 'Ein Schuh.',
          story: { kicker: 'Akte' },
        },
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    const result = await mergeStoryTranslations('theft-and-destruction', {
      root,
      englishContent: fixtureEnglishContent(),
    });

    assert.deepEqual(result, {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: ['fr', 'de'],
    });

    const frOnDisk = JSON.parse(fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8'));
    assert.equal(frOnDisk.nav.theftAndDestruction, 'VOL ET DESTRUCTION');
    assert.equal(frOnDisk.adventures.length, 2);
    assert.equal(frOnDisk.adventures[1].link, '/theft-and-destruction');
    assert.equal(frOnDisk.adventures[1].image, 'assets/images/theft-shoe.jpg');
    assert.deepEqual(frOnDisk.theftAndDestruction, { kicker: 'Dossier' });
    // Existing content untouched.
    assert.equal(frOnDisk.footer, 'FR footer');

    const deOnDisk = JSON.parse(fs.readFileSync(path.join(root, 'public/i18n/de.json'), 'utf8'));
    assert.equal(deOnDisk.nav.theftAndDestruction, 'DIEBSTAHL');

    // Written with 2-space indent and trailing newline, matching the rest of public/i18n.
    const raw = fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8');
    assert.match(raw, /\n$/);
    assert.match(raw, /^\{\n  "nav": \{/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations throws (and writes nothing) when the manifest is missing a required locale', async () => {
  const root = setupTempRepo();
  try {
    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        // de missing
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    await assert.rejects(
      mergeStoryTranslations('theft-and-destruction', { root, englishContent: fixtureEnglishContent() }),
      /missing required locale\(s\): de/,
    );

    const frOnDisk = fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8');
    assert.doesNotMatch(frOnDisk, /theftAndDestruction/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations throws on an unrecognized locale key in the manifest', async () => {
  const root = setupTempRepo();
  try {
    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        de: {
          nav: 'DIEBSTAHL',
          adventureTitle: 'DIEBSTAHL',
          adventureTeaser: 'Ein Schuh.',
          story: { kicker: 'Akte' },
        },
        xx: {
          nav: 'BOGUS',
          adventureTitle: 'BOGUS',
          adventureTeaser: 'BOGUS',
          story: { kicker: 'bogus' },
        },
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    await assert.rejects(
      mergeStoryTranslations('theft-and-destruction', { root, englishContent: fixtureEnglishContent() }),
      /unrecognized locale\(s\).*xx/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations throws when the manifest link matches no English adventures[] entry', async () => {
  const root = setupTempRepo();
  try {
    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/no-such-story',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        de: {
          nav: 'DIEBSTAHL',
          adventureTitle: 'DIEBSTAHL',
          adventureTeaser: 'Ein Schuh.',
          story: { kicker: 'Akte' },
        },
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    await assert.rejects(
      mergeStoryTranslations('theft-and-destruction', { root, englishContent: fixtureEnglishContent() }),
      /does not match any adventures\[\] entry/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations refuses to re-merge a story that already has a top-level key in a locale file', async () => {
  const root = setupTempRepo();
  try {
    // Simulate fr.json already having been merged in a previous run.
    const frPath = path.join(root, 'public/i18n/fr.json');
    const frContent = JSON.parse(fs.readFileSync(frPath, 'utf8'));
    frContent.theftAndDestruction = { kicker: 'already here' };
    fs.writeFileSync(frPath, JSON.stringify(frContent, null, 2) + '\n');

    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        de: {
          nav: 'DIEBSTAHL',
          adventureTitle: 'DIEBSTAHL',
          adventureTeaser: 'Ein Schuh.',
          story: { kicker: 'Akte' },
        },
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    await assert.rejects(
      mergeStoryTranslations('theft-and-destruction', { root, englishContent: fixtureEnglishContent() }),
      /already has a top-level "theftAndDestruction" key/,
    );

    // de.json must be untouched too — the pre-flight check must run for every locale before any
    // locale file is written, so a collision found on fr does not leave de half-merged.
    const deOnDisk = fs.readFileSync(path.join(root, 'public/i18n/de.json'), 'utf8');
    assert.doesNotMatch(deOnDisk, /DIEBSTAHL/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations writes nothing if a later locale in the set fails validation (no partial writes)', async () => {
  const root = setupTempRepo();
  try {
    // de.json is missing on disk entirely — fr comes first alphabetically-ish in requiredLocales
    // (['fr', 'de'] per the fixture registry) so this proves the pre-flight read pass catches the
    // problem on locale #2 before locale #1 has been written.
    fs.rmSync(path.join(root, 'public/i18n/de.json'));

    const manifest = {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: {
        fr: {
          nav: 'VOL ET DESTRUCTION',
          adventureTitle: 'VOL ET DESTRUCTION',
          adventureTeaser: 'Une chaussure.',
          story: { kicker: 'Dossier' },
        },
        de: {
          nav: 'DIEBSTAHL',
          adventureTitle: 'DIEBSTAHL',
          adventureTeaser: 'Ein Schuh.',
          story: { kicker: 'Akte' },
        },
      },
    };
    writeManifest(root, 'theft-and-destruction', manifest);

    await assert.rejects(
      mergeStoryTranslations('theft-and-destruction', { root, englishContent: fixtureEnglishContent() }),
      /No locale file found/,
    );

    const frOnDisk = fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8');
    assert.doesNotMatch(frOnDisk, /theftAndDestruction/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations throws a clear error when the manifest file is missing', async () => {
  const root = setupTempRepo();
  try {
    await assert.rejects(
      mergeStoryTranslations('no-such-slug', { root, englishContent: fixtureEnglishContent() }),
      /No translations manifest found/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('getContentLocales parses CONTENT_LOCALES out of a real locale-registry.ts-shaped file', () => {
  const root = setupTempRepo();
  try {
    assert.deepEqual(getContentLocales(root), ['en', 'fr', 'de']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('getContentLocales matches the real project locale-registry.ts (sanity check against production)', () => {
  const locales = getContentLocales(process.cwd());
  assert.ok(locales.includes('en'));
  assert.ok(locales.includes('fr'));
  assert.equal(locales.length, 20);
});
