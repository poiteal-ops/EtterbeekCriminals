import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadEnglishContent } from './generate-seo-pages.mjs';
import {
  buildPages,
  generateSite,
  normalizeRoute,
  outputDirectory,
  pageUrl,
  renderPage,
} from './seo-page-generator.mjs';

const template = `<!doctype html>
<html lang="en"><head>
<title>The Thieffry Criminals</title>
<meta name="description" content="Default description">
<meta property="og:type" content="website">
<meta property="og:title" content="The Thieffry Criminals">
<meta property="og:description" content="Default description">
<meta property="og:url" content="https://thieffrycriminals.be/">
<meta property="og:image" content="https://thieffrycriminals.be/assets/images/social-preview.png">
<meta property="og:image:width" content="965">
<meta property="og:image:height" content="880">
<meta name="twitter:title" content="The Thieffry Criminals">
<meta name="twitter:description" content="Default description">
<meta name="twitter:image" content="https://thieffrycriminals.be/assets/images/social-preview.png">
</head><body><app-root></app-root></body></html>`;

function content(prefix = 'EN') {
  return {
    home: { tagline: `${prefix} home description` },
    about: { title: `${prefix} About`, subtitle: `${prefix} about description` },
    story: { title: `${prefix} Story`, p1: `${prefix} story description` },
    adventures: [
      {
        title: `${prefix} Pigeon`,
        teaser: `${prefix} pigeon description`,
        link: '/pigeon',
        image: 'assets/images/pigeon.jpg',
      },
    ],
    blog: { title: `${prefix} Blog`, subtitle: `${prefix} blog description` },
    blogPosts: [{ image: 'assets/images/blog.jpg' }],
    shop: { title: `${prefix} Shop`, subtitle: `${prefix} shop description` },
    shopItems: [
      {
        name: `${prefix} Preview`,
        tag: `${prefix} preview description`,
        image: 'assets/images/preview.jpg',
        videoId: 'video',
      },
      {
        name: `${prefix} Tee`,
        tag: `${prefix} tee description`,
        image: 'assets/images/tee.jpg',
        slug: 'wanted-tee',
      },
    ],
    cib: {
      title: `${prefix} CIB Title`,
      seoDescription: `${prefix} cib description`,
    },
  };
}

const protectedTermPattern = /Sawito|Le Criminel|Pikette|Brux Gang|Thug Life, No Rules/giu;

function protectedTermsByPath(value, currentPath = '', result = {}) {
  if (typeof value === 'string') {
    const matches = value.match(protectedTermPattern);
    if (matches) result[currentPath] = matches;
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      protectedTermsByPath(entry, `${currentPath}[${index}]`, result),
    );
    return result;
  }

  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      const entryPath = currentPath ? `${currentPath}.${key}` : key;
      protectedTermsByPath(entry, entryPath, result);
    }
  }

  return result;
}

test('buildPages covers every route type and excludes shop entries without slugs', () => {
  assert.deepEqual(
    buildPages(content()).map((page) => page.route),
    ['', 'about', 'story', 'criminal-intelligence', 'pigeon', 'blog', 'shop', 'shop/wanted-tee'],
  );
});

test('buildPages adds a fixed criminal-intelligence page sourced from content.cib title/seoDescription', () => {
  const pages = buildPages(content('EN'));
  const cibPages = pages.filter((page) => page.route === 'criminal-intelligence');
  assert.equal(cibPages.length, 1, 'expected exactly one criminal-intelligence route');
  const [cibPage] = cibPages;
  assert.equal(cibPage.title, 'EN CIB Title');
  assert.equal(cibPage.description, 'EN cib description');
});

test('buildPages omits criminal-intelligence when content.cib is absent (older/incomplete fixtures)', () => {
  const withoutCib = content();
  delete withoutCib.cib;
  const routes = buildPages(withoutCib).map((page) => page.route);
  assert.ok(!routes.includes('criminal-intelligence'));
  // Every other fixed/derived page type must still build normally without content.cib.
  assert.deepEqual(routes, ['', 'about', 'story', 'pigeon', 'blog', 'shop', 'shop/wanted-tee']);
});

