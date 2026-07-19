import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { generateSite } from './seo-page-generator.mjs';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist/etterbeek-criminals/browser');
const I18N_DIR = path.join(ROOT, 'public/i18n');

async function loadEnglishContent() {
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

  const result = generateSite({
    template: fs.readFileSync(indexPath, 'utf8'),
    contentByLocale: await loadContentByLocale(),
    distDir: DIST_DIR,
  });

  console.log(
    `generate-seo-pages: wrote ${result.pageCount} pages, sitemap.xml, and robots.txt.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
