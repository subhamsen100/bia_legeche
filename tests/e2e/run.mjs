// End-to-end audit of the production build (playwright-core + system Chrome).
//
//   npm run test:e2e                      build into $QA_OUT/dist, serve on :5207, run, stop
//   QA_OUT=/some/dir npm run test:e2e     choose where build, screenshots and results go
//   QA_NO_BUILD=1 / QA_BASE_URL=http://localhost:5173   reuse a build / an already running server
//   QA_ONLY=walk,clock,...                run a subset of suites (names below)
//
// Exits 1 if any check FAILS. WARN results are printed and saved but do not fail the run.
// Results: $QA_OUT/e2e-results.json, screenshots: $QA_OUT/shots/*.png
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../../src/config.js';
import { buildAndServe, CHROME, OUT } from '../../scripts/qa-serve.mjs';
import jsQR from 'jsqr';
import { a11yProbe, heartProbe, infiniteAnimations, layoutProbe } from './probe.mjs';

const SHOTS = join(OUT, 'shots');
mkdirSync(SHOTS, { recursive: true });
const ONLY = (process.env.QA_ONLY || '').split(',').filter(Boolean);
const want = (s) => !ONLY.length || ONLY.includes(s);

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640, mobile: true },
  { name: '414x896', width: 414, height: 896, mobile: true },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
];
const SCENES = config.timeline.scenes;
const TOTAL_MS = SCENES.reduce((a, s) => a + s.durationMs, 0);
const MAPS_URL = config.venue.mapsUrl;
const BN_DIGIT = /[০-৯]/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ results */
const results = [];
function record(status, name, details = {}) {
  results.push({ status, name, details });
  const tag = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL';
  const d = Object.keys(details).length ? ` ${JSON.stringify(details).slice(0, 600)}` : '';
  console.log(`${tag}  ${name}${status === 'pass' && !/\(info\)/.test(name) ? '' : d}`);
}
const check = (cond, name, details) => record(cond ? 'pass' : 'fail', name, cond ? {} : details);
const soft = (cond, name, details) => record(cond ? 'pass' : 'warn', name, cond ? {} : details);
async function suite(name, fn) {
  if (!want(name)) return;
  const t = Date.now();
  console.log(`\n=== ${name}`);
  try {
    await fn();
  } catch (e) {
    record('fail', `${name}: suite crashed`, { error: String(e && e.stack ? e.stack : e).slice(0, 800) });
  }
  console.log(`--- ${name} done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

/* ------------------------------------------------------------------ console capture */
const consoleIssues = [];
function watch(page, label, { allow = [] } = {}) {
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const text = m.text();
    if (allow.some((re) => re.test(text))) return;
    if (/Reduced Motion enabled/i.test(text)) return; // framer-motion dev notice (not an app error)
    consoleIssues.push({ label, type: m.type(), text: text.slice(0, 300) });
  });
  page.on('pageerror', (e) => consoleIssues.push({ label, type: 'pageerror', text: String(e).slice(0, 300) }));
}

/* ------------------------------------------------------------------ helpers */
let browser;
let BASE;

async function newPage(vp, { reducedMotion = 'no-preference', lang, clock, label, allow, init } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion,
  });
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('invite.lang', l), lang);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  if (clock) await page.clock.install({ time: clock });
  watch(page, label || vp.name, { allow });
  return { ctx, page };
}

const stageScene = (page) =>
  page.evaluate(() => {
    const st = document.querySelector('[data-timeline-stage]');
    if (st) return st.getAttribute('data-scene-id') || 'stage';
    if (document.querySelector('[data-scene="final"]')) return 'final';
    if (document.querySelector('[data-gate-button]')) return 'gate';
    return 'unknown';
  });

async function openGate(page) {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const gate = page.locator('[data-gate-button]');
  await gate.waitFor({ state: 'visible', timeout: 10000 });
  await gate.click();
}

async function toFinal(page) {
  // Escape on the focused stage calls finish(); fall back to tap-skipping.
  await page.waitForSelector('[data-timeline-stage]', { timeout: 5000 });
  await page.focus('[data-timeline-stage]');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 10 && (await stageScene(page)) !== 'final'; i++) {
    await page.click('[data-timeline-stage]', { position: { x: 30, y: 300 } }).catch(() => {});
    await sleep(150);
  }
  await page.waitForSelector('[data-scene="final"]', { timeout: 5000 });
}

async function skipTo(page, id) {
  for (let i = 0; i < 10; i++) {
    const cur = await stageScene(page);
    if (cur === id) return true;
    if (cur === 'final') return false;
    await page.focus('[data-timeline-stage]');
    await page.keyboard.press('ArrowRight');
    await sleep(250);
  }
  return (await stageScene(page)) === id;
}

// Screenshot the rendered QR plate (with whatever overlays the user would see) and decode it with jsqr.
async function decodeQr(page, sel) {
  const loc = page.locator(sel).first();
  if (!(await loc.count())) return { ok: false, reason: 'no QR element' };
  const png = await loc.screenshot({ animations: 'allow' });
  const px = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth + 40;
    c.height = img.naturalHeight + 40;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 20, 20);
    return { w: c.width, h: c.height, data: Array.from(g.getImageData(0, 0, c.width, c.height).data) };
  }, png.toString('base64'));
  const res = jsQR(Uint8ClampedArray.from(px.data), px.w, px.h);
  return { ok: Boolean(res), data: res ? res.data : null, size: [px.w - 40, px.h - 40] };
}

function summarizeLayout(p) {
  return {
    hOverflow: p.scrollWidth - p.vw,
    outOfView: p.outOfView.slice(0, 6),
    clipped: p.clipped.slice(0, 6),
  };
}

/* ------------------------------------------------------------------ suites */

// 1. Real-time guided walk at every viewport (in parallel): gate, every scene sampled near its end,
//    final page. Also measures the real-time sequence length.
async function walkViewport(vp) {
  const { ctx, page } = await newPage(vp, { label: `walk ${vp.name}` });
  const tag = `[${vp.name}]`;
  const layouts = {};
  try {
    await page.goto(BASE + '/', { waitUntil: 'load' });
    const gate = page.locator('[data-gate-button]');
    await gate.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(1800);
    const g = await page.evaluate(() => {
      const b = document.querySelector('[data-gate-button]');
      const r = b.getBoundingClientRect();
      return { text: b.innerText, label: b.getAttribute('aria-label'), inView: r.width > 0 && r.top < innerHeight && r.bottom > 0 };
    });
    check(g.inView && /খুলুন/.test(g.text) && /Tap to open/.test(g.text), `${tag} gate visible with "খুলুন / Tap to open"`, g);
    check(Boolean(g.label), `${tag} gate button has aria-label`, g);
    const gl = await page.evaluate(layoutProbe, { rootSel: '[data-scene="gate"]', fitViewport: true });
    layouts.gate = gl;
    check(gl.scrollWidth <= gl.vw, `${tag} gate: no horizontal overflow`, summarizeLayout(gl));
    check(gl.outOfView.length === 0 && gl.clipped.length === 0, `${tag} gate: text inside viewport, not clipped`, summarizeLayout(gl));
    await page.screenshot({ path: join(SHOTS, `${vp.name}-0-gate.png`) });
    check((await page.locator('[data-audio-failed], [aria-pressed][data-no-skip]').count()) === 0, `${tag} audio control hidden before the gate`, {});

    const t0 = Date.now();
    await gate.click();
    const sampled = new Set();
    const seenOrder = [];
    let enteredAt = Date.now();
    let cur = null;
    let finalAt = null;
    const deadline = t0 + TOTAL_MS + 30000;
    while (Date.now() < deadline) {
      const id = await stageScene(page);
      if (id !== cur) {
        cur = id;
        enteredAt = Date.now();
        seenOrder.push({ id, at: enteredAt - t0 });
        if (id === 'final') {
          finalAt = Date.now();
          break;
        }
      }
      const sc = SCENES.find((s) => s.id === cur);
      if (sc && !sampled.has(cur) && Date.now() - enteredAt >= sc.durationMs - 1600) {
        sampled.add(cur);
        const p = await page.evaluate(layoutProbe, { rootSel: '[data-scene-layer="active"]', fitViewport: true });
        layouts[cur] = p;
        await page.screenshot({ path: join(SHOTS, `${vp.name}-${SCENES.indexOf(sc) + 1}-${cur}.png`) });
        check(p.rootFound, `${tag} ${cur}: active scene layer found`, {});
        check(p.scrollWidth <= p.vw, `${tag} ${cur}: no horizontal overflow`, { scrollWidth: p.scrollWidth, vw: p.vw });
        check(
          p.htmlOverflow === 'hidden' && p.scrollY === 0 && (!p.rootScroll || p.rootScroll.scrollH <= p.rootScroll.clientH + 2),
          `${tag} ${cur}: no vertical scroll (page locked, scene fits)`,
          { htmlOverflow: p.htmlOverflow, scrollY: p.scrollY, rootScroll: p.rootScroll },
        );
        check(p.outOfView.length === 0, `${tag} ${cur}: all visible text inside the viewport`, { outOfView: p.outOfView.slice(0, 8) });
        check(p.clipped.length === 0, `${tag} ${cur}: no clipped text (Bengali/English)`, { clipped: p.clipped.slice(0, 8) });
        check(p.bnTypography.length === 0, `${tag} ${cur}: Bengali line-height>=1.7, no letter-spacing/text-transform`, { bad: p.bnTypography.slice(0, 6) });
        soft(p.controlOverlaps.length === 0, `${tag} ${cur}: text not under fixed controls (toggle/mute/progress)`, { overlaps: p.controlOverlaps.slice(0, 6) });
        soft(p.decorOverlaps.length === 0, `${tag} ${cur}: text not covered by corner garlands`, { overlaps: p.decorOverlaps.slice(0, 6) });
        soft(p.contrast.length === 0, `${tag} ${cur}: text contrast (4.5:1 body / 3:1 large)`, { low: p.contrast.slice(0, 8) });
        if (p.contrastApprox.length) record('pass', `${tag} ${cur}: (info) low computed contrast over gradient/sibling backgrounds, verify on screenshot`, { approx: p.contrastApprox.slice(0, 8) });
        if (cur === 'date') {
          const h = await page.evaluate(heartProbe, '[data-scene-layer="active"] [data-marked-date]');
          check(h.found && h.hasHeart, `${tag} date scene: calendar marked cell has the heart`, h);
          check(!h.clippedBy, `${tag} date scene: heart marker not clipped`, { clippedBy: h.clippedBy });
          soft(h.neighbourOverlap.length === 0, `${tag} date scene: heart outline (at 1.12 blink scale) does not cover neighbouring dates`, { overlap: h.neighbourOverlap, heart: h.rect, cell: h.cellRect });
          const cells = await page.evaluate(() =>
            [...document.querySelectorAll('[data-scene-layer="active"] [data-day]')].map((c) => c.getBoundingClientRect().height),
          );
          soft(vp.mobile ? Math.min(...cells) >= 40 : true, `${tag} date scene: calendar cells >= 40px tall on mobile`, { minCellHeight: Math.round(Math.min(...cells) * 10) / 10 });
        }
        if (cur === 'venue') {
          const q = await page.evaluate(() => {
            const qr = document.querySelector('[data-scene-layer="active"] [data-map-qr] [role="img"] svg');
            const b = document.querySelector('[data-scene-layer="active"] [data-maps-button]');
            return { qrW: qr ? Math.round(qr.getBoundingClientRect().width) : 0, href: b?.getAttribute('href') };
          });
          const min = vp.width >= 768 ? 220 : 160;
          check(q.qrW >= min, `${tag} venue scene: QR rendered >= ${min}px`, q);
          check(q.href === MAPS_URL, `${tag} venue scene: Open in Maps links to config URL`, q);
          const dq = await decodeQr(page, '[data-scene-layer="active"] [data-map-qr] [role="img"]');
          check(dq.ok && dq.data === MAPS_URL, `${tag} venue scene: on-screen QR decodes to the Maps URL (jsqr)`, dq);
        }
        if (cur === 'family') {
          const f = await page.evaluate(() =>
            [...document.querySelectorAll('[data-scene-layer="active"] [data-portrait]')].map((p) => ({
              kind: p.dataset.portrait,
              state: p.dataset.photoState,
              silhouette: Boolean(p.querySelector('svg')),
            })),
          );
          check(f.length === 2 && f.every((x) => x.state === 'error' && x.silhouette), `${tag} family scene: missing photos fall back to silhouettes`, { f });
          if (vp.width >= 768) {
            const pos = await page.evaluate(() => {
              const r = (k) => document.querySelector(`[data-scene-layer="active"] [data-portrait="${k}"]`)?.getBoundingClientRect();
              const g = r('groom');
              const b = r('bride');
              return g && b ? { groomLeft: g.left, brideLeft: b.left, sameRow: Math.abs(g.top - b.top) < 40 } : null;
            });
            check(pos && pos.brideLeft < pos.groomLeft && pos.sameRow, `${tag} family scene: bride left, groom right on desktop`, pos);
          } else {
            const pos = await page.evaluate(() => {
              const r = (k) => document.querySelector(`[data-scene-layer="active"] [data-portrait="${k}"]`)?.getBoundingClientRect();
              const g = r('groom');
              const b = r('bride');
              return g && b ? { groomTop: Math.round(g.top), brideTop: Math.round(b.top), groomLeft: Math.round(g.left), brideLeft: Math.round(b.left) } : null;
            });
            soft(pos && pos.brideTop + 20 < pos.groomTop, `${tag} family scene: portraits stacked on mobile (spec)`, pos);
          }
        }
      }
      await sleep(150);
    }
    const realMs = finalAt ? finalAt - t0 : null;
    check(
      // The gate may still be recorded once while it fades out over the incoming stage
      // (AnimatePresence exit); allow exactly one leading 'gate', otherwise strict.
      JSON.stringify(
        seenOrder
          .filter((s) => s.id !== 'stage')
          .map((s) => s.id)
          .filter((id, i) => !(i === 0 && id === 'gate')),
      ) === JSON.stringify([...SCENES.map((s) => s.id), 'final']),
      `${tag} scenes play in config order`,
      { seenOrder },
    );
    check(realMs !== null && realMs >= 60000, `${tag} real-time guided sequence >= 60s`, { realMs });
    soft(realMs !== null && Math.abs(realMs - TOTAL_MS) < 6000, `${tag} real-time guided sequence ~= config total ${TOTAL_MS}ms`, { realMs });

    // final page
    if (finalAt) {
      await sleep(1500);
      const f0 = await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).overflowY, body: getComputedStyle(document.body).overflowY, sh: document.documentElement.scrollHeight, vh: innerHeight }));
      await page.evaluate(() => window.scrollTo(0, 600));
      await sleep(200);
      const y = await page.evaluate(() => window.scrollY);
      check(f0.html !== 'hidden' && f0.body !== 'hidden' && f0.sh > f0.vh && y > 0, `${tag} final page is freely scrollable`, { ...f0, scrollYAfterScroll: y });
      // reveal everything (InView fallback 3.5s) then probe the whole page
      await page.evaluate(async () => {
        for (let yy = 0; yy < document.documentElement.scrollHeight; yy += innerHeight * 0.6) {
          window.scrollTo(0, yy);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await sleep(4500);
      const fp = await page.evaluate(layoutProbe, { rootSel: '[data-scene="final"]', fitViewport: false });
      layouts.final = fp;
      check(fp.scrollWidth <= fp.vw, `${tag} final: no horizontal overflow`, { scrollWidth: fp.scrollWidth, vw: fp.vw });
      check(fp.outOfView.length === 0 && fp.clipped.length === 0, `${tag} final: no clipped / off-screen text`, summarizeLayout(fp));
      check(fp.bnTypography.length === 0, `${tag} final: Bengali typography rules`, { bad: fp.bnTypography.slice(0, 6) });
      soft(fp.contrast.length === 0, `${tag} final: text contrast`, { low: fp.contrast.slice(0, 10) });
      if (fp.contrastApprox.length) record('pass', `${tag} final: (info) low computed contrast over gradient/sibling backgrounds, verify on screenshot`, { approx: fp.contrastApprox.slice(0, 10) });
      soft(fp.decorOverlaps.length === 0, `${tag} final: text not covered by corner garlands (at scroll 0)`, { overlaps: fp.decorOverlaps.slice(0, 6) });
      const fin = await page.evaluate((maps) => {
        const qrs = document.querySelectorAll('[data-map-qr]');
        const qr = qrs[0]?.querySelector('[role="img"] svg');
        const btn = document.querySelector('[data-maps-button]');
        const wa = [...document.querySelectorAll('a[href^="https://wa.me/"]')];
        const text = wa[0] ? decodeURIComponent(new URL(wa[0].href).searchParams.get('text') || '') : '';
        return {
          qrCount: qrs.length,
          qrW: qr ? Math.round(qr.getBoundingClientRect().width) : 0,
          mapsHref: btn?.getAttribute('href'),
          mapsTarget: btn?.getAttribute('target'),
          mapsRel: btn?.getAttribute('rel'),
          replay: Boolean(document.querySelector('[data-replay]')),
          waCount: wa.length,
          waHasBn: /[ঀ-৿]/.test(text),
          waHasEn: /reception/i.test(text),
          waHasMaps: text.includes(maps),
          calendars: document.querySelectorAll('[data-month-calendar]').length,
          countdown: Boolean(document.querySelector('[data-countdown]')),
          portraits: document.querySelectorAll('[data-portrait]').length,
        };
      }, MAPS_URL);
      check(fin.qrCount === 1, `${tag} final: exactly one QR`, fin);
      check(fin.qrW >= (vp.width >= 768 ? 220 : 160), `${tag} final: QR size >= ${vp.width >= 768 ? 220 : 160}px`, fin);
      check(fin.mapsHref === MAPS_URL && fin.mapsTarget === '_blank' && /noopener/.test(fin.mapsRel || ''), `${tag} final: Open in Maps button`, fin);
      check(fin.replay && fin.waCount >= 1 && fin.waHasBn && fin.waHasEn && fin.waHasMaps, `${tag} final: Replay + bilingual WhatsApp share`, fin);
      await page.locator('[data-map-qr]').scrollIntoViewIfNeeded();
      await sleep(600);
      const dqf = await decodeQr(page, '[data-scene="final"] [data-map-qr] [role="img"]');
      check(dqf.ok && dqf.data === MAPS_URL, `${tag} final: on-screen QR decodes to the Maps URL (jsqr)`, dqf);
      check(fin.calendars === 1 && fin.countdown && fin.portraits === 2, `${tag} final: calendar, countdown, both portraits present`, fin);
      await page.locator('[data-month-calendar]').scrollIntoViewIfNeeded();
      await sleep(3500);
      const h = await page.evaluate(heartProbe);
      check(h.hasHeart && h.state === 'blinking' && h.animationName !== 'none' && h.iteration === 'infinite', `${tag} final: calendar heart blinks`, h);
      const durMs = parseFloat(h.animationDuration) * (/ms$/.test(h.animationDuration) ? 1 : 1000);
      check(durMs >= 333 && h.period >= 333, `${tag} final: blink period >= 333ms (<= 3 flashes/s)`, { animationDuration: h.animationDuration, period: h.period });
      soft(Math.abs(durMs - 1400) <= 200 && /ease-in-out|cubic-bezier\(0\.42, 0, 0\.58, 1\)/.test(h.timing), `${tag} final: blink ~1.4s ease-in-out`, h);
      check(h.heartAriaHidden === 'true', `${tag} final: heart decoration aria-hidden`, h);
      check(!h.clippedBy, `${tag} final: heart not clipped`, { clippedBy: h.clippedBy });
      soft(h.neighbourOverlap.length === 0, `${tag} final: heart outline (at 1.12 blink scale) does not cover neighbouring dates`, { overlap: h.neighbourOverlap, heart: h.rect, cell: h.cellRect });
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
      await page.screenshot({ path: join(SHOTS, `${vp.name}-8-final-top.png`) });
      await page.screenshot({ path: join(SHOTS, `${vp.name}-9-final-full.png`), fullPage: true });

      // replay re-locks the scroll and restarts at scene 1
      await page.click('[data-replay]');
      await sleep(600);
      const rp = await page.evaluate(() => ({
        scene: document.querySelector('[data-timeline-stage]')?.getAttribute('data-scene-id'),
        html: getComputedStyle(document.documentElement).overflowY,
      }));
      check(rp.scene === SCENES[0].id && rp.html === 'hidden', `${tag} Replay restarts at scene 1 with scroll locked`, rp);
    }
  } finally {
    await ctx.close();
  }
  return layouts;
}

// 2. Fake-clock timeline: not final before 60s, final after the configured total; scene order;
//    countdown values against the faked Date.
async function clockSuite() {
  const T0 = new Date('2027-11-20T18:00:00+05:30');
  const { ctx, page } = await newPage(VIEWPORTS[0], { clock: T0, label: 'clock' });
  try {
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.clock.pauseAt(new Date(T0.getTime() + 5000));
    await page.locator('[data-gate-button]').click();
    await sleep(300);
    const seen = [];
    let elapsed = 0;
    const step = 1000;
    let finalAt = null;
    let at59 = null;
    while (elapsed < TOTAL_MS + 5000) {
      await page.clock.runFor(step);
      elapsed += step;
      await sleep(40); // let React commit (MessageChannel is not faked)
      const id = await stageScene(page);
      if (!seen.length || seen[seen.length - 1].id !== id) seen.push({ id, atMs: elapsed });
      if (elapsed === 59000) at59 = id;
      if (id === 'final') {
        finalAt = elapsed;
        break;
      }
    }
    check(at59 && at59 !== 'final', 'clock: sequence is still playing at 59s', { at59 });
    check(finalAt !== null && finalAt >= 60000, 'clock: guided sequence total >= 60s', { finalAt });
    check(finalAt !== null && finalAt >= TOTAL_MS && finalAt <= TOTAL_MS + 2000, `clock: final page appears right after the configured ${TOTAL_MS}ms`, { finalAt, seen });
    const order = seen
      .map((s) => s.id)
      .filter((x) => x !== 'stage')
      .filter((id, i) => !(i === 0 && id === 'gate')); // gate may linger once during its exit fade
    check(JSON.stringify(order) === JSON.stringify([...SCENES.map((s) => s.id), 'final']), 'clock: scenes advance on their own in config order', { seen });
    // scene boundaries within ±1 step of the configured cumulative durations
    let cum = 0;
    const drift = [];
    for (const s of SCENES.slice(1)) {
      cum += SCENES[SCENES.indexOf(s) - 1].durationMs;
      const hit = seen.find((x) => x.id === s.id);
      if (!hit || Math.abs(hit.atMs - cum) > step) drift.push({ id: s.id, expected: cum, got: hit?.atMs });
    }
    check(drift.length === 0, 'clock: scene boundaries match config durations', { drift });
    // countdown vs faked Date
    await page.clock.runFor(2000);
    await sleep(100);
    const cd = await page.evaluate(() => {
      const el = document.querySelector('[data-countdown]');
      const units = Object.fromEntries(
        [...(el?.querySelectorAll('[data-unit]') || [])].map((u) => [
          u.dataset.unit,
          Number(u.querySelector('[data-num-lang]').textContent.replace(/[০-৯]/g, (d) => d.charCodeAt(0) - 0x09e6)),
        ]),
      );
      return { now: Date.now(), units };
    });
    const target = new Date(`${config.event.isoDate}T${config.event.startTime}:00${config.event.utcOffset}`).getTime();
    const left = Math.floor((target - cd.now) / 1000);
    const exp = { days: Math.floor(left / 86400), hours: Math.floor((left % 86400) / 3600), minutes: Math.floor((left % 3600) / 60) };
    check(
      cd.units.days === exp.days && cd.units.hours === exp.hours && Math.abs(cd.units.minutes - exp.minutes) <= 1,
      'clock: countdown days/hours/minutes to 23 Nov 2027 19:00 IST',
      { shown: cd.units, expected: exp },
    );
  } finally {
    await ctx.close();
  }
}

// 3. Tap/keyboard skip + data-no-skip + progress bar + controls.
async function skipSuite() {
  const { ctx, page } = await newPage(VIEWPORTS[0], { label: 'skip' });
  try {
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.locator('[data-gate-button]').focus();
    await page.keyboard.press('Enter'); // keyboard activation of the gate
    await sleep(1500);
    check((await stageScene(page)) === SCENES[0].id, 'skip: gate opens with the keyboard (Enter) and starts scene 1', { scene: await stageScene(page) });
    const focus = await page.evaluate(() => {
      const a = document.activeElement;
      return { active: a ? `${a.tagName.toLowerCase()}${a.hasAttribute('data-timeline-stage') ? '[data-timeline-stage]' : ''}` : null };
    });
    soft(focus.active === 'div[data-timeline-stage]', 'skip: focus moves to the stage after the gate (keyboard skipping works immediately)', focus);
    if (focus.active !== 'div[data-timeline-stage]') {
      await page.keyboard.press('ArrowRight');
      await sleep(300);
      record((await stageScene(page)) === SCENES[0].id ? 'warn' : 'pass', 'skip: ArrowRight right after opening the gate (no extra Tab)', { scene: await stageScene(page) });
    }
    // timeline pauses while the document is hidden (simulated visibilitychange)
    const hid = await page.evaluate(async () => {
      const pbv = () => Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'));
      const sc = () => document.querySelector('[data-timeline-stage]')?.getAttribute('data-scene-id');
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r, 300));
      const a = { v: pbv(), s: sc() };
      await new Promise((r) => setTimeout(r, 2500));
      const b = { v: pbv(), s: sc() };
      delete document.hidden;
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r, 1500));
      const c = { v: pbv(), s: sc() };
      return { a, b, c };
    });
    check(hid.a.v === hid.b.v && hid.a.s === hid.b.s && hid.c.v > hid.b.v, 'skip: timeline pauses while the tab is hidden and resumes after', hid);
    const pb = await page.evaluate(() => {
      const p = document.querySelector('[role="progressbar"]');
      return p ? { now: Number(p.getAttribute('aria-valuenow')), label: p.getAttribute('aria-label') } : null;
    });
    check(pb && pb.label && pb.now >= 0 && pb.now <= 100, 'skip: progress vine is a labelled progressbar', pb);
    const audioBtn = await page.evaluate(() => {
      const b = document.querySelector('button[aria-pressed][data-no-skip]');
      return b ? { label: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed') } : null;
    });
    check(Boolean(audioBtn && audioBtn.label), 'skip: mute button visible after the gate with aria-label', audioBtn);
    // normalise: be on scene 1 (index 0) or 2 depending on whether ArrowRight skipped above
    const cur0 = await stageScene(page);
    const i0 = SCENES.findIndex((s) => s.id === cur0);
    await page.mouse.click(180, 330);
    await sleep(500);
    const cur1 = await stageScene(page);
    check(cur1 === SCENES[i0 + 1].id, 'skip: tapping the stage skips to the next scene', { from: cur0, to: cur1 });
    const SKIPPED = SCENES.findIndex((s) => s.id === cur1);
    await page.getByRole('radio', { name: /English/ }).click();
    await sleep(500);
    const afterToggle = await page.evaluate(() => ({ lang: document.documentElement.lang, stored: localStorage.getItem('invite.lang') }));
    check((await stageScene(page)) === SCENES[SKIPPED].id, 'skip: language toggle tap does not skip ([data-no-skip])', { scene: await stageScene(page) });
    check(afterToggle.lang === 'en' && afterToggle.stored === 'en', 'skip: language toggle switches + persists', afterToggle);
    await page.locator('button[aria-pressed][data-no-skip]').click();
    await sleep(400);
    const muted = await page.evaluate(() => ({
      pressed: document.querySelector('button[aria-pressed][data-no-skip]').getAttribute('aria-pressed'),
      stored: localStorage.getItem('invite.muted'),
    }));
    check((await stageScene(page)) === SCENES[SKIPPED].id, 'skip: mute button tap does not skip', {});
    check(muted.pressed === 'true' && /true|1/.test(String(muted.stored)), 'skip: mute toggles aria-pressed and persists', muted);
    await page.focus('[data-timeline-stage]');
    await page.keyboard.press('ArrowRight');
    await sleep(400);
    check((await stageScene(page)) === SCENES[SKIPPED + 1].id, 'skip: ArrowRight on the stage skips', { scene: await stageScene(page) });
    // reload keeps language + mute
    await page.reload({ waitUntil: 'load' });
    await page.locator('[data-gate-button]').click();
    await sleep(800);
    const persisted = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      pressed: document.querySelector('button[aria-pressed][data-no-skip]')?.getAttribute('aria-pressed'),
    }));
    check(persisted.lang === 'en' && persisted.pressed === 'true', 'skip: language + mute persist across reload', persisted);
    await page.focus('[data-timeline-stage]');
    await page.keyboard.press('Escape');
    await sleep(800);
    check((await stageScene(page)) === 'final', 'skip: Escape finishes to the final page', { scene: await stageScene(page) });
  } finally {
    await ctx.close();
  }
}

// 4. Reduced motion: heart static, no infinite loops.
async function reducedSuite() {
  const { ctx, page } = await newPage(VIEWPORTS[0], { reducedMotion: 'reduce', label: 'reduced-motion' });
  try {
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await sleep(1200);
    const gateLoops = await page.evaluate(infiniteAnimations);
    soft(gateLoops.length === 0, 'reduced: no infinite animations on the gate', { gateLoops });
    await page.locator('[data-gate-button]').click();
    await sleep(800);
    check(await skipTo(page, 'date'), 'reduced: reached date scene', {});
    await sleep(4500);
    const h1 = await page.evaluate(heartProbe, '[data-scene-layer="active"] [data-marked-date]');
    await sleep(700);
    const h2 = await page.evaluate(heartProbe, '[data-scene-layer="active"] [data-marked-date]');
    check(
      h1.hasHeart && h1.state === 'static' && h1.animationName === 'none' && h1.pathAnimations.every((n) => n === 'none') && h1.transform === h2.transform && h1.opacity === h2.opacity,
      'reduced: date-scene heart is static (no blink/scale/draw)',
      { h1, h2: { transform: h2.transform, opacity: h2.opacity } },
    );
    const loops = await page.evaluate(infiniteAnimations);
    soft(loops.length === 0, 'reduced: no infinite animations during the sequence', { loops });
    await page.screenshot({ path: join(SHOTS, `reduced-360-date.png`) });
    await toFinal(page);
    await page.locator('[data-month-calendar]').scrollIntoViewIfNeeded();
    await sleep(4000);
    const hf = await page.evaluate(heartProbe);
    check(hf.hasHeart && hf.state === 'static' && hf.animationName === 'none', 'reduced: final-page heart is static', hf);
    const floops = await page.evaluate(infiniteAnimations);
    soft(floops.length === 0, 'reduced: no infinite animations on the final page', { floops });
  } finally {
    await ctx.close();
  }
}

// 5. Language modes: calendar aria-label, digits, heart presence, header.
async function langSuite() {
  const grid = await import('../../src/components/MonthCalendarGrid.js').then((m) => m.buildMonthGrid(config.event.isoDate, 0));
  const fmtBn = (n) => String(n).replace(/\d/g, (d) => config.digits.bn[d]);
  const label = (side) =>
    config.calendar.markedLabel[side]
      .replace('{day}', side === 'bn' ? fmtBn(grid.markedDay) : String(grid.markedDay))
      .replace('{month}', config.calendar.monthNames[side][grid.monthIndex])
      .replace('{year}', side === 'bn' ? fmtBn(grid.year) : String(grid.year))
      .replace('{weekday}', config.calendar.weekdayLong[side][grid.markedWeekday]);
  const expected = { en: label('en'), bn: label('bn'), both: `${label('bn')} / ${label('en')}` };
  check(expected.en === '23 November 2027, Tuesday, reception', 'lang: expected English aria-label', expected);

  for (const lang of ['en', 'bn', 'both']) {
    const { ctx, page } = await newPage(VIEWPORTS[0], { lang, label: `lang ${lang}` });
    try {
      await openGate(page);
      await sleep(600);
      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      check(htmlLang === (lang === 'en' ? 'en' : 'bn'), `lang ${lang}: <html lang> = ${lang === 'en' ? 'en' : 'bn'}`, { htmlLang });
      check(await skipTo(page, 'date'), `lang ${lang}: reached date scene`, {});
      await sleep(7500); // compact layout at ~3.4s, then calendar rows + heart draw
      const hd = await page.evaluate(heartProbe, '[data-scene-layer="active"] [data-marked-date]');
      check(hd.hasHeart, `lang ${lang}: date-scene calendar heart present`, hd);
      check(hd.ariaLabel === expected[lang], `lang ${lang}: date-scene marked cell aria-label`, { got: hd.ariaLabel, want: expected[lang] });
      const dp = await page.evaluate(layoutProbe, { rootSel: '[data-scene-layer="active"]', fitViewport: true });
      check(dp.outOfView.length === 0 && dp.clipped.length === 0 && dp.scrollWidth <= dp.vw, `lang ${lang}: date scene fits 360x640`, summarizeLayout(dp));
      await page.screenshot({ path: join(SHOTS, `lang-${lang}-360-date.png`) });
      await toFinal(page);
      await page.locator('[data-month-calendar]').scrollIntoViewIfNeeded();
      await sleep(3500);
      const h = await page.evaluate(heartProbe);
      check(h.hasHeart, `lang ${lang}: final calendar heart present`, h);
      check(h.ariaLabel === expected[lang], `lang ${lang}: final marked cell aria-label`, { got: h.ariaLabel, want: expected[lang] });
      const nums = h.numbers.map((n) => n.text);
      const digitsOk =
        lang === 'en' ? nums.includes('23') && !nums.some((t) => BN_DIGIT.test(t)) : lang === 'bn' ? nums.includes('২৩') && !nums.includes('23') : nums.includes('২৩') && nums.includes('23');
      check(digitsOk, `lang ${lang}: marked date digits per mode`, { numbers: h.numbers });
      const cal = await page.evaluate(() => {
        const c = document.querySelector('[data-month-calendar]');
        const other = [...c.querySelectorAll('[data-day]:not([data-marked-date])')].map((e) => e.textContent.trim());
        return { title: c.querySelector('h3')?.textContent.replace(/\s+/g, ' ').trim(), other: other.slice(0, 3), latinSecondary: c.querySelectorAll('[data-day]:not([data-marked-date]) [lang="en"]').length };
      });
      const titleOk = lang === 'en' ? cal.title === 'November 2027' : lang === 'bn' ? cal.title === 'নভেম্বর ২০২৭' : /নভেম্বর ২০২৭\s*\/\s*November 2027/.test(cal.title);
      check(titleOk, `lang ${lang}: calendar header`, cal);
      const otherOk = lang === 'en' ? cal.other.every((t) => /^\d+$/.test(t)) : cal.other.every((t) => /^[০-৯]+$/.test(t));
      check(otherOk && (lang !== 'both' || cal.latinSecondary === 0), `lang ${lang}: other dates use ${lang === 'en' ? 'Latin' : 'Bengali'} digits only`, cal);
      const fp = await page.evaluate(layoutProbe, { rootSel: '[data-scene="final"]', fitViewport: false });
      check(fp.scrollWidth <= fp.vw && fp.clipped.length === 0, `lang ${lang}: final page no overflow/clipping at 360`, summarizeLayout(fp));
      await page.screenshot({ path: join(SHOTS, `lang-${lang}-360-final-full.png`), fullPage: true });
    } finally {
      await ctx.close();
    }
  }
}

// 6. Fallbacks: missing audio (404), photo success path, a11y basics.
async function fallbackSuite() {
  // missing audio
  {
    const { ctx, page } = await newPage(VIEWPORTS[0], { label: 'audio-404', allow: [/Failed to load resource.*404/i] });
    const audioReqs = [];
    try {
      await page.route('**/audio/bg.mp3', (route) => {
        audioReqs.push(route.request().url());
        route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
      });
      const before = consoleIssues.length;
      const errs = [];
      page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      await openGate(page);
      await sleep(2500);
      const st = await page.evaluate(() => ({
        failed: document.querySelector('[data-audio-failed]') !== null,
        btn: Boolean(document.querySelector('button[aria-pressed][data-no-skip]')),
        scene: document.querySelector('[data-timeline-stage]')?.getAttribute('data-scene-id'),
      }));
      check(audioReqs.length > 0, 'audio 404: the app requested /audio/bg.mp3', { audioReqs });
      check(consoleIssues.length === before, 'audio 404: no app console errors / page errors', { issues: consoleIssues.slice(before) });
      record('pass', 'audio 404: browser-level console messages (informational)', { errs });
      check(st.btn && st.scene === SCENES[0].id, 'audio 404: sequence still runs, mute button still rendered', st);
      soft(st.failed, 'audio 404: AudioControl marks failure (data-audio-failed)', st);
    } finally {
      await ctx.close();
    }
  }
  // photo success path
  {
    const { ctx, page } = await newPage(VIEWPORTS[2], { label: 'photo-ok' });
    try {
      const jpegB64 = await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 300;
        c.height = 400;
        const g = c.getContext('2d');
        const grd = g.createLinearGradient(0, 0, 300, 400);
        grd.addColorStop(0, '#7A1F2B');
        grd.addColorStop(1, '#F2A900');
        g.fillStyle = grd;
        g.fillRect(0, 0, 300, 400);
        return c.toDataURL('image/jpeg', 0.8).split(',')[1];
      });
      const jpg = Buffer.from(jpegB64, 'base64');
      await page.route('**/images/*.jpg', (route) => route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpg }));
      await openGate(page);
      await sleep(500);
      check(await skipTo(page, 'family'), 'photo ok: reached family scene', {});
      await sleep(4500);
      const st = await page.evaluate(() =>
        [...document.querySelectorAll('[data-scene-layer="active"] [data-portrait]')].map((p) => {
          const img = p.querySelector('img');
          return {
            kind: p.dataset.portrait,
            state: p.dataset.photoState,
            natural: img?.naturalWidth || 0,
            opacity: img ? Number(getComputedStyle(img).opacity) : 0,
            w: img ? Math.round(img.getBoundingClientRect().width) : 0,
            alt: img?.getAttribute('alt'),
            loading: img?.getAttribute('loading'),
            silhouette: Boolean(p.querySelector('svg')),
          };
        }),
      );
      check(
        st.length === 2 && st.every((s) => s.state === 'ok' && s.natural > 0 && s.opacity > 0.9 && s.w > 40 && s.alt && !s.silhouette),
        'photo ok: config photos load and replace the silhouette',
        { st },
      );
      check(st.every((s) => s.loading === 'lazy'), 'photo ok: <img loading="lazy">', { st });
      await page.screenshot({ path: join(SHOTS, `photo-ok-1440-family.png`) });
    } finally {
      await ctx.close();
    }
  }
  // a11y basics + broken images, gate / mid-scene / final, at 360
  {
    const { ctx, page } = await newPage(VIEWPORTS[0], { label: 'a11y' });
    try {
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await sleep(1500);
      const ag = await page.evaluate(a11yProbe);
      await page.locator('[data-gate-button]').click();
      await skipTo(page, 'family');
      await sleep(3500);
      const as = await page.evaluate(a11yProbe);
      await toFinal(page);
      await sleep(4500);
      const af = await page.evaluate(a11yProbe);
      for (const [where, a] of [['gate', ag], ['family scene', as], ['final', af]]) {
        check(a.unnamedControls.length === 0, `a11y ${where}: every control has an accessible name`, { unnamed: a.unnamedControls });
        check(a.imgNoAlt.length === 0, `a11y ${where}: every <img> has alt`, { imgNoAlt: a.imgNoAlt });
        check(a.brokenImgs.length === 0, `a11y ${where}: no broken images shown`, { broken: a.brokenImgs });
        check(a.unhiddenFixedDecor.length === 0, `a11y ${where}: fixed decorative layers are aria-hidden`, { list: a.unhiddenFixedDecor });
        soft(a.unhiddenSvgs.length === 0, `a11y ${where}: non-decorative SVGs are labelled (others aria-hidden)`, { list: a.unhiddenSvgs.slice(0, 10) });
        soft(a.mains <= 1 && !a.nestedMain, `a11y ${where}: single, non-nested <main> landmark`, { mains: a.mains, nested: a.nestedMain });
      }
    } finally {
      await ctx.close();
    }
  }
}

/* ------------------------------------------------------------------ main */
const started = Date.now();
let server;
let exitCode = 0;
try {
  server = await buildAndServe({ label: 'e2e' });
  BASE = server.baseUrl;
  if (server.build) {
    soft(server.build.warnings.length === 0, 'build: vite build has no warnings', { warnings: server.build.warnings });
  }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });

  if (want('walk')) {
    console.log('\n=== walk (3 viewports in parallel, real time ~80s)');
    const t = Date.now();
    const clockP = want('clock') ? suite('clock', clockSuite) : Promise.resolve();
    const settled = await Promise.allSettled(VIEWPORTS.map((vp) => walkViewport(vp)));
    await clockP;
    settled.forEach((s, i) => {
      if (s.status === 'rejected') record('fail', `[${VIEWPORTS[i].name}] walk crashed`, { error: String(s.reason?.stack || s.reason).slice(0, 800) });
    });
    const layouts = Object.fromEntries(settled.map((s, i) => [VIEWPORTS[i].name, s.value || null]));
    writeFileSync(join(OUT, 'e2e-layouts.json'), JSON.stringify(layouts, null, 2));
    console.log(`--- walk done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }
  if (!want('walk')) await suite('clock', clockSuite);
  await suite('skip', skipSuite);
  await suite('reduced', reducedSuite);
  await suite('lang', langSuite);
  await suite('fallback', fallbackSuite);

  check(consoleIssues.length === 0, 'console: no app errors/warnings across all runs', { issues: consoleIssues.slice(0, 15) });
} catch (e) {
  record('fail', 'e2e harness crashed', { error: String(e && e.stack ? e.stack : e).slice(0, 1200) });
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.stop();
}

const fails = results.filter((r) => r.status === 'fail');
const warns = results.filter((r) => r.status === 'warn');
writeFileSync(join(OUT, 'e2e-results.json'), JSON.stringify({ results, consoleIssues }, null, 2));
console.log(
  `\nE2E: ${results.length - fails.length - warns.length} passed, ${warns.length} warnings, ${fails.length} failed ` +
    `in ${((Date.now() - started) / 1000).toFixed(0)}s. Results: ${join(OUT, 'e2e-results.json')}, screenshots: ${SHOTS}`,
);
if (fails.length) {
  console.log('\nFailures:');
  for (const f of fails) console.log(` - ${f.name}`);
  exitCode = 1;
}
process.exit(exitCode);
