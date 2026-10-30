// Spelling guard: the banned Bengali spelling of the locality must not appear anywhere in the repo
// (incl. README and .claude), and the English spelling must be exactly "Keyatala".
// The banned string is built from code points (CONTRACTS.md section 0) and never typed literally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../src/config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const cp = (...xs) => String.fromCodePoint(...xs);

const BANNED_PRECOMPOSED = cp(0x0995, 0x09c7, 0x0993, 0x09dc, 0x09be, 0x09a4, 0x09b2, 0x09be);
const BANNED_DECOMPOSED = cp(0x0995, 0x09c7, 0x0993, 0x09a1, 0x09bc, 0x09be, 0x09a4, 0x09b2, 0x09be);
// Correct: KA, E-sign, YA + NUKTA (= YYA), AA-sign, TA, LA, AA-sign
const CORRECT = cp(0x0995, 0x09c7, 0x09af, 0x09bc, 0x09be, 0x09a4, 0x09b2, 0x09be);

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);
const BINARY_EXT = /\.(mp3|ogg|wav|m4a|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(p);
    } else if (st.isFile() && !BINARY_EXT.test(name) && st.size < 5_000_000) {
      yield p;
    }
  }
}

function readText(p) {
  const buf = readFileSync(p);
  if (buf.includes(0)) return null; // binary
  return buf.toString('utf8');
}

const files = [...walk(ROOT)];

test('detector self-check (synthetic strings)', () => {
  const sample = `x ${BANNED_DECOMPOSED} y`;
  assert.ok(sample.normalize('NFD').includes(BANNED_DECOMPOSED.normalize('NFD')));
  assert.ok(`a${BANNED_PRECOMPOSED}`.normalize('NFD').includes(BANNED_PRECOMPOSED.normalize('NFD')));
  assert.ok(!CORRECT.normalize('NFD').includes(BANNED_DECOMPOSED.normalize('NFD')));
  const re = /\bK[aeiouy]{1,4}r?[aeiouy]?t{1,2}[aeiouy]l{1,2}[aeiouy]\w*/gi;
  for (const v of ['Keoratala', 'Keyatola', 'Keyatalla', 'Kayatala', 'Keotala']) assert.ok(v.match(re), v);
});

test('banned Bengali spelling is absent from the whole repo (precomposed + decomposed, NFC/NFD)', () => {
  const needles = [BANNED_PRECOMPOSED, BANNED_DECOMPOSED].map((s) => s.normalize('NFD'));
  const hits = [];
  let scanned = 0;
  for (const f of files) {
    const text = readText(f);
    if (text === null) continue;
    scanned += 1;
    const forms = [text, text.normalize('NFD'), text.normalize('NFC')];
    if (forms.some((t) => t.includes(BANNED_PRECOMPOSED) || needles.some((n) => t.includes(n)))) {
      hits.push(relative(ROOT, f));
    }
  }
  assert.ok(scanned > 50, `only scanned ${scanned} files`);
  assert.ok(files.some((f) => f.endsWith('SPEC.md')), '.claude was not scanned');
  assert.deepEqual(hits, [], `banned spelling found in: ${hits.join(', ')}`);
});

test('README.md (if present) is scanned and uses the correct spellings', () => {
  const readme = files.find((f) => relative(ROOT, f) === 'README.md');
  if (!readme) return; // written by docs-agent in Phase 5
  const t = readText(readme).normalize('NFD');
  assert.ok(t.includes('Keyatala'));
  assert.ok(t.includes(CORRECT.normalize('NFD')));
});

test('Bengali locality in config uses the correct spelling', () => {
  const want = CORRECT.normalize('NFD');
  for (const s of [config.venue.locality.bn, config.venue.address.bn, config.meta.description.bn]) {
    assert.ok(s.normalize('NFD').includes(want), s);
  }
});

test('no other Bengali variants of the locality (ke..tala) in app sources', () => {
  const want = CORRECT.normalize('NFD');
  const re = new RegExp(`${cp(0x0995, 0x09c7)}[\\u0980-\\u09ff]{1,4}?${cp(0x09a4)}[\\u0980-\\u09ff]?${cp(0x09b2, 0x09be)}`, 'g');
  const bad = [];
  for (const f of files) {
    const rel = relative(ROOT, f);
    if (!/^(src\/|index\.html$|README\.md$|public\/)/.test(rel)) continue;
    const t = readText(f);
    if (t === null) continue;
    for (const m of t.normalize('NFD').matchAll(re)) if (m[0] !== want) bad.push(`${rel}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('English spelling is consistently "Keyatala" (no Keoratala / Keyatola / ... variants)', () => {
  const re = /\bK[aeiouy]{1,4}r?[aeiouy]?t{1,2}[aeiouy]l{1,2}[aeiouy]\w*/gi;
  const bad = [];
  let good = 0;
  for (const f of files) {
    const rel = relative(ROOT, f);
    if (!/^(src\/|index\.html$|README\.md$|public\/)/.test(rel)) continue;
    const t = readText(f);
    if (t === null) continue;
    for (const m of t.matchAll(re)) {
      if (m[0] === 'Keyatala') good += 1;
      else bad.push(`${rel}: ${m[0]}`);
    }
  }
  assert.ok(good >= 3, `expected several "Keyatala" occurrences, found ${good}`);
  assert.deepEqual(bad, []);
});
