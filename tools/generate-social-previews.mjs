// Postbuild step: GitHub Pages serves a single static index.html, so link-preview
// crawlers (Facebook/Twitter/etc, which don't run JS) only ever see that one
// og:image/title/description — every shared link looks identical.
//
// This generates a static index.html per story/shop-item route (and per locale
// prefix), each a copy of the built shell with just the OG/Twitter meta tags
// swapped to that page's own title/teaser/image. GitHub Pages resolves clean
// URLs like /pigeon to /pigeon/index.html, so a shared link picks up the
// right preview while the Angular app still boots normally and takes over
// client-side routing for an actual visitor.
//
// Run after `ng build` (wired as npm's postbuild hook). Reads route/content
// data straight from the locale JSON files (and the English TS source) so it
// stays correct as pages are added — nothing here is hardcoded per-route.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist/etterbeek-criminals/browser');
const I18N_DIR = path.join(ROOT, 'public/i18n');
const SITE_ORIGIN = 'https://poiteal-ops.github.io';

async function loadEnglishContent() {
  // en.content.ts is a plain JS object literal with one TS type annotation on
  // the declaration line — strip that line down to a bare `export default`
  // and let Node import the rest as-is, rather than pulling in a TS compiler.
  const src = fs.readFileSync(path.join(ROOT, 'src/app/i18n/content/en.content.ts'), 'utf8');
  const stripped = src
    .replace(/^import \{ SiteContent \} from '\.\/site-content\.model';\n/m, '')
    .replace(/export const EN_CONTENT: SiteContent = /, 'export default ');
  const tmpFile = path.join(os.tmpdir(), `en-content-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(tmpFile, stripped);
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod.default;
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function pagesFromContent(content) {
  const pages = [];
  for (const a of content.adventures ?? []) {
    pages.push({ route: a.link, title: a.title, description: a.teaser, image: a.image });
  }
  for (const s of content.shopItems ?? []) {
    if (s.slug) pages.push({ route: `/shop/${s.slug}`, title: s.name, description: s.tag, image: s.image });
  }
  return pages;
}

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function renderPage(template, { baseHref, locale, page }) {
  const localePrefix = locale === 'en' ? '' : `${locale}/`;
  const siteRoot = `${SITE_ORIGIN}${baseHref}`;
  const pageUrl = `${siteRoot}${localePrefix}${page.route.replace(/^\//, '')}/`;
  const imageUrl = `${siteRoot}${page.image}`;
  const title = escapeAttr(page.title);
  const description = escapeAttr(page.description);

  return template
    .replace(/<title>.*?<\/title>/, `<title>${title} — The Thieffry Criminals</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`)
    .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${pageUrl}">`)
    .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/\s*<meta property="og:image:width" content="[^"]*">/, '')
    .replace(/\s*<meta property="og:image:height" content="[^"]*">/, '')
    .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${description}">`)
    .replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${imageUrl}">`)
    .replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);
}

async function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`No build output at ${indexPath} — run "ng build" first.`);
    process.exit(1);
  }
  const template = fs.readFileSync(indexPath, 'utf8');
  const baseHrefMatch = template.match(/<base href="([^"]*)">/);
  const baseHref = baseHrefMatch ? baseHrefMatch[1] : '/';

  const localeCodes = fs
    .readdirSync(I18N_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));

  const contentByLocale = { en: await loadEnglishContent() };
  for (const code of localeCodes) {
    contentByLocale[code] = JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${code}.json`), 'utf8'));
  }

  let count = 0;
  for (const [locale, content] of Object.entries(contentByLocale)) {
    for (const page of pagesFromContent(content)) {
      const html = renderPage(template, { baseHref, locale, page });
      const localePrefix = locale === 'en' ? '' : locale;
      const outDir = path.join(DIST_DIR, localePrefix, page.route.replace(/^\//, ''));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      count++;
    }
  }

  console.log(`generate-social-previews: wrote ${count} per-page preview files across ${Object.keys(contentByLocale).length} locales.`);
}

main();
