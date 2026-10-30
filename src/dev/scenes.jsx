/* Dev-only scene picker (/dev/scenes). Dev scaffolding labels here are intentionally hardcoded.
   ?scene=gate|opening|names|family|message|date|venue|closing|final  renders one scene standalone
   ?scene=flow   full App-like run (gate -> timed stage -> final), ?speed=4 to fast-forward
   ?lang=bn|en|both   forces the language mode       ?decor=0  hides petals/corners/butterfly
   ?t=<seconds>       timed scenes: start the scene clock at this offset (clock only; entrance
                      choreography always runs from mount) */
import { useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import config from '../config.js';
import { LanguageProvider, useLanguage, LANGS } from '../hooks/useLanguage.jsx';
import { useTimeline } from '../hooks/useTimeline.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { AudioControl } from '../components/AudioControl.jsx';
import { FloralCorner } from '../components/FloralCorner.jsx';
import { Petals } from '../components/Petals.jsx';
import { Fireflies } from '../components/Fireflies.jsx';
import { Butterfly } from '../components/Butterfly.jsx';
import { TerracottaNoise } from '../components/TerracottaNoise.jsx';
import { TimelineStage } from '../components/TimelineStage.jsx';
import { TimelineProgress } from '../components/TimelineProgress.jsx';
import { sceneComponents, SceneGate, SceneFinal } from '../components/SceneRegistry.js';

const params = new URLSearchParams(window.location.search);
const SCENE = params.get('scene');
const LANG = params.get('lang');
const DECOR = params.get('decor') !== '0';
const SPEED = Number(params.get('speed')) > 0 ? Number(params.get('speed')) : 1;
const T0 = Number(params.get('t')) > 0 ? Number(params.get('t')) * 1000 : 0;

const IDS = ['gate', ...config.timeline.scenes.map((s) => s.id), 'final', 'flow'];

const CSS = `
.ds-toggle{position:fixed;top:calc(var(--safe-top) + var(--control-inset));left:calc(var(--safe-left) + var(--control-inset));z-index:var(--z-controls)}
.ds-stage{position:relative;z-index:var(--z-stage);width:100%;height:100vh;height:100dvh;overflow:hidden}
.ds-index{position:relative;z-index:var(--z-stage);max-width:40rem;margin:0 auto;padding:80px 20px 40px;font-family:var(--font-en-display);color:var(--maroon-900)}
.ds-index h1{font-size:var(--fs-xl);margin-bottom:1rem}
.ds-index ul{display:grid;gap:.5rem;padding:0;list-style:none}
.ds-index a{display:flex;justify-content:space-between;gap:1rem;padding:.6rem 1rem;border:1px solid rgba(201,162,75,.6);border-radius:12px;background:rgba(255,252,246,.85);text-decoration:none;font-size:1.1rem}
.ds-index small{color:var(--maroon-300)}
`;

const mockAudio = { muted: false, failed: false, toggleMute: () => {} };

function LangFromQuery() {
  const { setLang } = useLanguage();
  useEffect(() => {
    if (LANGS.includes(LANG)) setLang(LANG);
  }, [setLang]);
  return null;
}

function Decor({ playing }) {
  if (!DECOR) return <TerracottaNoise />;
  return (
    <>
      <TerracottaNoise />
      <FloralCorner position="tl" />
      <FloralCorner position="tr" />
      <FloralCorner position="bl" />
      <FloralCorner position="br" />
      {playing && (
        <>
          <Petals />
          <Fireflies />
          <Butterfly />
        </>
      )}
    </>
  );
}

/** Standalone timed scene with a local 10Hz clock (mimics TimelineStage). */
function TimedScene({ id, runKey }) {
  const Scene = sceneComponents[id];
  const durationMs = (config.timeline.scenes.find((s) => s.id === id) || {}).durationMs || 10000;
  const [elapsed, setElapsed] = useState(T0);
  useEffect(() => {
    const start = performance.now() - T0;
    const iv = setInterval(() => setElapsed(Math.min(durationMs, performance.now() - start)), 100);
    return () => clearInterval(iv);
  }, [durationMs, runKey]);
  return (
    <div className="ds-stage" data-dev-stage={id} data-scene-elapsed={Math.round(elapsed)}>
      <Scene key={runKey} sceneElapsedMs={elapsed} durationMs={durationMs} />
    </div>
  );
}

function Flow() {
  const tl = useTimeline(config.timeline.scenes, { speed: SPEED });
  return (
    <>
      <Decor playing={tl.phase !== 'gate'} />
      <LanguageToggle className="ds-toggle" />
      {tl.phase !== 'gate' && <AudioControl audio={mockAudio} />}
      {tl.phase === 'gate' && <SceneGate onOpen={tl.start} />}
      {tl.phase === 'playing' && (
        <>
          <TimelineStage
            timeline={tl}
            renderScene={(scene, { sceneElapsedMs, durationMs }) => {
              const S = sceneComponents[scene.id];
              return S ? <S sceneElapsedMs={sceneElapsedMs} durationMs={durationMs} /> : null;
            }}
          />
          <TimelineProgress timeline={tl} />
        </>
      )}
      {tl.phase === 'final' && <SceneFinal onReplay={tl.replay} />}
    </>
  );
}

function Picker() {
  const [scene, setScene] = useState(SCENE);
  const [runKey, setRunKey] = useState(0);
  const go = (s) => {
    setScene(s);
    setRunKey((k) => k + 1);
  };

  if (scene === 'flow') return <Flow />;

  if (!scene || !IDS.includes(scene)) {
    return (
      <>
        <Decor playing={false} />
        <LanguageToggle className="ds-toggle" />
        <main className="ds-index" lang="en">
          <h1>Scenes</h1>
          <ul>
            {IDS.map((id) => (
              <li key={id}>
                <a href={`?scene=${id}`}>
                  {id}
                  <small>{config.timeline.scenes.find((s) => s.id === id)?.durationMs ?? ''}</small>
                </a>
              </li>
            ))}
          </ul>
        </main>
      </>
    );
  }

  return (
    <>
      <Decor playing={scene !== 'gate'} />
      <LanguageToggle className="ds-toggle" />
      {scene !== 'gate' && <AudioControl audio={mockAudio} />}
      {scene === 'gate' && <SceneGate onOpen={() => go('opening')} />}
      {sceneComponents[scene] && <TimedScene id={scene} runKey={runKey} />}
      {scene === 'final' && <SceneFinal onReplay={() => go('opening')} />}
    </>
  );
}

export default function ScenesDevPage() {
  const css = useMemo(() => <style>{CSS}</style>, []);
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        {css}
        <LangFromQuery />
        <Picker />
      </LanguageProvider>
    </MotionConfig>
  );
}
