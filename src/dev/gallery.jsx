/* Dev-only gallery (/dev/gallery, /dev-gallery): every floral-svg-artist component in labelled tiles.
   Labels here are dev scaffolding and intentionally hardcoded. ?reduced=1 forces reduced motion. */
import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { FloralCorner } from '../components/FloralCorner.jsx';
import { Petals } from '../components/Petals.jsx';
import { Fireflies } from '../components/Fireflies.jsx';
import { Butterfly } from '../components/Butterfly.jsx';
import { Lanterns } from '../components/Lanterns.jsx';
import { LanternHouse } from '../components/LanternHouse.jsx';
import { LotusBud } from '../components/LotusBud.jsx';
import { KolkaHeart } from '../components/KolkaHeart.jsx';
import { KolkaMotif } from '../components/KolkaMotif.jsx';
import { ShankhRipple } from '../components/ShankhRipple.jsx';
import { AlponaBorder } from '../components/AlponaBorder.jsx';
import { ArchFrame } from '../components/ArchFrame.jsx';
import { PortraitSilhouette } from '../components/PortraitSilhouette.jsx';
import { FloralVine } from '../components/FloralVine.jsx';
import { LalPaarFrame } from '../components/LalPaarFrame.jsx';
import { HeartMarker } from '../components/HeartMarker.jsx';
import { PetalBurst } from '../components/PetalBurst.jsx';
import { TerracottaNoise } from '../components/TerracottaNoise.jsx';

const CSS = `
.g-page{position:relative;z-index:1;max-width:1320px;margin:0 auto;padding:16px 16px 64px;color:var(--maroon-900);font-family:var(--font-en-display)}
.g-head{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;margin:8px 0 20px}
.g-head h1{font-size:var(--fs-xl);font-weight:600}
.g-head label{font-size:15px;display:flex;gap:8px;align-items:center;cursor:pointer}
.g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:18px}
.g-tile{background:rgba(255,252,246,.85);border:1px solid rgba(201,162,75,.55);border-radius:14px;padding:12px;box-shadow:var(--shadow-sm);min-width:0;display:flex;flex-direction:column;gap:10px}
.g-tile.wide{grid-column:1/-1}
.g-tile h2{font-size:17px;font-weight:600;line-height:1.3;color:var(--maroon);align-self:flex-start}
.g-tile p.g-note{font-size:13px;color:var(--maroon-muted);line-height:1.4;margin-top:-4px}
.g-stage{position:relative;min-height:220px;border-radius:10px;background:var(--ivory);overflow:hidden;display:grid;place-items:center}
.g-contain{transform:translateZ(0);height:300px}
.g-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center}
.g-btn{font:inherit;font-size:14px;padding:4px 12px;border-radius:999px;border:1px solid var(--gold);background:var(--ivory-50);color:var(--maroon);cursor:pointer}
.g-cell{position:relative;width:44px;height:44px;display:grid;place-items:center;font-size:18px;color:var(--maroon-muted);font-variant-numeric:tabular-nums;overflow:visible}
.g-cell.marked{background:var(--maroon);color:var(--ivory);border-radius:10px;box-shadow:var(--shadow-glow-maroon)}
.g-cal{display:grid;grid-template-columns:repeat(7,minmax(0,44px));gap:4px;justify-content:center;padding:14px 4px}
.g-cap{font-size:12px;color:var(--maroon-muted);text-align:center}
.g-arches{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:4px;align-items:center;width:100%;max-width:640px}
.g-alpona-ring{width:min(100%,180px)}
.g-lal p{line-height:1.6;margin:0 0 .5em}
`;

function Tile({ title, note, wide, children }) {
  return (
    <section className={`g-tile${wide ? ' wide' : ''}`}>
      <h2 data-perch>{title}</h2>
      {note && <p className="g-note">{note}</p>}
      {children}
    </section>
  );
}

function useReplay() {
  const [k, setK] = useState(0);
  return [k, () => setK((v) => v + 1)];
}

function LotusDemo() {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className="g-stage">
        <div className="g-row">
          <div>
            <LotusBud open={false} />
            <div className="g-cap">open=false</div>
          </div>
          <div>
            <LotusBud open={open} onOpened={() => setOpened((n) => n + 1)} />
            <div className="g-cap">
              open={String(open)} · onOpened ×{opened}
            </div>
          </div>
        </div>
      </div>
      <div className="g-row">
        <button type="button" className="g-btn" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Bloom'}
        </button>
      </div>
    </>
  );
}

