import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

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
  };
}

test('buildPages covers every route type and excludes shop entries without slugs', () => {
  assert.deepEqual(
    buildPages(content()).map((page) => page.route),
    ['', 'about', 'story', 'pigeon', 'blog', 'shop', 'shop/wanted-tee'],
  );
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
  const beastiesTemplate = template.replace('<html lang="en">', '<html lang="en" data-beasties-container>');
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

    assert.equal(result.pageCount, 14);
    assert.ok(fs.existsSync(path.join(distDir, 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'about', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'fr', 'index.html')));
    assert.ok(fs.existsSync(path.join(distDir, 'fr', 'about', 'index.html')));
    assert.ok(!fs.existsSync(path.join(distDir, 'ga')));
    assert.match(fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/thieffrycriminals\.be\/fr\/about\/<\/loc>/);
    assert.equal(
      fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8'),
      'User-agent: *\nAllow: /\nSitemap: https://thieffrycriminals.be/sitemap.xml\n',
    );
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('real localized content describes 14 indexable routes per locale', async () => {
  const source = fs.readFileSync('src/app/i18n/content/en.content.ts', 'utf8');
  const routeCount = (source.match(/slug:/g) ?? []).length + 10;
  assert.equal(routeCount, 14);

  const localeCount = 1 + fs.readdirSync('public/i18n').filter((name) => name.endsWith('.json')).length;
  assert.equal(localeCount, 20);
  assert.equal(routeCount * localeCount, 280);
});

test('CONTENT_LOCALES in locale-registry.ts matches the locales generate-seo-pages.mjs actually builds', () => {
  const registrySource = fs.readFileSync('src/app/i18n/locale-registry.ts', 'utf8');
  const blockMatch = registrySource.match(
    /CONTENT_LOCALES: readonly LocaleCode\[\] = \[([\s\S]*?)\];/,
  );
  assert.ok(blockMatch, 'Could not find CONTENT_LOCALES array in locale-registry.ts');
  const contentLocales = [...blockMatch[1].matchAll(/['"]([a-z]{2})['"]/g)].map((match) => match[1]);

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
