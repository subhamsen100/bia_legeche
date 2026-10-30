/* Shared, precomputed SVG path data + tiny geometry helpers for the floral art.
   Everything here is computed once at module load (no per-render work). */

/** mulberry32: small deterministic PRNG so "hand-made" irregularity is stable across renders. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

/** Ruffled (rounded-scallop, slightly irregular) closed ring around 0,0 — one marigold petal layer. */
export function ruffle(r, amp, lobes, seed = 1, rot = 0) {
  const R = rng(seed);
  const st = (Math.PI * 2) / lobes;
  const valley = Array.from({ length: lobes }, () => r - amp * (0.2 + R() * 0.3));
  const pt = (a, rad) => `${f(Math.cos(a) * rad)} ${f(Math.sin(a) * rad)}`;
  let d = `M${pt(rot, valley[0])}`;
  for (let i = 0; i < lobes; i++) {
    const a0 = rot + i * st;
    const peak = r + amp * (0.45 + R() * 0.6);
    const k = 1.18 + R() * 0.12;
    d += `C${pt(a0 + st * 0.05, peak * k)} ${pt(a0 + st * 0.95, peak * k)} ${pt(a0 + st, valley[(i + 1) % lobes])}`;
  }
  return `${d}Z`;
}

/** Short radial crease strokes (petal folds) for a ring. */
export function creases(r0, r1, n, seed = 3, rot = 0) {
  const R = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2 + (R() - 0.5) * 0.25;
    const a1 = r0 + R() * (r1 - r0) * 0.3;
    d += `M${f(Math.cos(a) * a1)} ${f(Math.sin(a) * a1)}L${f(Math.cos(a + 0.08) * r1)} ${f(Math.sin(a + 0.08) * r1)}`;
  }
  return d;
}

/** Point + tangent angle (deg) at t on a quadratic bezier. */
export function quadAt(p0, c, p2, t) {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1];
  const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]);
  const dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1]);
  return { x: f(x), y: f(y), a: f((Math.atan2(dy, dx) * 180) / Math.PI) };
}

/** n points spaced roughly evenly by arc length along a quadratic bezier. */
export function quadSpread(p0, c, p2, n, t0 = 0, t1 = 1) {
  const samples = 120;
  const pts = [];
  let len = 0;
  let prev = quadAt(p0, c, p2, t0);
  const acc = [0];
  pts.push(prev);
  for (let i = 1; i <= samples; i++) {
    const p = quadAt(p0, c, p2, t0 + ((t1 - t0) * i) / samples);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    acc.push(len);
    pts.push(p);
    prev = p;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = n === 1 ? len / 2 : (len * k) / (n - 1);
    let j = acc.findIndex((v) => v >= target);
    if (j < 0) j = samples;
    out.push(pts[j]);
  }
  return out;
}

/* ---------------- Marigold (genda) layers, radius ~10 ---------------- */
export const MARIGOLD = {
  shadow: ruffle(10.2, 1.6, 15, 71),
  rings: [
    ruffle(9.2, 1.9, 16, 11),
    ruffle(7.6, 1.7, 14, 23, 0.2),
    ruffle(5.9, 1.5, 12, 37, 0.45),
    ruffle(4.2, 1.2, 10, 41, 0.1),
    ruffle(2.5, 0.9, 7, 53, 0.3),
  ],
  creases: creases(3, 9.6, 26, 7) + creases(2, 6.4, 14, 9, 0.2),
};

/* Colour sets, deepest (outer) to lightest (inner) */
export const MARIGOLD_COLORS = {
  o: ['#E46F0C', '#F08A18', '#F7A42A', '#FBBE46', '#B4510A', '#9C3F06'],
  y: ['#EBA200', '#F5B415', '#F9C83A', '#FDDB6A', '#C98A00', '#A86F00'],
  r: ['#B83A1E', '#CF5428', '#E27237', '#F09452', '#86291A', '#6E2014'],
};