function CalendarDemo({ label }) {
  const [burst, setBurst] = useState(0);
  const days = [null, 1, 2, 3, 4, 5, 6, 21, 22, 23, 24, 25, 26, 27];
  return (
    <div>
      <div className="g-cal">
        {days.map((d, i) =>
          d === 23 ? (
            <div
              key={i}
              className="g-cell marked"
              onClick={() => setBurst((b) => b + 1)}
              onMouseEnter={() => setBurst((b) => b + 1)}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>23</span>
              <HeartMarker size={60} delay={0.4} />
              <PetalBurst burstKey={burst} />
            </div>
          ) : (
            <div key={i} className="g-cell">
              {d ?? ''}
            </div>
          ),
        )}
      </div>
      <div className="g-cap">{label}</div>
    </div>
  );
}

function BurstDemo() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setK((v) => v + 1), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="g-stage" onClick={() => setK((v) => v + 1)} style={{ cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: 60, height: 60, display: 'grid', placeItems: 'center' }}>
        <KolkaMotif size={40} />
        <PetalBurst burstKey={k} count={12} />
      </div>
    </div>
  );
}

function Tiles() {
  const [houseKey, replayHouse] = useReplay();
  const [kolkaKey, replayKolka] = useReplay();
  const [archKey, replayArch] = useReplay();
  const [heartKey, replayHeart] = useReplay();

  return (
    <div className="g-grid">
      <Tile title="FloralCorner — tl / tr / bl / br" note="Fixed layers, contained in this tile via transform. Sway + pendant swing (CSS), parallax (useParallax).">
        <div className="g-stage g-contain">
          <FloralCorner position="tl" size={140} />
          <FloralCorner position="tr" size={140} />
          <FloralCorner position="bl" size={140} />
          <FloralCorner position="br" size={140} />
        </div>
      </Tile>

      <Tile title="Petals — count 24" note="Shiuli, rajanigandha, marigold petals; CSS fall + sway/flutter.">
        <div className="g-stage g-contain">
          <Petals count={24} />
        </div>
      </Tile>

      <Tile title="Fireflies — count 10">
        <div className="g-stage g-contain" style={{ background: 'linear-gradient(#FFF8EC,#FBEFD9)' }}>
          <Fireflies count={10} />
        </div>
      </Tile>

      <Tile title="Lanterns — count 6" note="Absolute-fill of parent.">
        <div className="g-stage" style={{ height: 300, background: 'linear-gradient(#FBEFD9,#FFF8EC)' }}>
          <Lanterns count={6} />
        </div>
      </Tile>

      <Tile title="LanternHouse — play">
        <div className="g-stage" key={houseKey}>
          <LanternHouse play />
        </div>
        <div className="g-row">
          <button type="button" className="g-btn" onClick={replayHouse}>
            Replay
          </button>
        </div>
      </Tile>

      <Tile title="LanternHouse — play=false">
        <div className="g-stage">
          <LanternHouse play={false} />
        </div>
      </Tile>

      <Tile title="LotusBud — closed / blooming" note="Right bud opens 1.5s after load; onOpened counter.">
        <LotusDemo />
      </Tile>

      <Tile title="KolkaHeart — draw, bounce" note="64px draw only · 96px draw + bounce · draw=false">
        <div className="g-stage" key={kolkaKey}>
          <div className="g-row">
            <KolkaHeart size={64} />
            <KolkaHeart size={96} bounce delay={0.3} />
            <KolkaHeart size={64} draw={false} />
          </div>
        </div>
        <div className="g-row">
          <button type="button" className="g-btn" onClick={replayKolka}>
            Replay
          </button>
        </div>
      </Tile>

      <Tile title="ShankhRipple — play / play=false">
        <div className="g-stage">
          <div className="g-row" style={{ width: '100%' }}>
            <div style={{ width: 'min(46%, 200px)' }}>
              <ShankhRipple play />
            </div>
            <div style={{ width: 'min(46%, 200px)' }}>
              <ShankhRipple play={false} />
            </div>
          </div>
        </div>
      </Tile>

      <Tile title="AlponaBorder — strip / ring">
        <div className="g-stage" style={{ alignContent: 'center', gap: 16, padding: 12 }}>
          <AlponaBorder />
          <div className="g-alpona-ring">
            <AlponaBorder variant="ring" />
          </div>
        </div>
      </Tile>

      <Tile title="KolkaMotif — 32 / 48 / 72">
        <div className="g-stage">
          <div className="g-row">
            <KolkaMotif size={32} />
            <KolkaMotif size={48} />
            <KolkaMotif size={72} />
          </div>
        </div>
      </Tile>

      <Tile title="FloralVine — horizontal / vertical">
        <div className="g-stage">
          <div className="g-row">
            <FloralVine orientation="horizontal" />
            <FloralVine orientation="vertical" />
            <FloralVine orientation="horizontal" draw={false} />
          </div>
        </div>
      </Tile>

      <Tile wide title="ArchFrame + PortraitSilhouette (groom, bride) + FloralVine" note="Frames bloom, then portraits fade in.">
        <div className="g-stage" style={{ padding: '24px 8px' }} key={archKey}>
          <div className="g-arches">
            <ArchFrame>
              <PortraitSilhouette kind="groom" />
            </ArchFrame>
            <FloralVine orientation="vertical" />
            <ArchFrame>
              <PortraitSilhouette kind="bride" />
            </ArchFrame>
          </div>
        </div>
        <div className="g-row">
          <button type="button" className="g-btn" onClick={replayArch}>
            Replay bloom
          </button>
        </div>
      </Tile>

      <Tile title="LalPaarFrame — with filler">
        <div style={{ padding: 4 }}>
          <LalPaarFrame>
            <div className="g-lal">
              <AlponaBorder />
              <p style={{ marginTop: 12, fontSize: 20, color: 'var(--maroon)' }}>Filler card content</p>
              <p>Lal-paar border, gold zari hairlines, ivory inside, kolka corners. Wraps real content; decoration is aria-hidden.</p>
            </div>
          </LalPaarFrame>
        </div>
      </Tile>

      <Tile wide title="HeartMarker — animated vs forced reduced motion" note="Draw 1.2s via stroke-dasharray, then blink 1.4s (opacity 1↔0.25, scale 1↔1.12). Right: <MotionConfig reducedMotion='always'> → static glow. Tap/hover the 23 for PetalBurst.">
        <div className="g-stage" key={heartKey} style={{ padding: 12 }}>
          <div className="g-row" style={{ gap: 28 }}>
            <div data-testid="heart-animated">
              <CalendarDemo label="animated (size 60 over a 44px cell)" />
            </div>
            <MotionConfig reducedMotion="always">
              <div data-testid="heart-reduced">
                <CalendarDemo label="reduced motion (forced)" />
              </div>
            </MotionConfig>
            <div style={{ display: 'flex', gap: 28 }}>
              <div className="g-cell" style={{ width: 64, height: 64 }}>
                <HeartMarker size={96} />
              </div>
              <MotionConfig reducedMotion="always">
                <div className="g-cell" style={{ width: 64, height: 64 }}>
                  <HeartMarker size={96} />
                </div>
              </MotionConfig>
            </div>
          </div>
        </div>
        <div className="g-row">
          <button type="button" className="g-btn" onClick={replayHeart}>
            Replay draw
          </button>
        </div>
      </Tile>

      <Tile title="PetalBurst — auto every 2.2s (or tap)">
        <BurstDemo />
      </Tile>

      <Tile title="TerracottaNoise" note="Also active for this whole page (fixed overlay).">
        <div className="g-stage g-contain" style={{ height: 160, background: 'var(--ivory)' }}>
          <TerracottaNoise />
        </div>
      </Tile>

      <Tile title="Butterfly (page-level)" note="Two butterflies land on these tile headings ([data-perch]) every ~8-12s. Hidden under reduced motion.">
        <div className="g-stage" style={{ minHeight: 120 }}>
          <span className="g-cap">watch the headings</span>
        </div>
      </Tile>
    </div>
  );
}

export default function Gallery() {
  const initial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('reduced');
  const [forced, setForced] = useState(initial);
  return (
    <MotionConfig reducedMotion={forced ? 'always' : 'user'}>
      <style>{CSS}</style>
      <TerracottaNoise />
      <div className="g-page" lang="en">
        <header className="g-head">
          <h1>Floral SVG gallery</h1>
          <label>
            <input type="checkbox" checked={forced} onChange={(e) => setForced(e.target.checked)} />
            Force reduced motion (all tiles)
          </label>
        </header>
        <Tiles key={forced ? 'r' : 'm'} />
      </div>
      <Butterfly />
    </MotionConfig>
  );
}
