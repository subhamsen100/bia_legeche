# Product spec (source of truth, verbatim from the client brief)

Build a single-page, cinematic wedding reception invitation website in React (Vite + React 18). Mobile-first, then desktop. Bilingual: Bengali and English. Execute using multiple Claude Code subagents with strict file ownership, defined below.

## EVENT DATA (single config file, src/config.js; no hardcoded copy in components)
- Couple: Subham & Sreerupa (শুভম ও শ্রীরূপা)
- Event: Wedding Reception
- Date: Tuesday, 23 November 2027 (store as ISO "2027-11-23"; all calendar and countdown values derive from it)
- Time: placeholder "7:00 PM onwards", editable
- Venue: Ghoshbari, near Keyatala (ঘোষবাড়ি, কেয়াতলার কাছে)
- Address (English): "11, Keyatala Ln, Golpark, Hindustan Park, Keyatala, Kolkata, West Bengal 700029"
- Address (Bengali): "১১, কেয়াতলা লেন, গোলপার্ক, হিন্দুস্তান পার্ক, কেয়াতলা, কলকাতা, পশ্চিমবঙ্গ ৭০০০২৯"
- Bengali spelling of the locality is কেয়াতলা everywhere. Never use the banned alternative spelling (see qa grep list in CONTRACTS.md). English spelling is "Keyatala". The qa-perf-agent greps the whole codebase and README for the banned spelling and fails the build check if found.
- Maps URL: https://maps.app.goo.gl/DAW7kmpgxBA3xEicA (used for both the "Open in Maps" button and the QR code)
- Groom: name, photo path, "Son of" line, father name, mother name (Bengali and English), all placeholders
- Bride: same fields, all placeholders
- Placeholder values must be visibly marked, e.g. "[Groom's Father]" / "[বরের বাবা]", and listed in the README as items to replace.

## TECH
- Vite, React 18, Framer Motion, no UI framework, CSS modules or CSS variables, no Tailwind.
- QR: npm package "qrcode", rendered as inline SVG (not PNG). Error correction level H, 4-module quiet zone.
- Fonts via Google Fonts: "Noto Serif Bengali" and "Hind Siliguri" (Bengali), "Cormorant Garamond" (English display), "Great Vibes" (English couple names only).
- Respect prefers-reduced-motion: fall back to simple fades.
- Lighthouse mobile performance 90+. Floral art as inline SVG; no heavy raster images besides the optional couple photos (lazy-loaded, max 800px wide).

## EXPERIENCE FLOW (guided sequence at least 60 seconds; target about 76 seconds)
Autoplay audio is blocked, so start with a gate.

Scene 0 (gate): Cream full-screen with a closed ornate envelope or lotus bud. Text "খুলুন / Tap to open". Tap starts music (3s fade-in) and the sequence. A persistent mute/unmute button stays in a corner afterwards.

Scene 1 (0-10s): Envelope or lotus opens. Petals of shiuli, rajanigandha, and marigold drift down for the whole experience (20-30 SVG petals, randomized sway and rotation).

Scene 2 (10-20s): Couple's names appear letter by letter with soft gold shimmer. Bengali above, English below. A heart or kolka draws itself between them via SVG stroke animation. Bouncing heart when names finish.

Scene 3 (20-32s): Couple and families. Two arch- or lotus-framed portrait placeholders (groom left, bride right on desktop; stacked on mobile) joined by a small floral vine. Under each: name, "Son of / Daughter of", parents' names. Photos load from config paths; if the file is missing, show an illustrated placeholder silhouette in the same frame. Frames bloom open, then portraits fade in.

Scene 4 (32-44s): Invitation message, Bengali then English, each line fading up in sequence (copy below).

Scene 5 (44-58s): Date reveal. Large "২৩" / "23", month, year, weekday. Flip or blooming-flower animation. Conch (shankh) and ulu-dhwani ripple (visual only). Then the month calendar for November 2027 draws in beneath (see CALENDAR SPEC), with the heart-marked blinking border on the 23rd. Live countdown (days, hours, minutes) to 23 Nov 2027 7:00 PM IST. Layout on mobile: big date and tagline compress upward, calendar and countdown stack below, no scrolling during the guided sequence.

Scene 6 (58-70s): Venue reveal. Ghoshbari, Keyatala. Tiny animated lantern-lit house or hand-drawn path with bouncing marker, lanterns floating up behind. Full address in both languages. Themed QR code in a gold-hairline card with caption "স্ক্যান করুন / Scan for directions". "Open in Maps" button beside it.

Scene 7 (70s+): Closing blessing, then the page becomes freely scrollable with all details in one place (couple, parents, date, calendar, venue, QR), a "Replay" button, and a "Share on WhatsApp" button with prefilled bilingual text. The calendar on this page keeps the blinking heart.

Timeline controller: array of scenes with durations in config. Scenes crossfade. Thin progress bar as a growing vine along the bottom. Tap to skip to the next scene.

