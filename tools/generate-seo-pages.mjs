import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

import { generateSite } from './seo-page-generator.mjs';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist/etterbeek-criminals/browser');
const I18N_DIR = path.join(ROOT, 'public/i18n');
const TS_TRANSPILE_OPTIONS = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };

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

function transpileTypeScript(sourcePath) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  return ts.transpileModule(source, { compilerOptions: TS_TRANSPILE_OPTIONS }).outputText;
}

function writeTemporaryModule(label, source) {
  const temporaryFile = path.join(
    os.tmpdir(),
    `thieffry-${label}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`,
  );
  fs.writeFileSync(temporaryFile, source, { flag: 'wx' });
  return temporaryFile;
}

export async function loadEnglishContent() {
  // en.content.ts has exactly one real cross-file runtime dependency:
  // CIB_INCIDENT_COPY_EN from cib.data.ts (cib.data.ts's own import from
  // cib.model.ts is type-only, so ts.transpileModule elides it and that file
  // needs no further resolution). Both files are transpiled to self-contained
  // temp .mjs modules so a plain dynamic import() can load them without a
  // TypeScript-aware Node loader; ts.transpileModule also elides the
  // type-only `SiteContent` import/annotation in en.content.ts the same way.
  const cibDataTemporaryFile = writeTemporaryModule(
    'cib-data',
    transpileTypeScript(path.join(ROOT, 'src/app/pages/cib-bureau/cib.data.ts')),
  );

  const enContentSource = transpileTypeScript(
    path.join(ROOT, 'src/app/i18n/content/en.content.ts'),
  )
    .replace(
      "from '../../pages/cib-bureau/cib.data'",
      `from '${pathToFileURL(cibDataTemporaryFile).href}'`,
    )
    .replace(/export const EN_CONTENT = /, 'export default ');
  const enContentTemporaryFile = writeTemporaryModule('en-content', enContentSource);

  try {
    return (await import(pathToFileURL(enContentTemporaryFile).href)).default;
  } finally {
    fs.rmSync(enContentTemporaryFile, { force: true });
    fs.rmSync(cibDataTemporaryFile, { force: true });
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
