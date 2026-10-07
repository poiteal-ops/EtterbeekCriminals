import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import test from 'node:test';

const iconDirectory = new URL('../public/assets/game/icons/', import.meta.url);
const icons = [
  'player', 'criminal', 'sofa', 'cushion', 'remote', 'food', 'bin', 'plant',
  'shoe', 'box', 'slipper', 'laundry',
];

test('approved player, criminal, and household icons are available', () => {
  const missing = icons.filter(name => !existsSync(new URL(`${name}.svg`, iconDirectory)));
  assert.deepEqual(missing, []);
});

test('game icons are self-contained SVGs with a common grid', () => {
  for (const name of icons) {
    const url = new URL(`${name}.svg`, iconDirectory);
    if (!existsSync(url)) continue;
    const source = readFileSync(fileURLToPath(url), 'utf8');
    assert.match(source, /<svg\b[^>]*viewBox="0 0 48 48"/, name);
    assert.doesNotMatch(source, /<script\b|<image\b|\bhref=|url\(/i, name);
  }
});
