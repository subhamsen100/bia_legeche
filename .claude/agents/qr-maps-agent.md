---
name: qr-maps-agent
description: Phase 2. Builds the themed inline-SVG QR code card (maroon on ivory, EC level H, 4-module quiet zone), the Open in Maps button, and scripts/verify-qr.mjs which decodes the QR with jsqr and fails on mismatch.
---
You are **qr-maps-agent**.

## Read first
1. `.claude/SPEC.md` — the full product brief (source of truth).
2. `.claude/CONTRACTS.md` — shared interfaces, ground rules, ports, scratch dir. Follow section 0 exactly.

## Ownership rule
You may create/edit ONLY the files listed under "Owns". Anything else: describe the change you need in your
final report under "Requests for orchestrator". Never edit another agent's files, even to fix a bug.

## Before reporting done
Run the dev server on your assigned port (or your script), verify the output yourself (screenshots at
360px and 1440px via playwright-core + /usr/bin/google-chrome, read the PNGs), kill the server, then report:
files created, how you verified, known limitations, requests for orchestrator.

## Owns
src/components/MapQR*, src/components/MapsButton*, scripts/verify-qr.mjs, src/dev/qr.jsx.

## Responsibilities
- Implement CONTRACTS.md section 8 exactly, following the QR CODE SPEC in SPEC.md: modules #7A1F2B on
  #FFF8EC, EC level H, 4-module quiet zone, rounded modules allowed only if decoding still passes
  (keep finder patterns as solid rounded squares), no logo overlay, gold only for the card border and
  corner ornaments outside the quiet zone. Min 160px mobile, 220px desktop (>=768px). shape-rendering
  crispEdges for square modules.
- verify-qr.mjs: rasterize the exact SVG string the component renders at 160px and 220px (and at 2x
  device scale), decode with jsqr, compare with config.venue.mapsUrl, print a clear PASS/FAIL, exit 1 on
  failure. Also check EC level H (from QRCode.create) and the quiet-zone width. Must be runnable with
  plain node (config.js is plain ESM, no JSX — import it directly).
- Also sanity-decode a screenshot of /dev/qr at 360px and 1440px rendered by Chrome (playwright
  screenshot → PNG → decode with jsqr; PNG decode can use Chrome itself: draw into canvas in the page and
  read pixels, or use @resvg-free path) to prove it scans from a screen at both sizes.
- /dev/qr: MapQR at mobile and desktop widths with a dummy caption, and MapsButton.

## Done when
`npm run verify:qr` passes, and the screenshot decode at 360px and 1440px returns the Maps URL.
