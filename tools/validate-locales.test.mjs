import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function validate(reference, candidate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cib-validator-'));
  try {
    fs.mkdirSync(path.join(root, 'tools'));
    fs.mkdirSync(path.join(root, 'public/i18n'), { recursive: true });
    fs.copyFileSync(new URL('./validate-locales.mjs', import.meta.url), path.join(root, 'tools/validate-locales.mjs'));
    const sections = { adventures: [], blogPosts: [], shopItems: [] };
    fs.writeFileSync(path.join(root, 'public/i18n/fr.json'), JSON.stringify({ ...sections, ...reference }));
    fs.writeFileSync(path.join(root, 'public/i18n/de.json'), JSON.stringify({ ...sections, ...candidate }));
    return spawnSync(process.execPath, [path.join(root, 'tools/validate-locales.mjs')], { encoding: 'utf8' });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const noImage = { cib: { incidents: { 'CIB-001': { title: 'Titre', summary: 'Résumé', imageAlt: '' } } } };

test('accepts deliberately empty CIB image alternatives when the reference has no image', () => {
  const result = validate(noImage, noImage);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('still rejects blank required CIB narrative text', () => {
  const candidate = structuredClone(noImage);
  candidate.cib.incidents['CIB-001'].summary = '';
  const result = validate(noImage, candidate);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /EMPTY cib\.incidents\.CIB-001\.summary/);
});

test('still rejects blank image alternatives when the reference describes an image', () => {
  const reference = structuredClone(noImage);
  reference.cib.incidents['CIB-001'].imageAlt = 'Photo';
  const result = validate(reference, noImage);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /EMPTY cib\.incidents\.CIB-001\.imageAlt/);
});
