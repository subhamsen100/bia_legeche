#!/usr/bin/env node
// Verifies the invitation QR code: rasterizes the exact SVG string MapQR renders
// (buildQrSvg(config.venue.mapsUrl, MAP_QR_OPTIONS)) with @resvg/resvg-js, decodes it with jsqr,
// and asserts it equals config.venue.mapsUrl. Also asserts EC level H and a 4-module quiet zone.
// Exits 1 on any failure.
import { Resvg } from '@resvg/resvg-js';
import jsQRModule from 'jsqr';
import config from '../src/config.js';
import { buildQrSvg, getQrMatrix, MAP_QR_OPTIONS } from '../src/components/MapQRMatrix.js';

const jsQR = typeof jsQRModule === 'function' ? jsQRModule : jsQRModule.default;
const url = config.venue.mapsUrl;

// CSS px sizes: mobile 160, desktop 220, each at 1x and 2x device scale.
const RENDERS = [
  { label: 'mobile 160px @1x', px: 160 },
  { label: 'mobile 160px @2x', px: 320 },
  { label: 'desktop 220px @1x', px: 220 },
  { label: 'desktop 220px @2x', px: 440 },
];

let failures = 0;
const pass = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
};
const check = (ok, msg) => (ok ? pass(msg) : fail(msg));

const hexToRgb = (hex) => {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

function rasterize(svg, widthPx) {
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: widthPx } }).render();
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.pixels) };
}

// Every pixel within the quiet-zone band (minus 1px anti-aliasing slack) must be the background.
function quietZoneClean({ width, height, data }, bandPx, bg) {
  const limit = Math.floor(bandPx) - 1;
  const isBg = (x, y) => {
    const i = (y * width + x) * 4;
    return (
      Math.abs(data[i] - bg[0]) <= 6 && Math.abs(data[i + 1] - bg[1]) <= 6 && Math.abs(data[i + 2] - bg[2]) <= 6
    );
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inBand = x < limit || y < limit || x >= width - limit || y >= height - limit;
      if (inBand && !isBg(x, y)) return { ok: false, at: [x, y] };
    }
  }
  return { ok: true };
}

function isDarkPixel({ width, data }, x, y, fg) {
  const i = (Math.floor(y) * width + Math.floor(x)) * 4;
  return Math.abs(data[i] - fg[0]) <= 40 && Math.abs(data[i + 1] - fg[1]) <= 40 && Math.abs(data[i + 2] - fg[2]) <= 40;
}

console.log(`verify-qr: expecting "${url}"`);

if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
  fail(`config.venue.mapsUrl is not an http(s) URL: ${JSON.stringify(url)}`);
} else {
  // 1. Matrix: EC level H straight from QRCode.create.
  const matrix = getQrMatrix(url);
  check(matrix.errorCorrectionLevel === 'H', `error correction level is ${matrix.errorCorrectionLevel} (want H)`);
  console.log(`        version ${matrix.version}, ${matrix.size}x${matrix.size} modules, mask ${matrix.maskPattern}`);

  // 2. SVG string: the one MapQR renders.
  const svg = buildQrSvg(url, MAP_QR_OPTIONS);
  const qz = MAP_QR_OPTIONS.quietZone;
  const total = matrix.size + 2 * qz;
  check(qz === 4, `quiet zone option is ${qz} modules (want 4)`);
  check(svg.includes(`viewBox="0 0 ${total} ${total}"`), `viewBox spans matrix + 2x${qz} quiet-zone modules (${total})`);
  check(svg.includes('data-qr-ec="H"'), 'SVG is tagged data-qr-ec="H"');
  check(
    svg.includes(`<rect width="${total}" height="${total}" fill="${MAP_QR_OPTIONS.background}"/>`),
    `background ${MAP_QR_OPTIONS.background} covers the full viewBox (quiet zone included)`,
  );
  check(!/#C9A24B|#F2A900/i.test(svg), 'no gold/marigold inside the QR SVG');

  const bg = hexToRgb(MAP_QR_OPTIONS.background);
  const fg = hexToRgb(MAP_QR_OPTIONS.moduleColor);

  // 3. Rasterize at every size, decode, check quiet zone in pixels.
  for (const { label, px } of RENDERS) {
    const raster = rasterize(svg, px);
    const decoded = jsQR(raster.data, raster.width, raster.height, { inversionAttempts: 'dontInvert' });
    const got = decoded ? decoded.data : null;
    check(got === url, `${label}: decoded ${JSON.stringify(got)}`);

    const modulePx = raster.width / total;
    const qzCheck = quietZoneClean(raster, qz * modulePx, bg);
    // Exactly 4 modules: the finder's top edge (module row qz, col qz+3) is dark.
    const finderEdgeDark = isDarkPixel(raster, (qz + 3.5) * modulePx, (qz + 0.5) * modulePx, fg);
    check(
      qzCheck.ok && finderEdgeDark,
      `${label}: ${qz}-module quiet zone (${(qz * modulePx).toFixed(1)}px) clean` +
        (qzCheck.ok ? '' : ` — non-background pixel at ${qzCheck.at}`) +
        (finderEdgeDark ? '' : ' — finder pattern not found right after the quiet zone'),
    );
  }

  // 4. Robustness: the square-module variant must decode too (fallback option).
  const square = buildQrSvg(url, { ...MAP_QR_OPTIONS, rounded: false });
  const sq = rasterize(square, 160);
  const sqDecoded = jsQR(sq.data, sq.width, sq.height);
  check(sqDecoded?.data === url, `square-module variant 160px @1x: decoded ${JSON.stringify(sqDecoded?.data ?? null)}`);
}

if (failures) {
  console.log(`\nverify-qr: FAIL (${failures} check${failures > 1 ? 's' : ''} failed)`);
  process.exit(1);
}
console.log('\nverify-qr: PASS — QR decodes to config.venue.mapsUrl at 160px and 220px (1x and 2x), EC H, 4-module quiet zone');