## CALENDAR SPEC
- Month: November 2027, computed from the config ISO date, not hardcoded. Week starts Sunday (রবি). November 2027 begins on Monday and has 30 days, so the grid is 5 rows with one leading blank cell. The qa-perf-agent asserts: 1 Nov 2027 is a Monday, 23 Nov 2027 is a Tuesday, the 23rd sits in the Tuesday column of row 4.
- Header: "নভেম্বর ২০২৭ / November 2027". Weekday row: রবি সোম মঙ্গল বুধ বৃহ শুক্র শনি, with English initials or short names beneath or beside according to language mode.
- Numerals follow language mode: Bengali digits (১–৩০) in Bengali mode, Latin digits in English mode, both in Both mode (Bengali digit primary, small Latin digit secondary only on the 23rd to avoid clutter).
- Card: rounded, gold hairline border, ivory background, small alpona strip at top, soft shadow. Fits 360px width without horizontal overflow; cells at least 40px tap-safe height on mobile.
- Entrance: the grid fades in row by row, then the heart border on the 23rd draws itself via SVG stroke-dasharray (about 1.2s), then begins blinking.
- Heart-marked border on the 23rd: a heart-shaped outline (SVG path, stroke marigold #F2A900 with a maroon #7A1F2B inner stroke, 2.5px) enclosing the date number, slightly larger than the cell so it reads as a marker. The date cell gets a soft maroon fill or glow with ivory number text. Tiny sparkle or petal burst on tap or hover of the date.
- Blink behavior: opacity pulses between 1 and 0.25 combined with a scale pulse between 1 and 1.12, cycle about 1.4s, infinite, ease-in-out. Never faster than 3 flashes per second (accessibility). Under prefers-reduced-motion: no blink and no scale, show a static heart outline with a subtle fixed glow.
- Heart outline must not clip at the grid edges; the 23rd is mid-row so it has room, but the component stays safe if the config date changes (allow overflow visible on the cell).
- Other dates are muted maroon at about 70% opacity. Add an accessible label on the marked cell: aria-label "23 November 2027, Tuesday, reception" and a Bengali equivalent in Bengali mode. The blinking decoration is aria-hidden.
- All strings (month names, weekday names, Bengali digits mapping, labels) live in config via content-i18n.

## QR CODE SPEC
- Encodes the Maps URL from config.
- Colors: modules deep maroon #7A1F2B on ivory #FFF8EC background. Do not use gold for modules (insufficient contrast). Gold only as the card border and corner ornaments outside the quiet zone.
- Rounded module style allowed if still scannable. No logo overlay covering more than 15% of the center; prefer none.
- Minimum rendered size 160px mobile, 220px desktop.
- Verification step: render the QR to a canvas, decode with "jsqr" in a test script, and assert the decoded value equals the config URL. Fail the build step if it does not match.

## VISUAL DESIGN
- Palette: ivory #FFF8EC, deep maroon #7A1F2B, marigold #F2A900, shiuli white #FFFFFF with orange-stem #F4A261, leaf green #3E6B48, antique gold #C9A24B. Agents may refine tokens but must keep this family.
- Bengali identity: alpona-inspired borders, kolka motifs, lal-paar red-border saree-style frame around the main card, subtle terracotta SVG noise texture.
- Corner garlands of marigold, rajanigandha, shiuli, lotus as swaying SVG. Parallax on scroll and device tilt where supported.
- Cute animations: butterflies or fireflies that occasionally land on text, tap/hover petal bursts, floating lanterns.
- Rounded cards, soft shadows, gold hairline borders.

## AUDIO
- <audio> with placeholder /public/audio/bg.mp3, loop, volume 0.5, code-driven fade in/out.
- Intended: soft shehnai or sitar instrumental with light tabla, or Rabindrasangeet instrumental. Royalty-free or properly licensed only. No hardcoded copyrighted tracks. README documents file placement.
- Handle load failure silently. Pause when tab hidden.

## COPY (use as written; both languages)

Scene 4, Bengali:
"দুটো মন, দুটো পরিবার, আর একটা নতুন গল্পের শুরু।
আপনাদের আশীর্বাদ আর ভালোবাসাতেই আমাদের এই পথচলা পূর্ণ হবে।
তাই আমাদের আনন্দের সন্ধ্যায় আপনি আসুন, আমাদের পাশে থাকুন।"

Scene 4, English:
"Two hearts, two families, one beginning.
Our story feels most complete when the people we love are around us.
Come celebrate an evening of good food, old stories, and new memories."

Date tagline: "এই দিনটা আপনার জন্য তুলে রাখুন" / "Save this evening for us"
Venue tagline: "ঘোষবাড়ির আঙিনায়, আপনার অপেক্ষায়" / "At Ghoshbari, where we'll be waiting for you"
Closing: "আপনার উপস্থিতিই আমাদের সবচেয়ে বড় উপহার।" / "Your presence is the only gift we'll ask for."
Signed: "— শুভম ও শ্রীরূপা / Subham & Sreerupa"

Scene 3 family line templates (config-driven):
- Bengali: "[বাবার নাম] ও [মায়ের নাম]-এর পুত্র/কন্যা"
- English: "Son/Daughter of [Father] & [Mother]"

## LANGUAGE UX
- Default shows both (Bengali primary, English smaller). Toggle: "বাংলা | English | Both".
- Bengali: line-height at least 1.7, no letter-spacing, no text-transform.

## AGENT ROSTER AND PHASES
See .claude/agents/*.md for each agent's ownership and done-criteria, and .claude/CONTRACTS.md for the shared interfaces.

Phase 1: scaffold-architect (alone).
Phase 2, in parallel: floral-svg-artist, content-i18n, timeline-engine, audio-agent, qr-maps-agent.
Phase 3: scene-builder (consumes Phase 2 outputs); orchestrator wires App.jsx.
Phase 4: qa-perf-agent audits; owning agents fix their own issues; repeat until clean.
Phase 5: docs-agent writes README; orchestrator runs final npm run build and npm run verify:qr.

Each agent must run the dev server or relevant script and verify its output before reporting done. The orchestrator does not accept a phase on an agent's claim alone; it checks the result itself.

## DELIVERABLES
- Project runs with npm install && npm run dev; builds with npm run build.
- Placeholder couple photos and parents' details in config, visibly marked.
- November 2027 calendar with a self-drawing, blinking heart border on the 23rd, bilingual, reduced-motion safe.
- Themed, verified QR code linking to the Maps URL.
- README per docs-agent scope.
