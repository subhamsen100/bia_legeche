// Pure QR helpers (no React, no CSS) — importable from plain Node (scripts/verify-qr.mjs) and the browser.
// QRCode.create is synchronous, so the SVG string is ready on first paint.
import QRCode from 'qrcode';

const EC_NAMES = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' };

// Rounding radii, in module units.
const MODULE_RADIUS = 0.42; // convex corners of data modules
const FINDER_OUTER_RADIUS = 2.1;
const FINDER_INNER_RADIUS = 1.25;
const FINDER_EYE_RADIUS = 0.9;

/**
 * Build the QR matrix for `text` with error-correction level H.
 * @returns {{ size: number, version: number, errorCorrectionLevel: 'L'|'M'|'Q'|'H',
 *   maskPattern: number, isDark: (row: number, col: number) => boolean, rows: boolean[][] }}
 */
export function getQrMatrix(text) {
  const qr = QRCode.create(String(text), { errorCorrectionLevel: 'H' });
  const { size, data } = qr.modules;
  const isDark = (row, col) =>
    row >= 0 && col >= 0 && row < size && col < size && Boolean(data[row * size + col]);
  const rows = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => isDark(r, c)),
  );
  return {
    size,
    version: qr.version,
    errorCorrectionLevel: EC_NAMES[qr.errorCorrectionLevel.bit],
    maskPattern: qr.maskPattern,
    isDark,
    rows,
  };
}

// The exact options MapQR renders with; scripts/verify-qr.mjs rasterizes buildQrSvg(url, MAP_QR_OPTIONS).
export const MAP_QR_OPTIONS = Object.freeze({
  size: 220,
  moduleColor: '#7A1F2B',
  background: '#FFF8EC',
  quietZone: 4,
  rounded: true,
});

// Compact number: 3 decimals max, no leading zero (0.42 -> ".42", -0.42 -> "-.42").
const fmt = (n) => String(Math.round(n * 1000) / 1000).replace(/^(-?)0\./, '$1.');

const arc = (r, dx, dy, sweep = 1) => `a${fmt(r)} ${fmt(r)} 0 0 ${sweep} ${fmt(dx)} ${fmt(dy)}`;

// Clockwise rounded rectangle with per-corner radii, relative commands
// (all subpaths share winding so a single nonzero path unions cleanly, without seams).
function roundedRect(x, y, w, h, tl, tr, br, bl) {
  if (!tl && !tr && !br && !bl) return `M${fmt(x)} ${fmt(y)}h${fmt(w)}v${fmt(h)}h${fmt(-w)}z`;
  let d = `M${fmt(x + tl)} ${fmt(y)}h${fmt(w - tl - tr)}`;
  if (tr) d += arc(tr, tr, tr);
  d += `v${fmt(h - tr - br)}`;
  if (br) d += arc(br, -br, br);
  d += `h${fmt(-(w - br - bl))}`;
  if (bl) d += arc(bl, -bl, -bl);
  d += `v${fmt(-(h - bl - tl))}`;
  if (tl) d += arc(tl, tl, -tl);
  return `${d}z`;
}

// Counter-clockwise rounded rectangle (used to punch the finder ring's hole).
function roundedRectCCW(x, y, w, h, r) {
  return (
    `M${fmt(x + r)} ${fmt(y)}${arc(r, -r, r, 0)}v${fmt(h - 2 * r)}${arc(r, r, r, 0)}` +
    `h${fmt(w - 2 * r)}${arc(r, r, -r, 0)}v${fmt(-(h - 2 * r))}${arc(r, -r, -r, 0)}z`
  );
}

function isFinderCell(row, col, size) {
  const far = size - 7;
  return (row < 7 && col < 7) || (row < 7 && col >= far) || (row >= far && col < 7);
}

/**
 * Render `text` as an SVG QR code string.
 * Geometry is in module units (viewBox = matrix size + 2 * quietZone); `size` sets width/height in px.
 * The background rect covers the full viewBox, so the quiet zone is always part of the image.
 */
export function buildQrSvg(
  text,
  { size = 220, moduleColor = '#7A1F2B', background = '#FFF8EC', quietZone = 4, rounded = true } = {},
) {
  const matrix = getQrMatrix(text);
  const n = matrix.size;
  const qz = quietZone;
  const total = n + 2 * qz;
  const dark = matrix.isDark;

  let d = '';
  if (rounded) {
    // Data + timing + alignment modules: convex corners rounded only where both neighbours are light,
    // so runs of modules merge into smooth blobs and every module keeps its full square footprint
    // except at outer corners.
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        if (!dark(r, c) || isFinderCell(r, c, n)) continue;
        const up = dark(r - 1, c);
        const down = dark(r + 1, c);
        const left = dark(r, c - 1);
        const right = dark(r, c + 1);
        const k = MODULE_RADIUS;
        d += roundedRect(
          c + qz,
          r + qz,
          1,
          1,
          !up && !left ? k : 0,
          !up && !right ? k : 0,
          !down && !right ? k : 0,
          !down && !left ? k : 0,
        );
      }
    }
    // Finder patterns: solid rounded squares (7x7 ring + 3x3 eye).
    for (const [fr, fc] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ]) {
      const x = fc + qz;
      const y = fr + qz;
      const o = FINDER_OUTER_RADIUS;
      const e = FINDER_EYE_RADIUS;
      d += roundedRect(x, y, 7, 7, o, o, o, o);
      d += roundedRectCCW(x + 1, y + 1, 5, 5, FINDER_INNER_RADIUS);
      d += roundedRect(x + 2, y + 2, 3, 3, e, e, e, e);
    }
  } else {
    // Square modules: merge horizontal runs into one rect each.
    for (let r = 0; r < n; r += 1) {
      let c = 0;
      while (c < n) {
        if (!dark(r, c)) {
          c += 1;
          continue;
        }
        const start = c;
        while (c < n && dark(r, c)) c += 1;
        d += `M${start + qz} ${r + qz}h${c - start}v1h${start - c}z`;
      }
    }
  }

  const px = fmt(size);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${px}" height="${px}"` +
    ` shape-rendering="${rounded ? 'geometricPrecision' : 'crispEdges'}"` +
    ` data-qr-version="${matrix.version}" data-qr-ec="${matrix.errorCorrectionLevel}"` +
    ` data-qr-modules="${n}" data-qr-quiet-zone="${qz}" focusable="false" aria-hidden="true">` +
    `<rect width="${total}" height="${total}" fill="${background}"/>` +
    `<path fill="${moduleColor}" fill-rule="nonzero" d="${d}"/>` +
    `</svg>`
  );
}

export default buildQrSvg;
