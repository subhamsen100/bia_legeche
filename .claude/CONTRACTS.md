# Shared contracts (orchestrator-owned)

Every agent codes against these interfaces. If you need to change one, STOP and report to the
orchestrator instead of improvising. Paths are relative to the project root
`/home/subham/Documents/bia_legeche`.

## 0. Ground rules for every agent

- Edit ONLY files you own (see your `.claude/agents/<name>.md`). Need a change elsewhere? Put it in your
  final report under "Requests for orchestrator" with the exact diff you want.
- Do NOT run `npm install` / add dependencies (only scaffold-architect does, in Phase 1). If you need a
  package, report it.
- Do NOT run `npm run build` into `dist/` in Phase 2/3 (parallel agents would clobber each other). To
  check your code compiles for production: `npx vite build --outDir "$SCRATCH/dist-<your-name>" --emptyOutDir`
  where `$SCRATCH=/tmp/claude-1000/-home-subham-Documents-bia-legeche/3baca1a4-4f70-4e4d-82fc-94cc2d6ff24e/scratchpad`.
- Dev server: use your assigned port with `npx vite --port <port> --strictPort` in the background, and
  kill it when you are done. Ports: floral 5201, content-i18n 5202, timeline 5203, audio 5204,
  qr 5205, scene-builder 5206, qa 5207. Orchestrator uses 5173.
- Visual verification: `playwright-core` is installed; launch Chrome with
  `chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true })`. Put throwaway
  screenshot scripts and PNGs in `$SCRATCH/<your-name>/` (not in the repo), then Read the PNGs to look at them.
