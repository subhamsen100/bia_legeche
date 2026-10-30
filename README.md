# Subham & Sreerupa: reception invitation

A one-page, bilingual (Bengali / English) animated wedding-reception invitation. Guests tap
"খুলুন / Tap to open", watch a guided sequence of about 76 seconds (opening, names, families, message,
date, venue, closing) with optional background music, and land on a scrollable final page with the
calendar, a live countdown, the venue address, a Google Maps button, a QR code for directions and a
WhatsApp share button.

It is a static site (Vite + React). All event details and all visible text live in one file:
**`src/config.js`**.

Event as currently configured: Tuesday 23 November 2027, 7:00 PM onwards, Ghoshbari, near
কেয়াতলা / Keyatala, Kolkata.

## Quick start

Requires Node.js 22 (developed on 22.11; `npm test` uses a test-file glob that needs Node 21 or newer).

```bash
npm install          # once
npm run dev          # local preview with live reload: http://localhost:5173
npm test             # fast checks (config, calendar, heart marker, spelling); a few seconds
npm run verify:qr    # checks the QR code decodes to config.venue.mapsUrl
npm run build        # production build into dist/
npm run preview      # serve dist/ locally: http://localhost:4173
```

`npm run dev` also listens on your local network (`server.host: true` in `vite.config.js`), so you can
open the "Network" URL it prints on a phone on the same Wi-Fi.