/* ---------------- Shiuli (night jasmine): 6 pinwheel petals, radius ~9 ---------------- */
const SHIULI_PETAL = 'M0-1.2C-2.4-2.8-3.4-6.2-2.2-8.4Q-1.2-9.6.1-8.7Q1.2-9.8 1.9-8.6C2.9-6.4 2.3-3 0-1.2Z';
export const SHIULI = {
  petal: SHIULI_PETAL,
  angles: [0, 60, 120, 180, 240, 300],
  /* faint mid-vein per petal */
  vein: 'M0-1.6Q-.6-5-.2-8',
};

/* ---------------- Rajanigandha (tuberose) ---------------- */
export const RAJ = {
  /* tube from 0,0 up to the flower star at 0,-10 */
  tube: 'M-.7 0C-.6-4-.9-8.6-1.4-11.6Q0-12.6 1.4-11.6C.9-8.6.6-4 .7 0Q0 .5-.7 0Z',
  /* one pointed star petal (repeated 6x around 0,-11) */
  petal: 'M0 0C-1.7-1-1.8-3.6 0-4.8C1.8-3.6 1.7-1 0 0Z',
  bud: 'M0 0C-1.5-2.6-1.8-7.4 0-11C1.8-7.4 1.5-2.6 0 0Z',
};

/* ---------------- Lotus petal (base 0,0 pointing up, h=32) ---------------- */
export const LOTUS_PETAL = 'M0 0C-8.5-5-11.5-18-1.6-31.4Q0-33.2 1.6-31.4C11.5-18 8.5-5 0 0Z';
export const LOTUS_VEIN = 'M0-2Q-.8-15 0-29';

/* ---------------- Leaf (base 0,0 pointing +x, len 18) ---------------- */
export const LEAF = 'M0 0C4-4.2 11-5 18 0C11 5 4 4.2 0 0Z';
export const LEAF_RIB = 'M.5 0Q8-.6 16.5 0';

/* ---------------- Marigold single petal (for falling petals) ---------------- */
export const MARIGOLD_PETAL =
  'M0 0C-4.6-1.8-6.6-6.6-5.2-10.2Q-4-11.6-2.7-10.6Q-1.4-12.4.1-10.9Q1.6-12.4 2.9-10.6Q4.3-11.5 5.3-10C6.6-6.6 4.6-1.8 0 0Z';

/* ---------------- Heart (HeartMarker), viewBox 0 0 64 64 ---------------- */
export const HEART =
  'M32 57C18 47 3 37 3 21C3 11 10 4 19 4C25 4 29.5 7.5 32 12C34.5 7.5 39 4 45 4C54 4 61 11 61 21C61 37 46 47 32 57Z';

/* ---------------- Kolka heart halves, viewBox 0 0 100 100 ---------------- */
export const KOLKA_HEART_L =
  'M50 90C36 80 10 64 10 40C10 22 24 11 37 14C48 17 52 29 45 36C40 41 32 37 35 31C37 27 42 28 42 31';
export const KOLKA_HEART_R =
  'M50 90C64 80 90 64 90 40C90 22 76 11 63 14C52 17 48 29 55 36C60 41 68 37 65 31C63 27 58 28 58 31';
export const KOLKA_HEART_INNER =
  'M50 79C40 72 21 60 21 42C21 30 30 23 38 25M50 79C60 72 79 60 79 42C79 30 70 23 62 25';

/* ---------------- Paisley (kolka/boteh), viewBox 0 0 64 64 ---------------- */
export const PAISLEY =
  'M41 5C55 13 56 34 46 48C38 59 20 61 13 50C7 40 13 28 25 25C34 23 42 18 41 11C40 8 37 7 35 9C33 11 35 14 37 13';
export const PAISLEY_INNER = 'M38 20C47 27 46 40 39 47C33 53 23 53 19 47C15 41 19 34 27 33C33 32 37 27 38 20Z';
