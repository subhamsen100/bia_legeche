// HeartMarker static checks: blink period >= 333ms (never > 3 flashes/s), spec colours/stroke,
// QA hooks present, reduced-motion branch. Runtime behaviour is covered by tests/e2e/run.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const jsx = readFileSync(`${ROOT}src/components/HeartMarker.jsx`, 'utf8');
const css = readFileSync(`${ROOT}src/components/HeartMarker.module.css`, 'utf8');

test('blink period constant is >= 333ms and about 1.4s', () => {
  const m = /HEART_BLINK_PERIOD_MS\s*=\s*(\d+)/.exec(jsx);
  assert.ok(m, 'HEART_BLINK_PERIOD_MS not found');
  const period = Number(m[1]);
  assert.ok(period >= 333, `blink period ${period}ms is faster than 3 flashes/s`);
  assert.ok(period >= 1200 && period <= 1600, `blink period ${period}ms is not ~1400ms`);
});

test('exposes data-heart-marker + data-blink-period-ms and is aria-hidden', () => {
  assert.match(jsx, /data-heart-marker/);
  assert.match(jsx, /data-blink-period-ms=\{HEART_BLINK_PERIOD_MS\}/);
  assert.match(jsx, /aria-hidden="true"/);
});

test('blink keyframes: opacity 1 <-> 0.25 and scale 1 <-> 1.12, ease-in-out, infinite', () => {
  const kf = /@keyframes\s+hm-blink\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(kf, 'hm-blink keyframes not found');
  assert.match(kf[1], /opacity:\s*0?\.25/);
  assert.match(kf[1], /scale\(1\.12\)/);
  const blink = /\.blink\s*\{([^}]*)\}/.exec(css);
  assert.ok(blink);
  assert.match(blink[1], /ease-in-out/);
  assert.match(blink[1], /infinite/);
  assert.match(blink[1], /var\(--hm-period/);
});

test('stroke colours marigold outer + maroon inner, 2.5px', () => {
  assert.match(jsx, /stroke="#F2A900"/i);
  assert.match(jsx, /stroke="#7A1F2B"/i);
  assert.match(jsx, /2\.5/);
});

test('reduced-motion branch disables draw and blink', () => {
  assert.match(jsx, /useReducedMotion(Config)?\(/);
  assert.match(jsx, /animBlink\s*=\s*blink\s*&&\s*!reduced/);
  assert.match(css, /overflow:\s*visible/);
});
