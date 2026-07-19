import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { generateSite } from './seo-page-generator.mjs';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist/etterbeek-criminals/browser');
const I18N_DIR = path.join(ROOT, 'public/i18n');

export function resolveLangset() {
  const cliArg = process.argv.find((a) => a.startsWith('--langset='));
  return cliArg ? cliArg.slice('--langset='.length) : (process.env.LANGSET ?? 'en');
}

export function selectLocales(langset, availableLocales) {
  if (langset === 'all') return availableLocales;
  const requested = langset.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = requested.filter((l) => l !== 'en' && !availableLocales.includes(l));
  if (unknown.length) throw new Error(`LANGSET requested unknown locale(s): ${unknown.join(', ')}`);
  return availableLocales.filter((l) => l === 'en' || requested.includes(l));
}

export async function loadEnglishContent() {
  const source = fs.readFileSync(
    path.join(ROOT, 'src/app/i18n/content/en.content.ts'),
    'utf8',
  );
  const moduleSource = source
    .replace(/^import \{ SiteContent \} from '\.\/site-content\.model';\r?\n/m, '')
    .replace(/export const EN_CONTENT: SiteContent = /, 'export default ');
  const temporaryFile = path.join(
    os.tmpdir(),
    `thieffry-en-content-${process.pid}-${Date.now()}.mjs`,
  );
  fs.writeFileSync(temporaryFile, moduleSource, { flag: 'wx' });
  try {
    return (await import(pathToFileURL(temporaryFile).href)).default;
  } finally {
    fs.rmSync(temporaryFile, { force: true });
  }
}

async function loadContentByLocale() {
  const result = { en: await loadEnglishContent() };
  const localeFiles = fs
    .readdirSync(I18N_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort();

  for (const fileName of localeFiles) {
    const locale = fileName.slice(0, -'.json'.length);
    if (!/^[a-z]{2}$/.test(locale)) throw new Error(`Unsafe locale filename: ${fileName}`);
    result[locale] = JSON.parse(fs.readFileSync(path.join(I18N_DIR, fileName), 'utf8'));
  }
  return result;
}

async function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`No Angular build output at ${indexPath}`);
  }

  const contentByLocale = await loadContentByLocale();
  const availableLocales = Object.keys(contentByLocale).sort();
  const langset = resolveLangset();
  const selectedLocales = selectLocales(langset, availableLocales);

  const filteredContent = Object.fromEntries(
    selectedLocales.map((locale) => [locale, contentByLocale[locale]]),
  );

  const result = generateSite({
    template: fs.readFileSync(indexPath, 'utf8'),
    contentByLocale: filteredContent,
    distDir: DIST_DIR,
  });

  console.log(
    `generate-seo-pages: wrote ${result.pageCount} pages, sitemap.xml, and robots.txt.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
