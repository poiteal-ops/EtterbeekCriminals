import fs from 'node:fs';
import path from 'node:path';

const dir = 'e:/workspace/EtterbeekCriminals/public/i18n';
const ref = JSON.parse(fs.readFileSync(path.join(dir, 'fr.json'), 'utf8'));

function shape(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      keys.push(`${p}[len=${v.length}]`);
      if (v.length && typeof v[0] === 'object') {
        // arrays of objects: check each element's keys against the first ref element's keys
        v.forEach((el, i) => keys.push(...shape(el, `${p}[${i}]`).map((s) => s.replace(`[${i}]`, '[]'))));
      }
    } else if (v && typeof v === 'object') {
      keys.push(...shape(v, p));
    } else {
      keys.push(`${p}:${typeof v}`);
    }
  }
  return keys;
}

// For arrays of objects, optional keys (image?, slug?, detail?, videoId?) differ per element.
// Compare per-element key sets exactly between ref and candidate.
function deepCompare(refObj, candObj, prefix = '', problems = []) {
  const refKeys = Object.keys(refObj);
  const candKeys = Object.keys(candObj ?? {});
  for (const k of refKeys) {
    if (!(k in (candObj ?? {}))) problems.push(`MISSING ${prefix}${k}`);
  }
  for (const k of candKeys) {
    if (!(k in refObj)) problems.push(`EXTRA ${prefix}${k}`);
  }
  for (const k of refKeys) {
    const rv = refObj[k];
    const cv = candObj?.[k];
    if (cv === undefined) continue;
    if (Array.isArray(rv)) {
      if (!Array.isArray(cv)) { problems.push(`TYPE ${prefix}${k} should be array`); continue; }
      if (rv.length !== cv.length) problems.push(`LEN ${prefix}${k} ref=${rv.length} got=${cv.length}`);
      rv.forEach((rel, i) => {
        if (typeof rel === 'object' && cv[i] !== undefined) deepCompare(rel, cv[i], `${prefix}${k}[${i}].`, problems);
      });
    } else if (rv && typeof rv === 'object') {
      deepCompare(rv, cv, `${prefix}${k}.`, problems);
    } else if (typeof rv !== typeof cv) {
      problems.push(`TYPE ${prefix}${k} ref=${typeof rv} got=${typeof cv}`);
    } else if (typeof cv === 'string' && cv.trim() === '') {
      problems.push(`EMPTY ${prefix}${k}`);
    }
  }
  return problems;
}

// Locale-independent fields that must be IDENTICAL to the reference
function checkInvariants(refObj, candObj, file, problems) {
  // adventures links & images
  refObj.adventures.forEach((a, i) => {
    if (candObj.adventures?.[i]?.link !== a.link) problems.push(`INVARIANT adventures[${i}].link must be ${a.link}`);
    if (candObj.adventures?.[i]?.image !== a.image) problems.push(`INVARIANT adventures[${i}].image must be ${a.image}`);
  });
  refObj.blogPosts.forEach((b, i) => {
    const c = candObj.blogPosts?.[i];
    if (!c) return;
    if (c.date !== b.date) problems.push(`INVARIANT blogPosts[${i}].date must be "${b.date}"`);
    if (c.case !== b.case) problems.push(`INVARIANT blogPosts[${i}].case must be "${b.case}"`);
    if ((c.image ?? null) !== (b.image ?? null)) problems.push(`INVARIANT blogPosts[${i}].image mismatch`);
  });
  refObj.shopItems.forEach((s, i) => {
    const c = candObj.shopItems?.[i];
    if (!c) return;
    for (const k of ['price', 'image', 'videoId', 'slug']) {
      if ((c[k] ?? null) !== (s[k] ?? null)) problems.push(`INVARIANT shopItems[${i}].${k} mismatch (ref="${s[k]}" got="${c[k]}")`);
    }
  });
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => (f.endsWith('.json') ? f : f + '.json'))
  : fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'fr.json');

let allOk = true;
for (const f of files) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.log(`${f}: FILE MISSING`); allOk = false; continue; }
  let cand;
  try {
    cand = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.log(`${f}: JSON PARSE ERROR: ${e.message}`);
    allOk = false;
    continue;
  }
  const problems = deepCompare(ref, cand);
  checkInvariants(ref, cand, f, problems);
  if (problems.length) {
    allOk = false;
    console.log(`${f}: ${problems.length} problem(s)`);
    problems.slice(0, 20).forEach((p2) => console.log('   ' + p2));
  } else {
    console.log(`${f}: OK`);
  }
}
process.exit(allOk ? 0 : 1);
