# Graph Report - bia_legeche  (2026-10-30)

## Corpus Check
- 88 files · ~392,838 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 541 nodes · 1128 edges · 32 communities (29 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5a74ba7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- config.js
- SceneFinal.jsx
- SceneDate.jsx
- package.json
- scenes.jsx
- run.mjs
- Subham & Sreerupa: reception invitation
- gallery.jsx
- verify-qr.mjs
- flora.jsx
- useSvgId
- Shared contracts (orchestrator-owned)
- Product spec (source of truth, verbatim from the client brief)
- ArchFrame.jsx
- FloralCorner.jsx
- qa-serve.mjs
- spelling.test.mjs
- audio-agent.md
- content-i18n.md
- docs-agent.md
- floral-svg-artist.md
- qr-maps-agent.md
- scaffold-architect.md
- scene-builder.md
- timeline-engine.md
- qa-perf-agent.md
- Petals.jsx
- .orch-flow.mjs
- heart-marker.test.mjs
- .orch-shot.mjs
- index.js

## God Nodes (most connected - your core abstractions)
1. `config` - 38 edges
2. `useLanguage()` - 27 edges
3. `BilingualText()` - 20 edges
4. `formatNumber()` - 18 edges
5. `useTiming()` - 15 edges
6. `Subham & Sreerupa: reception invitation` - 15 edges
7. `useSvgId()` - 12 edges
8. `useAfter()` - 12 edges
9. `Shared contracts (orchestrator-owned)` - 12 edges
10. `Product spec (source of truth, verbatim from the client brief)` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getQrMatrix()` --references--> `qrcode`  [EXTRACTED]
  src/components/MapQRMatrix.js → package.json
- `markedLabel()` --calls--> `formatNumber()`  [EXTRACTED]
  tests/calendar.test.mjs → src/utils/bengaliDigits.js
- `PlayingStage()` --calls--> `useLanguage()`  [EXTRACTED]
  src/AppStage.jsx → src/hooks/useLanguage.jsx
- `Flow()` --calls--> `useTimeline()`  [EXTRACTED]
  src/dev/scenes.jsx → src/hooks/useTimeline.js
- `Conch()` --calls--> `useSvgId()`  [EXTRACTED]
  src/components/ShankhRipple.jsx → src/assets/svg/flora.jsx

## Import Cycles
- None detected.

## Communities (32 total, 3 thin omitted)

### Community 0 - "config.js"
Cohesion: 0.05
Nodes (42): AmbientLayers, App(), DevPage, devPages, FinalPage, Invitation(), loadStage(), PlayingStage (+34 more)

### Community 1 - "SceneFinal.jsx"
Cohesion: 0.07
Nodes (44): FamilyCard, KolkaHeart, Lanterns, DOTS, EASE, LAYERS, LotusBud, STAMENS (+36 more)

### Community 2 - "SceneDate.jsx"
Cohesion: 0.08
Nodes (46): BilingualText(), cx(), isPair(), resolveVars(), toLines(), VARIANTS, Countdown, UNITS (+38 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (35): framer-motion, jsqr, lighthouse, dependencies, framer-motion, qrcode, react, react-dom (+27 more)

### Community 4 - "scenes.jsx"
Cohesion: 0.08
Nodes (21): PlayingStage(), Butterfly, Flyer(), PALETTES, rand(), visiblePerches(), wait(), Fireflies (+13 more)

### Community 5 - "run.mjs"
Cohesion: 0.16
Nodes (33): a11yProbe(), heartProbe(), infiniteAnimations(), layoutProbe(), check(), clockSuite(), consoleIssues, decodeQr() (+25 more)

### Community 6 - "Subham & Sreerupa: reception invitation"
Cohesion: 0.10
Nodes (19): Accessibility and reduced motion, Background music, Before you share: replace the placeholders, Changing the date or time, Changing the venue or Maps link, Couple photos, Deploying, Editing `src/config.js` (+11 more)

### Community 7 - "gallery.jsx"
Cohesion: 0.14
Nodes (9): SHIULI, HeartMarker, DOTS, KolkaMotif, LalPaarFrame, GLYPHS, PetalBurst, Tiles() (+1 more)

### Community 8 - "verify-qr.mjs"
Cohesion: 0.19
Nodes (13): check(), fail(), pass(), RENDERS, arc(), buildQrSvg(), EC_NAMES, fmt() (+5 more)

### Community 9 - "flora.jsx"
Cohesion: 0.25
Nodes (11): Garland(), RajStalk(), creases(), f(), MARIGOLD, MARIGOLD_COLORS, quadAt(), quadSpread() (+3 more)

### Community 10 - "useSvgId"
Cohesion: 0.15
Nodes (7): useSvgId(), AlponaBorder, RING, HALO_DOTS, PortraitSilhouette, Conch(), ShankhRipple

### Community 11 - "Shared contracts (orchestrator-owned)"
Cohesion: 0.15
Nodes (12): 0. Ground rules for every agent, 10. App composition (orchestrator, src/App.jsx) — for reference, 1. Dependencies (installed by scaffold-architect), 2. Dev routes (App.jsx, orchestrator), 3. `src/config.js` schema, 4. content-i18n exports, 5. floral-svg-artist exports (all decorative → `aria-hidden="true"`, `pointer-events: none` unless noted), 6. timeline-engine exports (+4 more)

### Community 12 - "Product spec (source of truth, verbatim from the client brief)"
Cohesion: 0.15
Nodes (12): AGENT ROSTER AND PHASES, AUDIO, CALENDAR SPEC, COPY (use as written; both languages), DELIVERABLES, EVENT DATA (single config file, src/config.js; no hardcoded copy in components), EXPERIENCE FLOW (guided sequence at least 60 seconds; target about 76 seconds), LANGUAGE UX (+4 more)

### Community 13 - "ArchFrame.jsx"
Cohesion: 0.17
Nodes (10): FloraDefs(), Lotus(), U(), ARCH_DOTS, ArchFrame, EASE, BITS, FloralVine (+2 more)

### Community 14 - "FloralCorner.jsx"
Cohesion: 0.22
Nodes (7): DOTS, FloralCorner, LEAVES, SHIULI_SPOTS, clamp(), SPRING, useParallax()

### Community 15 - "qa-serve.mjs"
Cohesion: 0.27
Nodes (8): CATEGORIES, MIN_PERF, RUNS, build(), buildAndServe(), PORT, ROOT, waitForHttp()

### Community 16 - "spelling.test.mjs"
Cohesion: 0.22
Nodes (7): BANNED_DECOMPOSED, BANNED_PRECOMPOSED, CORRECT, files, ROOT, SKIP_DIRS, walk()

### Community 17 - "audio-agent.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 18 - "content-i18n.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 19 - "docs-agent.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 20 - "floral-svg-artist.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 21 - "qr-maps-agent.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 22 - "scaffold-architect.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 23 - "scene-builder.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 24 - "timeline-engine.md"
Cohesion: 0.29
Nodes (6): Before reporting done, Done when, Ownership rule, Owns, Read first, Responsibilities

### Community 25 - "qa-perf-agent.md"
Cohesion: 0.33
Nodes (5): Before reporting done, Ownership rule, Owns, Read first, Responsibilities (automate as much as possible so the orchestrator can re-run)

### Community 26 - "Petals.jsx"
Cohesion: 0.33
Nodes (3): KINDS, Petals, STATIC_SPOTS

### Community 28 - "heart-marker.test.mjs"
Cohesion: 0.50
Nodes (3): css, jsx, ROOT

## Knowledge Gaps
- **198 isolated node(s):** `errs`, `names`, `errs`, `name`, `private` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `SceneFinal.jsx`, `SceneDate.jsx`, `scenes.jsx`, `run.mjs`, `verify-qr.mjs`, `spelling.test.mjs`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `getQrMatrix()` connect `verify-qr.mjs` to `package.json`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `qrcode` connect `package.json` to `verify-qr.mjs`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `errs`, `names`, `errs` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05407925407925408 - nodes in this community are weakly interconnected._
- **Should `SceneFinal.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07067307692307692 - nodes in this community are weakly interconnected._
- **Should `SceneDate.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08038075092543628 - nodes in this community are weakly interconnected._