- Every component honours `prefers-reduced-motion` (use framer-motion's `useReducedMotion()`): reduced
  motion means simple opacity fades only, no loops, no blink, no scale, no sway.
- No user-visible copy hardcoded in components: all text comes from `src/config.js`. (Purely decorative
  SVG has no text.) `aria-label`s also come from config.
- Bengali text: `line-height >= 1.7`, no `letter-spacing`, no `text-transform`. Wrap Bengali in
  `lang="bn"`, English in `lang="en"`.
- Banned spelling: the locality must be written কেয়াতলা. The banned variant is the string with code
  points `U+0995 U+09C7 U+0993 U+09DC U+09BE U+09A4 U+09B2 U+09BE` (also its decomposed form with
  `U+09A1 U+09BC` instead of `U+09DC`). Never type it anywhere, including comments and docs.
- Plain JS + JSX (no TypeScript). React 18 function components, named exports AND a default export for
  components. CSS Modules (`X.module.css`) for component styles, CSS variables from
  `src/styles/tokens.css` for colours/fonts/spacing. No Tailwind, no UI kits.
- Mobile-first. Must fit 360px wide with no horizontal overflow, and look composed at 1440px.

## 1. Dependencies (installed by scaffold-architect)

runtime: `react@18`, `react-dom@18`, `framer-motion`, `qrcode`
dev: `vite`, `@vitejs/plugin-react`, `jsqr`, `@resvg/resvg-js`, `playwright-core`, `lighthouse`

package.json scripts: `dev`, `build`, `preview`, `verify:qr` (`node scripts/verify-qr.mjs`),
`test` (`node --test "tests/*.test.mjs"`, Node 21+), `test:e2e` (`node tests/e2e/run.mjs`), `lighthouse` (`node scripts/lighthouse.mjs`).
`"type": "module"`.

## 2. Dev routes (App.jsx, orchestrator)

`App.jsx` renders a dev page instead of the invitation when the pathname starts with `/dev/`:
`/dev/<name>` lazy-loads `src/dev/<name>.jsx` (default export) via `import.meta.glob('./dev/*.jsx')`.
Each agent owns its own dev page:

| route              | file                    | owner              |
|--------------------|-------------------------|--------------------|
| `/dev/gallery`     | `src/dev/gallery.jsx`   | floral-svg-artist  |
| `/dev/i18n`        | `src/dev/i18n.jsx`      | content-i18n       |
| `/dev/timeline`    | `src/dev/timeline.jsx`  | timeline-engine    |
| `/dev/audio`       | `src/dev/audio.jsx`     | audio-agent        |
| `/dev/qr`          | `src/dev/qr.jsx`        | qr-maps-agent      |
| `/dev/scenes`      | `src/dev/scenes.jsx`    | scene-builder      |

Dev pages are excluded from the production entry chunk by the lazy glob; keep them self-contained.
(The brief calls the floral one "/dev-gallery"; App.jsx aliases `/dev-gallery` to `/dev/gallery`.)

## 3. `src/config.js` schema

Default export `config` (also `export { config }`). Text is always a bilingual pair `{ bn, en }`
(strings) unless noted. scaffold-architect creates every key with non-text values filled and text values
as empty strings; content-i18n fills every text value (Phase 2) and owns them afterwards.

```js
const config = {
  meta: { title: '', description: { bn, en } },            // OG/meta copy (index.html mirrors these)
  event: {
    isoDate: '2027-11-23',        // single source for calendar + countdown + weekday
    startTime: '19:00',           // 24h, in event.timeZone
    timeZone: 'Asia/Kolkata',
    utcOffset: '+05:30',
    name: { bn, en },             // en: 'Wedding Reception'
    timeLabel: { bn, en },        // en: '7:00 PM onwards' (placeholder, editable)
  },
  couple: {
    names: { bn: 'শুভম ও শ্রীরূপা', en: 'Subham & Sreerupa' },
    groom: {
      firstName: { bn: 'শুভম', en: 'Subham' },
      fullName: { bn, en },        // placeholder e.g. 'Subham [Surname]' / 'শুভম [পদবি]'
      photo: '/images/groom.jpg',  // may 404 -> silhouette fallback
      photoAlt: { bn, en },
      relation: { bn: 'পুত্র', en: 'Son' },
      father: { bn: '[বরের বাবা]', en: "[Groom's Father]" },
      mother: { bn: '[বরের মা]', en: "[Groom's Mother]" },
    },
    bride: { /* same keys; relation { bn: 'কন্যা', en: 'Daughter' }, '[কনের বাবা]' / "[Bride's Father]" ... */ },
    // template tokens: {relation} {father} {mother}
    familyLine: { bn: '{father} ও {mother}-এর {relation}', en: '{relation} of {father} & {mother}' },
  },
  venue: {
    name: { bn: 'ঘোষবাড়ি', en: 'Ghoshbari' },
    locality: { bn: 'কেয়াতলার কাছে', en: 'near Keyatala' },
    address: { bn: '১১, কেয়াতলা লেন, ...', en: '11, Keyatala Ln, ...' },
    mapsUrl: 'https://maps.app.goo.gl/DAW7kmpgxBA3xEicA',
  },
  copy: {
    gatePrompt: { bn: 'খুলুন', en: 'Tap to open' },
    message: { bn: [line1, line2, line3], en: [line1, line2, line3] },   // arrays of lines
    dateTagline, venueTagline, closing, signed,                          // each { bn, en }
    scanCaption: { bn: 'স্ক্যান করুন', en: 'Scan for directions' },
    openInMaps, replay, shareWhatsApp, skipHint,                         // each { bn, en }
    countdown: { days, hours, minutes, seconds, done },                  // each { bn, en }
    sectionHeadings: { couple, date, venue },                            // final page headings, { bn, en }
  },
  ui: {                                // aria-labels and control labels
    mute, unmute, languageToggle,      // { bn, en }
    languageModes: { bn: 'বাংলা', en: 'English', both: 'Both' },   // plain strings
    progress,                          // { bn, en } aria-label for the progress vine
  },
  calendar: {
    weekStartsOn: 0,                                   // 0 = Sunday
    monthNames: { bn: [12 strings], en: [12 strings] },
    weekdayShort: { bn: ['রবি','সোম','মঙ্গল','বুধ','বৃহ','শুক্র','শনি'], en: ['Sun',...,'Sat'] },
    weekdayInitial: { en: ['S','M','T','W','T','F','S'] },
    weekdayLong: { bn: ['রবিবার',...], en: ['Sunday',...] },
    // tokens: {day} {month} {year} {weekday}
    markedLabel: { bn: '{day} {month} {year}, {weekday}, ...', en: '{day} {month} {year}, {weekday}, reception' },
  },
  digits: { bn: ['০','১','২','৩','৪','৫','৬','৭','৮','৯'] },
  timeline: {
    // timed guided scenes, in order. Gate precedes them (untimed); the free-scroll final page follows.
    scenes: [
      { id: 'opening', durationMs: 10000 },
      { id: 'names',   durationMs: 10000 },
      { id: 'family',  durationMs: 12000 },
      { id: 'message', durationMs: 12000 },
      { id: 'date',    durationMs: 14000 },
      { id: 'venue',   durationMs: 12000 },
      { id: 'closing', durationMs: 6000 },
    ],                                   // sum = 76000ms; must stay >= 60000
    crossfadeMs: 900,
  },
  audio: { src: '/audio/bg.mp3', volume: 0.5, fadeInMs: 3000, fadeOutMs: 1200, loop: true },
  share: {
    // tokens: {names} {date} {time} {venue} {address} {mapsUrl} {url}
    whatsappText: { bn, en },            // combined bilingual message is built by joining bn + '\n\n' + en
  },
};
```

Derived values (weekday, month name, countdown target) are COMPUTED, never stored as text.
Countdown target = `new Date(`${event.isoDate}T${event.startTime}:00${event.utcOffset}`)`.

## 4. content-i18n exports

- `src/hooks/useLanguage.jsx`
  - `LanguageProvider({ children })` — state `lang: 'bn' | 'en' | 'both'`, default `'both'`, persisted
    in localStorage key `invite.lang` (wrap in try/catch). Sets `document.documentElement.lang`
    (`bn` for bn/both, `en` for en) and `data-lang` attribute on `<html>`.
  - `useLanguage()` → `{ lang, setLang, pick, format, num }`
    - `pick(pair)` → string: `pair.bn` in bn mode, `pair.en` in en mode, `` `${pair.bn} / ${pair.en}` ``
      in both mode (for aria-labels / title attributes). Arrays pass through the same way per mode
      (both → bn array). Use for any non-visual string.
    - `format(template, vars)` → replaces `{token}` in a string.
    - `num(n)` → string of n in Bengali digits for bn/both, Latin for en.
- `src/utils/bengaliDigits.js` — `toBengaliDigits(numberOrString)`, `toLatinDigits(str)`,
  `formatNumber(n, lang)`, `pad2(n, lang)`. Pure, no React; reads digit map from config.
- `src/components/BilingualText.jsx` — `BilingualText({ text, as = 'p', className, vars, lines = false,
  variant })`
  - `text` is a `{ bn, en }` pair; `vars` optional template vars (each var may itself be a pair; resolve
    per language).
  - Renders per mode: bn mode → only Bengali; en → only English; both → Bengali primary, English
    smaller below (`<span lang="bn" class=bn>` then `<span lang="en" class=en>` inside the `as` element).
  - `variant`: `'display' | 'body' | 'caption' | 'names'` controls font families: names → Bengali
    Noto Serif Bengali + English Great Vibes; display → Noto Serif Bengali + Cormorant Garamond; body →
    Hind Siliguri + Cormorant Garamond.
  - Exposes classes via `BilingualText.module.css`; consumer may pass `bnClassName` / `enClassName`.
- `src/components/LanguageToggle.jsx` — segmented control "বাংলা | English | Both", `role="radiogroup"`,
  keyboard accessible. Positioned by the consumer (accepts `className`); default styling is a small
  pill. Must have `data-no-skip` so taps don't skip scenes.

## 5. floral-svg-artist exports (all decorative → `aria-hidden="true"`, `pointer-events: none` unless noted)

`src/components/`:
- `FloralCorner({ position: 'tl'|'tr'|'bl'|'br', size })` — swaying garland (marigold, rajanigandha,
  shiuli, lotus), parallax via `useParallax`.
- `Petals({ count = 24 })` — fixed full-viewport layer of drifting petals (shiuli, rajanigandha,
  marigold), randomized sway/rotation, CSS/transform-only for perf. Reduced motion: a few static petals
  or none.
- `Fireflies({ count = 10 })` — ambient glowing dots layer.
- `Butterfly()` — one or two butterflies that every ~8-12s fly to a random visible element with
  `[data-perch]` and land on its top edge for a few seconds, then fly off. Fixed layer. Off under reduced motion.
- `Lanterns({ count = 6 })` — sky lanterns floating upward, for the venue scene (absolute-fill of parent).
- `LanternHouse({ play = true })` — tiny lantern-lit house + hand-drawn path with bouncing map marker.
- `LotusBud({ open = false, onOpened })` — ornate closed lotus bud / envelope that blooms when `open`
  becomes true; calls `onOpened` after the bloom. Used on the gate (closed) and opening scene (opens).
- `KolkaHeart({ draw = true, bounce = false, delay = 0, size = 64 })` — kolka/heart drawn via stroke
  dash animation; `bounce` starts a gentle bounce loop.
- `ShankhRipple({ play = true })` — conch shell with concentric "ulu-dhwani" ripple rings.
- `AlponaBorder({ className, variant = 'strip' | 'ring' })` — alpona strip (horizontal, full width of
  parent, ~16-24px tall).
- `KolkaMotif({ size, className })` — static paisley ornament.
- `ArchFrame({ bloom = true, children, className })` — arch/lotus portrait frame; children (portrait)
  fill the arch window (`overflow: hidden` with arch clip). Bloom-open animation, children fade in after.
- `PortraitSilhouette({ kind: 'groom' | 'bride' })` — illustrated placeholder silhouette that fills the
  frame window.
- `FloralVine({ orientation: 'horizontal' | 'vertical', draw = true })` — small vine joining portraits.
- `LalPaarFrame({ children, className })` — red-bordered (lal-paar saree) card frame with gold hairline,
  ivory inside, rounded; NOT aria-hidden (it wraps content), only its decoration is.
- `HeartMarker({ size = 56, draw = true, blink = true, delay = 0, drawDuration = 1.2, className })` —
  heart outline SVG: outer stroke marigold #F2A900, inner maroon #7A1F2B, 2.5px. Draws via
  stroke-dasharray over `drawDuration`s, then blinks: opacity 1↔0.25 + scale 1↔1.12, 1.4s cycle,
  infinite, ease-in-out. Reduced motion → static outline with subtle fixed glow, no blink, no scale.
  Must expose `data-heart-marker`, and `data-blink-period-ms="1400"` on the root for QA. Centered
  absolutely over its parent (`position:absolute; inset` with negative offsets so it is larger than the
  cell), `overflow: visible`.
- `PetalBurst({ burstKey, count = 10 })` — absolutely centered in its (position:relative) parent; each
  time `burstKey` changes, emits a short burst of petals/sparkles. Nothing under reduced motion except
  a brief glow.
- `TerracottaNoise()` — fixed full-viewport subtle terracotta SVG noise texture overlay (low opacity,
  `feTurbulence` in a data-URI background is fine).

`src/hooks/useParallax.js` — `useParallax(strength)` → framer-motion `MotionValue`s `{ x, y }` driven by
scroll + `deviceorientation` (where supported, no permission prompt on iOS), zero under reduced motion.

## 6. timeline-engine exports

- `src/hooks/useTimeline.js` — `useTimeline(scenes = config.timeline.scenes)` →
  ```
  {
    phase: 'gate' | 'playing' | 'final',
    index, scene,                 // current timed scene (when playing)
    sceneElapsedMs, totalElapsedMs, totalMs, progress,   // progress 0..1 across the timed scenes
    start(),     // gate -> playing, index 0
    skip(),      // next scene; after last -> final
    replay(),    // -> playing, index 0 (does not return to the gate)
    finish(),    // -> final immediately
  }
  ```
  rAF/interval clock that PAUSES while `document.hidden` and resumes after. While `phase !== 'final'`,
  locks page scroll (`overflow: hidden` on html/body); in `final`, restores it and scrolls to top.
- `src/components/TimelineStage.jsx` — `TimelineStage({ timeline, renderScene, className })`: full
  viewport (100dvh) stage, crossfades scenes using `AnimatePresence mode="sync"` keyed by scene id +
  replay counter, `crossfadeMs` from config. `renderScene(scene, { sceneElapsedMs, durationMs })`
  returns the scene element. Click/tap anywhere (or Space/→/Enter on the stage) calls `skip()`, EXCEPT
  when the event target is inside an element with `[data-no-skip]`, or a button/a/input. Reduced motion
  → plain opacity fade.
- `src/components/TimelineProgress.jsx` — `TimelineProgress({ timeline })`: thin growing vine (SVG
  stem + little leaves appearing as it grows) along the bottom of the viewport, `role="progressbar"`
  with `aria-valuenow` (0-100) and an aria-label from `config.ui.progress`, `data-no-skip`.
  Hidden when phase is not `playing`.
- (Optional) `src/components/TimelineSkipHint.jsx` showing `config.copy.skipHint` briefly.

## 7. audio-agent exports

- `src/hooks/useAudio.js` — `useAudio(audioConfig = config.audio)` →
  `{ play(), toggleMute(), muted, ready, failed, fadeOut(ms) }`.
  - `play()` MUST be called synchronously inside the gate tap handler; it calls `audio.play()` at volume
    0 then fades to `audioConfig.volume` over `fadeInMs` (rAF-driven). Swallows rejection/404 silently
    (sets `failed`, never throws, never logs errors to the console beyond `console.debug`).
  - Mute state persisted in localStorage `invite.muted` (try/catch). Mute fades out quickly; unmute
    fades in.
  - Pauses when `document.hidden`, resumes (with fade) when visible if it was playing and not muted.
  - Creates the `<audio>` element lazily (preload="none" until play) so it costs nothing before the gate.
- `src/components/AudioControl.jsx` — `AudioControl({ audio, className })` fixed round button, top-right
  corner (safe-area aware), icon speaker/muted SVG, `aria-label` from `config.ui.mute/unmute` via
  `useLanguage().pick`, `aria-pressed`, `data-no-skip`. Rendered only after the gate is opened (App
  decides). If `audio.failed`, still render (harmless) but may dim.

## 8. qr-maps-agent exports

- `src/components/MapQRMatrix.js` — pure (no React, no CSS): `buildQrSvg(text, { size, moduleColor =
  '#7A1F2B', background = '#FFF8EC', quietZone = 4, rounded = true })` → SVG markup string, and
  `getQrMatrix(text)` using `qrcode`'s `QRCode.create(text, { errorCorrectionLevel: 'H' })`.
- `src/components/MapQR.jsx` — `MapQR({ url = config.venue.mapsUrl, caption, className })`: gold
  hairline card with corner ornaments (outside the quiet zone), inline SVG QR (via
  `dangerouslySetInnerHTML` of `buildQrSvg` or React elements from the matrix), min 160px on mobile,
  220px on desktop (≥ 768px). `caption` is a ReactNode supplied by the consumer (scene-builder passes
  `<BilingualText text={config.copy.scanCaption} />`). `role="img"` + aria-label passed in as prop
  `label` (string).
- `src/components/MapsButton.jsx` — `MapsButton({ url = config.venue.mapsUrl, children, className })`:
  an `<a target="_blank" rel="noopener">` styled as a maroon pill button with a pin icon, `data-no-skip`.
  `children` = label node supplied by the consumer.
- `scripts/verify-qr.mjs` — imports `buildQrSvg` + config, rasterizes the SVG (`@resvg/resvg-js`) at
  the mobile (160px) and desktop (220px) sizes, decodes RGBA with `jsqr`, asserts decoded ===
  `config.venue.mapsUrl`, exits 1 on any mismatch. Also asserts EC level H and the 4-module quiet zone.

## 9. scene-builder exports

- `src/components/SceneGate.jsx` — `SceneGate({ onOpen })`, cream full screen, closed `LotusBud`,
  `copy.gatePrompt`, whole surface is a button (`aria-label` from config).
- Timed scenes, each `Scene<Name>({ sceneElapsedMs, durationMs })`, root fills the stage and fits
  100dvh at 360×640 with no scroll: `SceneOpening`, `SceneNames`, `SceneFamily`, `SceneMessage`,
  `SceneDate`, `SceneVenue`, `SceneClosing`.
- `src/components/SceneRegistry.js` — `export const sceneComponents = { opening: SceneOpening, names:
  SceneNames, family: SceneFamily, message: SceneMessage, date: SceneDate, venue: SceneVenue, closing:
  SceneClosing }`.
- `src/components/SceneFinal.jsx` — `SceneFinal({ onReplay })`: free-scroll page with everything (couple,
  parents, date, calendar with blinking heart, countdown, venue, QR + maps button, closing), Replay and
  WhatsApp share buttons.
- `src/components/MonthCalendarGrid.js` — PURE module (no JSX, no CSS imports) exporting
  `buildMonthGrid(isoDate, weekStartsOn = 0)` →
  `{ year, monthIndex, daysInMonth, firstWeekday, leadingBlanks, rows: Array<Array<{ day: number|null,
  weekday: 0-6, isMarked: boolean }>> }`, computed with `Date`/`Intl` in Asia/Kolkata. QA imports it with
  plain Node.
- `src/components/MonthCalendar.jsx` — `MonthCalendar({ animate = true })`; marked cell has
  `data-marked-date`, `aria-label` built from `calendar.markedLabel` in the active language, uses
  `HeartMarker` (aria-hidden) and `PetalBurst` on tap/hover. Grid has `role="grid"` or a table.
- `src/components/Countdown.jsx` + `src/hooks/useCountdown.js` — days/hours/minutes (seconds optional),
  digits per language mode, `aria-live="off"` (avoid chatty SR), done-state copy.
- `src/components/WhatsAppShare.jsx` — `https://wa.me/?text=` + encoded bilingual text.
- `src/components/PortraitCard*` / `FamilyCard*` as needed (scene-builder owned): photo `<img loading="lazy"
  decoding="async" width/height>` with `onError` → `PortraitSilhouette`.
- Mark key headings with `data-perch` so butterflies land on them.

## 10. App composition (orchestrator, src/App.jsx) — for reference

```
<MotionConfig reducedMotion="user">
 <LanguageProvider>
  <TerracottaNoise/>  <FloralCorner tl/tr/bl/br/>
  {phase !== 'gate' && <Petals/> <Fireflies/> <Butterfly/>}
  <LanguageToggle/> (top-left)    {phase !== 'gate' && <AudioControl audio/>} (top-right)
  gate    → <SceneGate onOpen={() => { audio.play(); tl.start(); }}/>
  playing → <TimelineStage timeline={tl} renderScene={...sceneComponents[id]}/> <TimelineProgress/>
  final   → <SceneFinal onReplay={tl.replay}/>
 </LanguageProvider>
</MotionConfig>
```