test('buildPages creates a direct-visit game page when game copy is present', () => {
  const sample = content();
  sample.game = { title: 'Catch the Criminal', intro: 'Protect the house from Le Criminel.' };
  const game = buildPages(sample).find((page) => page.route === 'game');
  assert.equal(game?.title, 'Catch the Criminal');
  assert.equal(game?.description, 'Protect the house from Le Criminel.');
  const guide = buildPages(sample).find((page) => page.route === 'game/how-to-play');
  assert.equal(guide?.title, 'How to Play Catch the Criminal');
});

test('generateSite indexes a locale game page once that locale has its own translated game block', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-game-translated-'));
  try {
    const english = content('EN');
    english.game = { title: 'Catch the Criminal', intro: 'Protect the house.', guide: { title: 'How to play', intro: 'Guide intro.' } };
    const french = content('FR');
    french.game = { title: 'Attrapez le criminel', intro: 'Protegez la maison.', guide: { title: 'Comment jouer', intro: 'Intro du guide.' } };
    generateSite({ template, contentByLocale: { en: english, fr: french, de: content('DE') }, distDir: root });
    const translated = fs.readFileSync(path.join(root, 'fr', 'game', 'index.html'), 'utf8');
    assert.doesNotMatch(translated, /noindex/);
    assert.match(translated, /<title>Attrapez le criminel - The Thieffry Criminals<\/title>/);
    assert.match(translated, /rel="canonical" href="https:\/\/thieffrycriminals\.be\/fr\/game\/"/);
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /\/fr\/game\//);
    assert.match(sitemap, /\/fr\/game\/how-to-play\//);
    // A locale without a translation still falls back to a noindex English page canonicalised to English.
    const fallback = fs.readFileSync(path.join(root, 'de', 'game', 'index.html'), 'utf8');
    assert.match(fallback, /noindex/);
    assert.match(fallback, /rel="canonical" href="https:\/\/thieffrycriminals\.be\/game\/"/);
    assert.doesNotMatch(sitemap, /\/de\/game\//);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generateSite uses English game metadata for missing fields in a partial translated block', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-game-partial-'));
  try {
    const english = content('EN');
    english.game = { title: 'Catch the Criminal', intro: 'Protect the house.', guide: { title: 'How to play', intro: 'Guide intro.' } };
    const french = content('FR');
    french.game = { title: 'Attrapez le criminel', guide: { title: 'Comment jouer' } };
    generateSite({ template, contentByLocale: { en: english, fr: french }, distDir: root });
    const game = fs.readFileSync(path.join(root, 'fr', 'game', 'index.html'), 'utf8');
    const guide = fs.readFileSync(path.join(root, 'fr', 'game', 'how-to-play', 'index.html'), 'utf8');
    assert.match(game, /<meta name="description" content="Protect the house\.">/);
    assert.match(guide, /<title>Comment jouer - The Thieffry Criminals<\/title>/);
    assert.match(guide, /<meta name="description" content="Guide intro\.">/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generateSite gives localized game fallback routes a direct-visit page', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-game-page-'));
  try {
    const english = content('EN');
    english.game = { title: 'Catch the Criminal', intro: 'Protect the house.' };
    generateSite({ template, contentByLocale: { en: english, fr: content('FR') }, distDir: root });
    assert.equal(fs.existsSync(path.join(root, 'game', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(root, 'fr', 'game', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(root, 'game', 'how-to-play', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(root, 'fr', 'game', 'how-to-play', 'index.html')), true);
    const fallback = fs.readFileSync(path.join(root, 'fr', 'game', 'index.html'), 'utf8');
    assert.match(fallback, /<meta name="robots" content="noindex">/);
    assert.match(fallback, /rel="canonical" href="https:\/\/thieffrycriminals\.be\/game\/"/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/fr\/game\//);
    const guideFallback = fs.readFileSync(path.join(root, 'fr', 'game', 'how-to-play', 'index.html'), 'utf8');
    assert.match(guideFallback, /<meta name="robots" content="noindex">/);
    assert.match(guideFallback, /rel="canonical" href="https:\/\/thieffrycriminals\.be\/game\/how-to-play\/"/);
    assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/game\/how-to-play\//);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('pageUrl uses unprefixed English and trailing-slash localized URLs', () => {
  assert.equal(pageUrl('en', ''), 'https://thieffrycriminals.be/');
  assert.equal(pageUrl('en', 'about'), 'https://thieffrycriminals.be/about/');
  assert.equal(pageUrl('fr', 'about'), 'https://thieffrycriminals.be/fr/about/');
});

test('renderPage emits escaped metadata, canonical, self alternate, and x-default', () => {
  const page = {
    route: 'about',
    title: '<script>alert("x")</script>',
    description: 'Dogs & people',
    image: 'assets/images/about.jpg',
  };
  const html = renderPage(template, {
    locale: 'fr',
    page,
    canonicalUrl: pageUrl('fr', page.route),
    alternates: [
      { locale: 'en', url: pageUrl('en', page.route) },
      { locale: 'fr', url: pageUrl('fr', page.route) },
    ],
  });

  assert.match(html, /<html lang="fr">/);
  assert.match(html, /&lt;script&gt;alert\("x"\)&lt;\/script&gt; - The Thieffry Criminals/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /content="Dogs &amp; people"/);
  assert.match(html, /rel="canonical" href="https:\/\/thieffrycriminals\.be\/fr\/about\/"/);
  assert.match(html, /hreflang="fr"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/thieffrycriminals\.be\/about\/"/);
  assert.doesNotMatch(html, /og:image:width|og:image:height/);
});

test('renderPage preserves extra html-tag attributes such as data-beasties-container', () => {
  const beastiesTemplate = template.replace(
    '<html lang="en">',
    '<html lang="en" data-beasties-container>',
  );
  const page = {
    route: 'about',
    title: 'About',
    description: 'About description',
    image: 'assets/images/about.jpg',
  };
  const html = renderPage(beastiesTemplate, {
    locale: 'fr',
    page,
    canonicalUrl: pageUrl('fr', page.route),
    alternates: [
      { locale: 'en', url: pageUrl('en', page.route) },
      { locale: 'fr', url: pageUrl('fr', page.route) },
    ],
  });

  assert.match(html, /<html lang="fr" data-beasties-container>/);
});

test('normalizeRoute and outputDirectory reject traversal input', () => {
  assert.equal(normalizeRoute('/shop/wanted-tee/'), 'shop/wanted-tee');
  assert.throws(() => normalizeRoute('../outside'), /Unsafe route/);
  assert.throws(() => normalizeRoute('shop/../../outside'), /Unsafe route/);
  assert.throws(() => outputDirectory('dist/site', '../fr', 'about'), /Unsafe locale/);
});

test('generateSite writes all locale roots and routes but no unsupported locale', () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thieffry-seo-'));
  try {
    const result = generateSite({
      template,
      contentByLocale: { en: content('EN'), fr: content('FR') },
      distDir,
    });

    assert.equal(result.pageCount, 16);
    assert.ok(fs.existsSync(path.join(distDir, 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'about', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'fr', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'fr', 'about', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'criminal-intelligence', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'fr', 'criminal-intelligence', 'index.html')));
    assert.ok(!fs.existsSync(path.join(distDir, 'ga')));
    assert.match(
      fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8'),
      /<loc>https:\/\/thieffrycriminals\.be\/fr\/about\/<\/loc>/,
    );
    assert.match(
      fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8'),
      /<loc>https:\/\/thieffrycriminals\.be\/criminal-intelligence\/<\/loc>/,
    );
    assert.match(
      fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8'),
      /<loc>https:\/\/thieffrycriminals\.be\/fr\/criminal-intelligence\/<\/loc>/,
    );
    assert.equal(
      fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8'),
      'User-agent: *\nAllow: /\nSitemap: https://thieffrycriminals.be/sitemap.xml\n',
    );
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('generateSite renders localized CIB title/description, canonical URL, hreflang alternates, and sitemap entries', () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thieffry-seo-'));
  try {
    generateSite({
      template,
      contentByLocale: { en: content('EN'), fr: content('FR') },
      distDir,
    });

    const enHtml = fs.readFileSync(
      path.join(distDir, 'criminal-intelligence', 'index.html'),
      'utf8',
    );
    assert.match(enHtml, /<title>EN CIB Title - The Thieffry Criminals<\/title>/);
    assert.match(enHtml, /content="EN cib description"/);
    assert.match(
      enHtml,
      /<link rel="canonical" href="https:\/\/thieffrycriminals\.be\/criminal-intelligence\/">/,
    );
    assert.match(
      enHtml,
      /<link rel="alternate" hreflang="fr" href="https:\/\/thieffrycriminals\.be\/fr\/criminal-intelligence\/">/,
    );
    assert.match(
      enHtml,
      /<link rel="alternate" hreflang="x-default" href="https:\/\/thieffrycriminals\.be\/criminal-intelligence\/">/,
    );

    const frHtml = fs.readFileSync(
      path.join(distDir, 'fr', 'criminal-intelligence', 'index.html'),
      'utf8',
    );
    assert.match(frHtml, /<title>FR CIB Title - The Thieffry Criminals<\/title>/);
    assert.match(frHtml, /content="FR cib description"/);
    assert.match(
      frHtml,
      /<link rel="canonical" href="https:\/\/thieffrycriminals\.be\/fr\/criminal-intelligence\/">/,
    );
    assert.match(
      frHtml,
      /<link rel="alternate" hreflang="en" href="https:\/\/thieffrycriminals\.be\/criminal-intelligence\/">/,
    );

    const sitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/thieffrycriminals\.be\/criminal-intelligence\/<\/loc>/);
    assert.match(
      sitemap,
      /<loc>https:\/\/thieffrycriminals\.be\/fr\/criminal-intelligence\/<\/loc>/,
    );
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('renderPage escapes CIB-style titles/descriptions containing &, <, and " so raw HTML never leaks through', () => {
  const page = {
    route: 'criminal-intelligence',
    title: 'Archive & Dossier <Redacted> "Files"',
    description: 'Track suspects & incidents <redacted> "details"',
    image: 'assets/images/dog-floor-portrait.jpg',
  };
  const html = renderPage(template, {
    locale: 'en',
    page,
    canonicalUrl: pageUrl('en', page.route),
    alternates: [{ locale: 'en', url: pageUrl('en', page.route) }],
  });

  assert.doesNotMatch(html, /<Redacted>/);
  assert.match(
    html,
    /<title>Archive &amp; Dossier &lt;Redacted&gt; "Files" - The Thieffry Criminals<\/title>/,
  );
  assert.match(
    html,
    /<meta name="description" content="Track suspects &amp; incidents &lt;redacted&gt; &quot;details&quot;">/,
  );
  assert.match(
    html,
    /<meta property="og:title" content="Archive &amp; Dossier &lt;Redacted&gt; &quot;Files&quot; - The Thieffry Criminals">/,
  );
});

test('real localized content only ever produces routes that also exist in English, and never more of them', async () => {
  // Locales may legitimately produce FEWER routes than English: some stories are
  // intentionally rolled out to a partial locale set (e.g. heatwave-survival shipped
  // to en/fr/hi/ta/mr only, per the per-section fallback mechanism), so route count
  // parity across all locales is not guaranteed. What must always hold is that a
  // locale never produces an orphan/typo'd route that doesn't exist in English, and
  // never exceeds English's total route count.
  const englishContent = await loadEnglishContent(); // imported from generate-seo-pages.mjs
  const englishRoutes = new Set(buildPages(englishContent).map((page) => page.route));
  assert.ok(englishRoutes.size > 0);

  const localeFiles = fs.readdirSync('public/i18n').filter((name) => name.endsWith('.json'));

  for (const file of localeFiles) {
    const localeContent = JSON.parse(fs.readFileSync(path.join('public/i18n', file), 'utf8'));
    const localeRoutes = buildPages(localeContent).map((page) => page.route);
    assert.ok(
      localeRoutes.length <= englishRoutes.size,
      `${file} produces more routes (${localeRoutes.length}) than en (${englishRoutes.size})`,
    );
    for (const route of localeRoutes) {
      assert.ok(
        englishRoutes.has(route),
        `${file} produces route "${route}" that does not exist in en`,
      );
    }
  }
});

test('A Day With Bestie is available in every shipped content locale', async () => {
  const expectedRoute = 'a-day-with-bestie';
  const englishRoutes = buildPages(await loadEnglishContent()).map((page) => page.route);
  assert.ok(englishRoutes.includes(expectedRoute), 'English content is missing /a-day-with-bestie');

  const localeFiles = fs.readdirSync('public/i18n').filter((name) => name.endsWith('.json'));
  for (const file of localeFiles) {
    const localeContent = JSON.parse(fs.readFileSync(path.join('public/i18n', file), 'utf8'));
    const localeRoutes = buildPages(localeContent).map((page) => page.route);
    assert.ok(localeRoutes.includes(expectedRoute), `${file} is missing /a-day-with-bestie`);
  }
});

test('Kande Nadege is available in English content', async () => {
  const englishRoutes = buildPages(await loadEnglishContent()).map((page) => page.route);

  assert.ok(englishRoutes.includes('kande-nadege'), 'English content is missing /kande-nadege');
});

test('CONTENT_LOCALES in locale-registry.ts matches the locales generate-seo-pages.mjs actually builds', () => {
  const registrySource = fs.readFileSync('src/app/i18n/locale-registry.ts', 'utf8');
  const blockMatch = registrySource.match(
    /CONTENT_LOCALES: readonly LocaleCode\[\] = \[([\s\S]*?)\];/,
  );
  assert.ok(blockMatch, 'Could not find CONTENT_LOCALES array in locale-registry.ts');
  const contentLocales = [...blockMatch[1].matchAll(/['"]([a-z]{2})['"]/g)].map(
    (match) => match[1],
  );

  const generatedLocales = [
    'en',
    ...fs
      .readdirSync('public/i18n')
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -'.json'.length)),
  ];

  const sortedUnique = (values) => [...new Set(values)].sort();
  assert.deepEqual(
    sortedUnique(contentLocales),
    sortedUnique(generatedLocales),
    'CONTENT_LOCALES (locale-registry.ts) and public/i18n/*.json locales have drifted apart: ' +
      'the build-time generator and the runtime guard must agree on which locales have content.',
  );
});

test('Hindi, Tamil, and Marathi preserve protected-term casing at every English field path', async () => {
  const englishContent = await loadEnglishContent();
  delete englishContent.game; // The game and its guide are deliberately English-only.
  const expectedTermsByPath = protectedTermsByPath(englishContent);

  for (const locale of ['hi', 'ta', 'mr']) {
    const localizedContent = JSON.parse(fs.readFileSync(`public/i18n/${locale}.json`, 'utf8'));
    delete localizedContent.game;
    assert.deepEqual(
      protectedTermsByPath(localizedContent),
      expectedTermsByPath,
      `${locale}.json protected terms differ from en.content.ts`,
    );
  }
});
