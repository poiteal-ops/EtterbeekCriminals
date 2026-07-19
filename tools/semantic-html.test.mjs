import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const pageTemplates = [
  'src/app/pages/home/home.html',
  'src/app/pages/about/about.html',
  'src/app/pages/story/story.html',
  'src/app/pages/pigeon/pigeon.html',
  'src/app/pages/couch/couch.html',
  'src/app/pages/train-ride/train-ride.html',
  'src/app/pages/escape-to-the-country/escape-to-the-country.html',
  'src/app/pages/blog/blog.html',
  'src/app/pages/shop/shop.html',
  'src/app/pages/shop-item/shop-item.html',
];

test('every routed page template has one semantic title', () => {
  for (const file of pageTemplates) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/<h1 class="title">/g) ?? []).length, 1, file);
    assert.doesNotMatch(html, /<div class="title">/, file);
  }
});

test('the router outlet is inside a main landmark', () => {
  const html = fs.readFileSync('src/app/app.html', 'utf8');
  assert.match(html, /<main>\s*<router-outlet\s*\/>\s*<\/main>/);
});

test('semantic h1 elements retain the previous neutral box and font styling', () => {
  const styles = fs.readFileSync('src/styles.scss', 'utf8');
  assert.match(styles, /h1\s*\{[^}]*margin:\s*0;[^}]*font:\s*inherit;[^}]*\}/s);
});
