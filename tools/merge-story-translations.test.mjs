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

test('mergeLocaleContent inserts the story key before blog in the top-level object, matching precedent', () => {
  // Fixture with blog and footer to test insertion position.
  const localeContent = {
    nav: { home: 'HOME', couch: 'COUCH', blog: 'BLOG' },
    home: { tagline: 'tagline' },
    adventures: [{ title: 'COUCH', teaser: 'teaser', link: '/couch', image: 'assets/images/couch.jpg' }],
    couch: { kicker: 'Property damage', title: 'THE COUCH' },
    blog: { title: 'CASE LOG' },
    footer: 'footer text',
  };
  const englishAdventure = { title: 'THEFT', teaser: 'A shoe.', link: '/theft-and-destruction', image: 'assets/images/theft-shoe.jpg' };
  const translation = {
    nav: 'VOL',
    adventureTitle: 'VOL',
    adventureTeaser: 'Une chaussure.',
    story: { kicker: 'Dossier', title: 'VOL' },
  };

  const merged = mergeLocaleContent(localeContent, 'theft', translation, englishAdventure);

  // Verify key order: theft should come before blog, and blog should come before footer.
  const keys = Object.keys(merged);
  const theftIdx = keys.indexOf('theft');
  const blogIdx = keys.indexOf('blog');
  const footerIdx = keys.indexOf('footer');
  assert.ok(theftIdx >= 0, 'theft key should be in merged object');
  assert.ok(theftIdx < blogIdx, 'theft key should come before blog');
  assert.ok(blogIdx < footerIdx, 'blog should come before footer');
});

test('mergeLocaleContent inserts nav keys in the same position (before blog) when blog exists in nav', () => {
  // Fixture with nav including blog and shop to test nav insertion position.
  const localeContent = {
    nav: { home: 'HOME', couch: 'COUCH', blog: 'BLOG', shop: 'SHOP' },
    home: { tagline: 'tagline' },
    adventures: [{ title: 'COUCH', teaser: 'teaser', link: '/couch', image: 'assets/images/couch.jpg' }],
    couch: { kicker: 'Property damage', title: 'THE COUCH' },
    blog: { title: 'CASE LOG' },
    footer: 'footer text',
  };
  const englishAdventure = { title: 'THEFT', teaser: 'A shoe.', link: '/theft-and-destruction', image: 'assets/images/theft-shoe.jpg' };
  const translation = {
    nav: 'VOL',
    adventureTitle: 'VOL',
    adventureTeaser: 'Une chaussure.',
    story: { kicker: 'Dossier', title: 'VOL' },
  };

  const merged = mergeLocaleContent(localeContent, 'theft', translation, englishAdventure);

  // Verify nav key order: theft should come before blog and shop.
  const navKeys = Object.keys(merged.nav);
  const theftNavIdx = navKeys.indexOf('theft');
  const blogNavIdx = navKeys.indexOf('blog');
  const shopNavIdx = navKeys.indexOf('shop');
  assert.ok(theftNavIdx >= 0, 'theft key should be in nav');
  assert.ok(theftNavIdx < blogNavIdx, 'theft nav key should come before blog');
  assert.ok(blogNavIdx < shopNavIdx, 'blog should come before shop in nav');
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

test('validateManifestLocales does not throw when the manifest covers only a subset of locales (a top-up run)', () => {
  const contentLocales = ['en', 'fr', 'de', 'nl'];
  assert.doesNotThrow(() => validateManifestLocales({ nl: {} }, contentLocales));
});

test('validateManifestLocales throws when the locales object is empty', () => {
  const contentLocales = ['en', 'fr', 'de', 'nl'];
  assert.throws(
    () => validateManifestLocales({}, contentLocales),
    /locales.*empty|no locales/i,
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
      skipped: [],
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

test('mergeStoryTranslations merges only the locales present in the manifest, leaving the rest of CONTENT_LOCALES untouched (a top-up run)', async () => {
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
        // de intentionally omitted — this manifest only tops up fr.
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
      locales: ['fr'],
      skipped: [],
    });

    const frOnDisk = JSON.parse(fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8'));
    assert.equal(frOnDisk.nav.theftAndDestruction, 'VOL ET DESTRUCTION');

    // de.json was never in the manifest, so it must be byte-identical to its pre-run state.
    const deOnDisk = fs.readFileSync(path.join(root, 'public/i18n/de.json'), 'utf8');
    assert.doesNotMatch(deOnDisk, /theftAndDestruction/);
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

test('mergeStoryTranslations skips a locale that already has the story key and merges the rest, without erroring (idempotent top-up)', async () => {
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

    const result = await mergeStoryTranslations('theft-and-destruction', {
      root,
      englishContent: fixtureEnglishContent(),
    });

    assert.deepEqual(result, {
      storyKey: 'theftAndDestruction',
      link: '/theft-and-destruction',
      locales: ['de'],
      skipped: ['fr'],
    });

    // fr.json is untouched — still whatever the previous run left it as, not overwritten.
    const frOnDisk = JSON.parse(fs.readFileSync(path.join(root, 'public/i18n/fr.json'), 'utf8'));
    assert.deepEqual(frOnDisk.theftAndDestruction, { kicker: 'already here' });

    // de.json, which didn't already have the key, gets merged normally.
    const deOnDisk = JSON.parse(fs.readFileSync(path.join(root, 'public/i18n/de.json'), 'utf8'));
    assert.equal(deOnDisk.nav.theftAndDestruction, 'DIEBSTAHL');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mergeStoryTranslations merges nothing and errors on neither when every manifest locale is already merged', async () => {
  const root = setupTempRepo();
  try {
    for (const locale of ['fr', 'de']) {
      const localePath = path.join(root, `public/i18n/${locale}.json`);
      const content = JSON.parse(fs.readFileSync(localePath, 'utf8'));
      content.theftAndDestruction = { kicker: 'already here' };
      fs.writeFileSync(localePath, JSON.stringify(content, null, 2) + '\n');
    }

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
      locales: [],
      skipped: ['fr', 'de'],
    });
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
  assert.equal(locales.length, 23);
});
