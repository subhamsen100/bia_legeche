/* Dev harness for the timeline engine: /dev/timeline  (?speed=10 for fast mode)
   Stub scenes are coloured panels using the REAL config durations. Dev-only
   copy is intentionally hardcoded here (this page is not part of the invite). */
import { useEffect, useState } from 'react';
import config from '../config.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { TimelineStage } from '../components/TimelineStage.jsx';
import { TimelineProgress } from '../components/TimelineProgress.jsx';
import { TimelineSkipHint } from '../components/TimelineSkipHint.jsx';

const COLORS = ['#7A1F2B', '#C9A24B', '#3E6B48', '#F2A900', '#A8505B', '#2C4F35', '#C98A00'];

function initialSpeed() {
  const q = Number(new URLSearchParams(window.location.search).get('speed'));
  return Number.isFinite(q) && q > 0 ? q : 1;
}

const btn = {
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid var(--gold)',
  background: 'var(--ivory-50)',
  color: 'var(--maroon)',
  fontSize: 13,
  lineHeight: 1.2,
  minHeight: 32,
};

function StubScene({ scene, index, sceneElapsedMs, durationMs, onInnerClick, innerClicks }) {
  const bg = COLORS[index % COLORS.length];
  return (
    <section
      data-stub-scene={scene.id}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 16,
        padding: 24,
        background: `radial-gradient(circle at 50% 40%, ${bg}33, ${bg}99)`,
        color: 'var(--maroon-900)',
        textAlign: 'center',
      }}
    >
      <h1 lang="en" style={{ fontSize: 'var(--fs-2xl)' }}>
        {index + 1}. {scene.id}
      </h1>
      <p lang="en" data-testid="scene-clock" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {(sceneElapsedMs / 1000).toFixed(1)}s / {(durationMs / 1000).toFixed(1)}s
      </p>
      <div
        data-no-skip=""
        data-testid="no-skip-zone"
        style={{
          padding: '14px 18px',
          border: '2px dashed var(--maroon)',
          borderRadius: 12,
          background: 'rgba(255,248,236,0.7)',
        }}
      >
        <span lang="en">[data-no-skip] zone: tapping here does not skip</span>
      </div>
      <button type="button" style={btn} data-testid="inner-button" onClick={onInnerClick}>
        inner button (clicks: {innerClicks})
      </button>
      <p lang="en" style={{ fontSize: 13, opacity: 0.75 }}>Tap anywhere else to skip</p>
    </section>
  );
}

export default function TimelineDev() {
  const [speed, setSpeed] = useState(initialSpeed);
  const [innerClicks, setInnerClicks] = useState(0);
  const tl = useTimeline(config.timeline.scenes, { speed });

  // Expose a read-only snapshot for playwright checks.
  useEffect(() => {
    window.__timeline = {
      phase: tl.phase,
      index: tl.index,
      sceneId: tl.scene ? tl.scene.id : null,
      sceneElapsedMs: tl.sceneElapsedMs,
      totalElapsedMs: tl.totalElapsedMs,
      totalMs: tl.totalMs,
      progress: tl.progress,
      paused: tl.paused,
      runId: tl.runId,
      innerClicks,
    };
  });

  const panel = (
    <div
      data-no-skip=""
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 'var(--z-overlay)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        background: 'rgba(255,248,236,0.92)',
        boxShadow: 'var(--shadow-sm)',
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <button type="button" style={btn} data-testid="btn-start" onClick={tl.start}>start</button>
      <button type="button" style={btn} data-testid="btn-skip" onClick={tl.skip}>skip</button>
      <button type="button" style={btn} data-testid="btn-replay" onClick={tl.replay}>replay</button>
      <button type="button" style={btn} data-testid="btn-finish" onClick={tl.finish}>finish</button>
      <label style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <input
          type="checkbox"
          data-testid="fast"
          checked={speed === 10}
          onChange={(e) => setSpeed(e.target.checked ? 10 : 1)}
        />
        fast x10
      </label>
      <code data-testid="status" lang="en" style={{ fontSize: 11 }}>
        {tl.phase} | #{tl.index} {tl.scene ? tl.scene.id : '-'} | scene {(tl.sceneElapsedMs / 1000).toFixed(1)}s | total{' '}
        {(tl.totalElapsedMs / 1000).toFixed(1)}/{(tl.totalMs / 1000).toFixed(0)}s | {Math.round(tl.progress * 100)}% | run {tl.runId}
        {tl.paused ? ' | PAUSED' : ''}
      </code>
    </div>
  );

  if (tl.phase === 'gate') {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        {panel}
        <button
          type="button"
          data-testid="gate"
          onClick={tl.start}
          style={{ ...btn, fontSize: 20, padding: '16px 28px' }}
        >
          Open (gate)
        </button>
      </main>
    );
  }

  if (tl.phase === 'final') {
    return (
      <main data-testid="final" style={{ padding: '96px 24px', minHeight: '250vh' }}>
        {panel}
        <h1 lang="en">Final page (free scroll)</h1>
        <p lang="en">This page is 250vh tall to verify that scrolling is unlocked.</p>
        <button type="button" style={{ ...btn, marginTop: 16 }} data-testid="final-replay" onClick={tl.replay}>
          Replay
        </button>
      </main>
    );
  }

  return (
    <>
      {panel}
      <TimelineStage
        timeline={tl}
        renderScene={(scene, { sceneElapsedMs, durationMs }) => (
          <StubScene
            scene={scene}
            index={tl.scenes.indexOf(scene)}
            sceneElapsedMs={sceneElapsedMs}
            durationMs={durationMs}
            innerClicks={innerClicks}
            onInnerClick={() => setInnerClicks((n) => n + 1)}
          />
        )}
      />
      <TimelineProgress timeline={tl} label="Progress (dev)" />
      <TimelineSkipHint timeline={tl}>
        <span lang="en">tap to skip (dev hint)</span>
      </TimelineSkipHint>
    </>
  );
}
