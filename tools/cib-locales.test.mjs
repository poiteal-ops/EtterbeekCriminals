import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import test from 'node:test';

function readExport(file, name, dependencies = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: () => dependencies };
  vm.runInNewContext(js, sandbox);
  return JSON.parse(JSON.stringify(sandbox.exports[name]));
}
const registry = '../src/app/i18n/locale-registry.ts';
const locales = readExport(registry, 'CONTENT_LOCALES').filter((code) => code !== 'en');
const data = '../src/app/pages/cib-bureau/cib.data.ts';
const copy = readExport(data, 'CIB_INCIDENT_COPY_EN');
const english = readExport('../src/app/i18n/content/en.content.ts', 'EN_CONTENT', { CIB_INCIDENT_COPY_EN: copy });

function checkCopy(reference, translated, path = 'cib') {
  assert.ok(translated && typeof translated === 'object', `${path}: missing section`);
  assert.deepEqual(Object.keys(translated).sort(), Object.keys(reference).sort(), `${path}: incomplete keys`);
  for (const [key, value] of Object.entries(reference)) {
    const target = translated[key];
    if (typeof value === 'object') checkCopy(value, target, `${path}.${key}`);
    else {
      assert.equal(typeof target, 'string', `${path}.${key}: must be text`);
      assert.ok(value === '' ? target === '' : target.trim(), `${path}.${key}: missing text`);
      assert.ok(!target.includes('\ufffd'), `${path}.${key}: damaged Unicode`);
      assert.ok(!/<\/?[a-z][^>]*>/i.test(target), `${path}.${key}: translated HTML`);
      assert.deepEqual(target.match(/\{\w+\}/g) ?? [], value.match(/\{\w+\}/g) ?? [], `${path}.${key}: placeholders`);
    }
  }
}

for (const locale of locales) {
  test(`${locale}: complete native CIB copy and stable incident coverage`, () => {
    const content = JSON.parse(fs.readFileSync(new URL(`../public/i18n/${locale}.json`, import.meta.url), 'utf8'));
    checkCopy(english.cib, content.cib);
    assert.ok(content.nav.cib?.trim(), `${locale}: missing intelligence navigation`);
    assert.deepEqual(content.cib.suspectLabels, english.cib.suspectLabels);
    for (const [id, incident] of Object.entries(content.cib.incidents)) {
      assert.notEqual(incident.title, copy[id].title, `${locale}/${id}: untranslated title`);
      assert.notEqual(incident.summary, copy[id].summary, `${locale}/${id}: untranslated summary`);
    }
    const scripts = { fr: /[À-ÿ]/, de: /[äöüÄÖÜß]/, ja: /[\u3040-\u30ff\u4e00-\u9fff]/, ta: /[\u0b80-\u0bff]/ };
    if (scripts[locale]) assert.match(JSON.stringify(content.cib), scripts[locale]);
    assert.ok(!content.adventures.some((entry) => entry.link === '/criminal-intelligence'));
  });
}