Upload the contents of `dist/` to any static host (see [Deploying](#deploying)).

## Before you share: replace the placeholders

Everything in **[square brackets]** is a placeholder and is shown to guests as-is until you replace it.

### In `src/config.js`

| Key path | Current value (bn / en) | Replace with |
|---|---|---|
| `couple.groom.fullName` | `শুভম [পদবি]` / `Subham [Surname]` | Groom's full name |
| `couple.groom.father` | `[বরের বাবা]` / `[Groom's Father]` | Groom's father's name |
| `couple.groom.mother` | `[বরের মা]` / `[Groom's Mother]` | Groom's mother's name |
| `couple.groom.photoAlt` | `[বর শুভমের ছবি]` / `[Photo of Subham, the groom]` | Short photo description (screen readers) |
| `couple.bride.fullName` | `শ্রীরূপা [পদবি]` / `Sreerupa [Surname]` | Bride's full name |
| `couple.bride.father` | `[কনের বাবা]` / `[Bride's Father]` | Bride's father's name |
| `couple.bride.mother` | `[কনের মা]` / `[Bride's Mother]` | Bride's mother's name |
| `couple.bride.photoAlt` | `[কনে শ্রীরূপার ছবি]` / `[Photo of Sreerupa, the bride]` | Short photo description (screen readers) |
| `event.timeLabel` | `সন্ধ্যা ৭টা থেকে` / `7:00 PM onwards` | Not bracketed, but a placeholder: confirm the time text (see [Changing the date or time](#changing-the-date-or-time)) |

### Files

| File | Status | What to do |
|---|---|---|
| `public/images/groom.jpg` | **Does not exist yet** (a drawn silhouette is shown instead) | Add the groom's photo (see [Photos](#couple-photos)) |
| `public/images/bride.jpg` | **Does not exist yet** (a drawn silhouette is shown instead) | Add the bride's photo |
| `public/audio/bg.mp3` | **Silent placeholder** (about 10 s of silence) | Replace with your licensed track (see [Music](#background-music)) |
| `index.html` | Title, description, Open Graph and Twitter tags are hand-written | Edit them by hand if names, date or venue change (see below) |

### `index.html` link-preview text

These tags control what WhatsApp, Facebook etc. show when the link is pasted. They are **not**
generated from `config.js`; edit them directly if anything in them changes:

- `<title>` and `og:title`, `twitter:title`: `Subham & Sreerupa | Reception, 23 Nov 2027`
- `<meta name="description">` and `og:description`: Bengali sentence + `/` + English sentence with
  the weekday, date, venue and Keyatala
- `twitter:description`: a shorter bilingual version

Write `&` as `&amp;` inside these attributes. `config.meta.title` / `config.meta.description` hold the
same text for reference; keep them in sync, but the app does not read them at runtime.

## Editing `src/config.js`

It is a plain JavaScript object. Rules of thumb:

- Text is a pair `{ bn: '...', en: '...' }`. Fill both; an empty string fails `npm test`.
- Keep the quotes. If English text contains an apostrophe, use double quotes: `"[Groom's Father]"`.
- Bengali numbers are converted automatically (`23` becomes `২৩`), so dates and countdown digits
  never need typing.
- Strings with `{tokens}` (`familyLine`, `calendar.markedLabel`, `share.whatsappText`) are templates;
  keep the tokens.

Sections:

| Section | What it controls |
|---|---|
| `meta` | Reference copy of the page title/description (mirror of `index.html`, not used at runtime) |
| `event` | Date, start time, time zone, event name, the displayed time label |
| `couple` | Short display names, full names, photo paths, parents' names, "Son of / Daughter of" line |
| `venue` | Venue name, locality, address, Google Maps link (also the QR payload) |
| `copy` | All scene and final-page text: gate prompt, message lines, taglines, closing, button labels, countdown units, headings |
| `ui` | Mute/unmute and language-toggle labels, progress-bar label |
| `calendar` | Month and weekday names, week start (`weekStartsOn: 0` = Sunday), marked-date label |
| `digits` | Bengali digit map (do not change) |
| `timeline` | Scene order and durations, crossfade length |
| `audio` | Music file path, volume, fade in/out, loop |
| `share` | WhatsApp message template |

## Changing the date or time

Change only these in `src/config.js`:

```js
event: {
  isoDate: '2027-11-23',   // YYYY-MM-DD
  startTime: '19:00',      // 24-hour, Kolkata time
  timeZone: 'Asia/Kolkata',
  utcOffset: '+05:30',
  timeLabel: { bn: 'সন্ধ্যা ৭টা থেকে', en: '7:00 PM onwards' },
```

Updated automatically from `isoDate` / `startTime`:

- the month calendar (month, year, number of days, which weekday the 1st falls on, which cell is
  marked) via `src/components/MonthCalendarGrid.js`, computed in the Kolkata time zone so it does not
  depend on the guest's own time zone
- the weekday name, the big day number, the blinking heart around the date
- the countdown (target is `isoDate` + `startTime` + `utcOffset`)
- the date in the WhatsApp message

Update by hand:

- `event.timeLabel` (both languages) if the start time changes; it is display text only
- `index.html` title/description/OG/Twitter tags and `config.meta` (they contain the date and weekday)

## Couple photos

- Put the files at `public/images/groom.jpg` and `public/images/bride.jpg` (paths are
  `couple.groom.photo` / `couple.bride.photo`; change those if you use another name or `.webp`).
- Portrait orientation, about 3:4 (shown in an arched 3:4 frame, cropped to fill, centred slightly
  above the middle so faces are not cut off).
- At most 800 px wide, compressed JPEG (quality ~75) or WebP; aim for under ~150 KB each.
- If a file is missing or fails to load, the frame shows a drawn silhouette instead; nothing breaks.
- Update `photoAlt` for each.

## Names and families

- `couple.names` is the large "শুভম ও শ্রীরূপা / Subham & Sreerupa" heading and the name used in the
  WhatsApp message.
- `couple.<groom|bride>.fullName`, `father`, `mother` appear on the family scene and the final page.
- `couple.familyLine` builds "Son of {father} & {mother}"; `relation` is `পুত্র / Son` and
  `কন্যা / Daughter`.

## Background music

- Replace `public/audio/bg.mp3` with your track, same name (or change `audio.src`). Details and
  encoding advice: `public/audio/README-AUDIO.txt`.
- **Licensing:** use only royalty-free / Creative Commons music whose licence allows use on a public
  website, a track you have licensed, or your own recording. No commercial film or album recordings.
- Suggested: MP3 96-128 kbps, under ~2 MB, 90 s to 3 min, trimmed to loop cleanly (the sequence is
  about 76 s and the music loops).
- Settings in `config.audio`: `volume` (0.5), `fadeInMs` (3000), `fadeOutMs` (1200), `loop` (true).
- Nothing downloads until the guest taps the gate. The mute button's state is remembered on the
  guest's device. Music pauses when the tab is hidden.
- **iPhone/iPad:** iOS Safari ignores volume set by a web page, so music plays at the device volume
  with no fade-in. Mute still works.
- If the file is missing or broken, the invitation works the same, silently.

## Scene durations

`config.timeline.scenes` lists the timed scenes in order with `durationMs` (milliseconds). Current
total 76 000 ms. Keep the total at least 60 000 ms; `npm test` also expects it between 70 000 and
85 000 ms and the scene order unchanged. `crossfadeMs` (900) is the fade between scenes.
Guests can tap anywhere (or press Space / Enter / Right arrow) to skip to the next scene; Escape jumps
to the final page.

## Changing the venue or Maps link

1. Edit `venue.name`, `venue.locality`, `venue.address` (both languages) and `venue.mapsUrl`.
2. The QR code is generated from `venue.mapsUrl` automatically; there is no image to replace.
3. Run `npm run verify:qr`. It renders the exact QR the page shows at phone and desktop sizes,
   decodes it and checks it matches `venue.mapsUrl`. **It must print all PASS** before you deploy.
4. Update the `index.html` meta text if the venue name changed.

Spelling: the locality is **কেয়াতলা** in Bengali and **Keyatala** in English. `npm test` scans the
whole project (including this README) and fails on any other spelling.

## Languages

The toggle at the top switches between **বাংলা**, **English** and **Both** (default: Both, with
Bengali first). The choice is remembered on the guest's device. All text, including numbers, follows
the chosen mode.

## Accessibility and reduced motion

- If the guest's device has "reduce motion" turned on, animations become simple fades: no looping,
  blinking or swaying; petals and fireflies stay still and parallax is off.
- All controls are keyboard-reachable and labelled (labels come from `config.ui`), Bengali text is
  marked `lang="bn"`, the marked calendar date has a spoken label (`calendar.markedLabel`).
- Photos have alt text (`photoAlt`); decorative art is hidden from screen readers.

## Tests and checks

| Command | What it does |
|---|---|
| `npm test` | Node unit tests (`tests/*.test.mjs`): calendar grid correctness, config sanity, heart-marker animation constants, spelling scan of the whole repo including README |
| `npm run verify:qr` | Decodes the generated QR and compares it with `venue.mapsUrl` |
| `npm run test:e2e` | Builds into a temp folder, serves on port 5207 and drives the real page in Chrome at 360, 414 and 1440 px (takes a few minutes) |
| `npm run lighthouse` | Builds, serves on port 5207 and runs Lighthouse (mobile) 3 times; fails if performance is below 90 |

**Important when you customise:** `tests/config.test.mjs` and `tests/calendar.test.mjs` (and the
`clock` and `lang` suites of `tests/e2e/run.mjs`) deliberately pin the current data: the date
2027-11-23 19:00, "7:00 PM onwards", the Maps URL, the venue/address, the message copy (checked
against `.claude/SPEC.md`), the audio settings, and that the parents' names still contain `[brackets]`.
After you change any of these, those specific assertions will fail. That is expected: update the
expected values in the test files (or delete the pinned assertion). The spelling checks, the
"no empty strings" check, the timeline-length check and `verify:qr` should keep passing.

`test:e2e` and `lighthouse` need Google Chrome at `/usr/bin/google-chrome` (or set `CHROME_PATH`).
Environment options:

| Variable | Effect |
|---|---|
| `QA_OUT=/dir` | Where the build, screenshots and reports go (default: `invite-qa` in the OS temp dir, e.g. `/tmp/invite-qa`) |
| `QA_PORT=5207` | Preview port |
| `QA_NO_BUILD=1` | Reuse the existing build in `$QA_OUT/dist` |
| `QA_BASE_URL=http://localhost:5173` | Test an already running server (skips build and serve) |
| `QA_ONLY=walk,clock,skip,reduced,lang,fallback` | e2e only: run a subset of suites |
| `QA_LH_RUNS=3` | Lighthouse only: number of runs (median is reported) |
| `QA_LH_MIN_PERF=90` | Lighthouse only: minimum performance score |

Results land in `$QA_OUT` (`e2e-results.json`, `shots/*.png`, `lighthouse.html`).

## Deploying

The build output is plain static files in `dist/`. The invitation itself only uses `/`, so **no SPA
rewrite is needed**.

**Vercel:** import the project; framework preset "Vite" (build `npm run build`, output `dist`).

**Netlify:** build command `npm run build`, publish directory `dist`. Or drag the `dist/` folder onto
Netlify Drop.

After deploying, open the live URL on a phone, tap through once, and paste the link into WhatsApp to
check the preview text. The WhatsApp share button uses whatever URL the page is opened at.

### Optional: serve the `/dev/*` preview pages in production

Only needed if you want the developer pages below on the live site. Add a rewrite to `index.html`:

`vercel.json`
```json
{ "rewrites": [{ "source": "/dev/(.*)", "destination": "/index.html" }] }
```

Netlify `public/_redirects` (copied into `dist/` by the build)
```
/dev/*  /index.html  200
```

## For developers

- Entry: `index.html` → `src/main.jsx` → `src/App.jsx` (gate, language and audio state) →
  `src/AppStage.jsx` (lazy-loaded and prefetched while the gate is idle: timed scenes, ambient layers,
  final page, QR). Scenes are in `src/components/Scene*.jsx`, wired up in `SceneRegistry.js`; hooks in
  `src/hooks/`; design tokens in `src/styles/tokens.css`.
- Any path `/dev/<name>` loads `src/dev/<name>.jsx` instead of the invitation (works in `npm run dev`
  and `npm run preview`; not included in the main bundle):

| Route | Shows |
|---|---|
| `/dev/gallery` (alias `/dev-gallery`) | Floral SVG components; `?reduced` for reduced motion |
| `/dev/scenes` | Index of scenes; `?scene=gate\|opening\|names\|family\|message\|date\|venue\|closing\|final\|flow`, plus `&lang=bn\|en\|both`, `&speed=2`, `&t=5` (start at 5 s), `&decor=0` |
| `/dev/timeline` | Timeline engine test bench; `?speed=` |
| `/dev/audio` | Audio hook test bench; `?src=`, `?fadeInMs=` |
| `/dev/qr` | QR code and Maps button |
| `/dev/i18n` | Every config string in each language mode, plus the WhatsApp text |

- Calendar logic is a pure function, `buildMonthGrid(isoDate, weekStartsOn, timeZone)` in
  `src/components/MonthCalendarGrid.js`, tested in plain Node.
