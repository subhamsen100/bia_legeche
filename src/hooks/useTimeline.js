import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import config from '../config.js';

/* ==========================================================================
   useTimeline: sequencing engine for the guided invitation.

   phase: 'gate' (untimed, before the tap) -> 'playing' (timed scenes from
   config.timeline.scenes) -> 'final' (free-scroll page).

   Clock: requestAnimationFrame + performance.now() deltas. Time accumulates
   only while the document is visible (visibilitychange); each frame delta is
   clamped so a throttled/background tab never jumps scenes. React state is
   committed at most ~10x/sec (plus immediately on every scene change); the
   per-frame progress is also pushed into a framer-motion MotionValue
   (`progressMotion`) so the progress vine can animate smoothly without
   re-rendering.

   All mutable clock state lives in a ref and is only mutated in event
   handlers / rAF callbacks (never in render or state updaters), so React 18
   StrictMode's double-invoked effects cannot double-advance the clock.
   ========================================================================== */

const COMMIT_INTERVAL_MS = 100; // ~10 re-renders per second
const MAX_FRAME_DT_MS = 250; // clamp per-frame delta (jank / throttling guard)

// Move to scene `index` (or to 'final' past the last scene). Mutates `s`.
function enterScene(s, index, list) {
  if (index >= list.length) {
    s.phase = 'final';
    s.index = Math.max(0, list.length - 1);
  } else {
    s.phase = 'playing';
    s.index = index;
  }
  s.sceneElapsedMs = 0;
}

function durationOf(scene) {
  const d = Number(scene && scene.durationMs);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/**
 * @param {Array<{id: string, durationMs: number}>} scenes timed scenes, in order
 * @param {{ speed?: number, lockScroll?: boolean }} [options]
 *   speed: dev-only clock multiplier (e.g. 10 for fast testing). Read live.
 *   lockScroll: lock html/body scroll while phase !== 'final' (default true).
 */
export function useTimeline(scenes = config.timeline.scenes, options = {}) {
  const { speed = 1, lockScroll = true } = options;

  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const speedRef = useRef(speed);
  speedRef.current = Number.isFinite(speed) && speed > 0 ? speed : 1;

  // Authoritative clock/sequence state (mutated imperatively).
  const stateRef = useRef({ phase: 'gate', index: 0, sceneElapsedMs: 0, runId: 0 });
  // Rendered snapshot of stateRef.
  const [snap, setSnap] = useState(() => ({ ...stateRef.current }));
  const [paused, setPaused] = useState(
    () => typeof document !== 'undefined' && document.hidden === true,
  );
  const progressMotion = useMotionValue(0);

  const computeTotals = useCallback((s) => {
    const list = scenesRef.current || [];
    let totalMs = 0;
    let before = 0;
    for (let i = 0; i < list.length; i += 1) {
      const d = durationOf(list[i]);
      if (i < s.index) before += d;
      totalMs += d;
    }
    let totalElapsedMs;
    if (s.phase === 'gate') totalElapsedMs = 0;
    else if (s.phase === 'final') totalElapsedMs = totalMs;
    else totalElapsedMs = Math.min(totalMs, before + s.sceneElapsedMs);
    const progress = totalMs > 0 ? totalElapsedMs / totalMs : s.phase === 'final' ? 1 : 0;
    return { totalMs, totalElapsedMs, progress };
  }, []);

  const commit = useCallback(() => {
    const s = stateRef.current;
    progressMotion.set(computeTotals(s).progress);
    setSnap({ ...s });
  }, [computeTotals, progressMotion]);

  /* ---------------- Controls (stable identities) ---------------- */

  const start = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'gate') return; // idempotent: a double tap on the gate does not restart
    enterScene(s, 0, scenesRef.current || []);
    commit();
  }, [commit]);

  const skip = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    enterScene(s, s.index + 1, scenesRef.current || []);
    commit();
  }, [commit]);

  const replay = useCallback(() => {
    const s = stateRef.current;
    s.runId += 1;
    enterScene(s, 0, scenesRef.current || []);
    commit();
  }, [commit]);

  const finish = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'final') return;
    s.phase = 'final';
    s.index = Math.max(0, (scenesRef.current || []).length - 1);
    s.sceneElapsedMs = 0;
    commit();
  }, [commit]);

  /* ---------------- Clock ---------------- */

  useEffect(() => {
    if (snap.phase !== 'playing') return undefined;

    let raf = 0;
    let last = performance.now();
    let lastCommit = last;

    const loop = () => {
      raf = 0;
      if (document.hidden) return; // resumed by the visibility handler
      const now = performance.now();
      const dt = Math.min(Math.max(now - last, 0), MAX_FRAME_DT_MS) * speedRef.current;
      last = now;

      const s = stateRef.current;
      if (s.phase !== 'playing') return;
      const list = scenesRef.current || [];

      s.sceneElapsedMs += dt;
      let advanced = false;
      while (s.phase === 'playing' && s.sceneElapsedMs >= durationOf(list[s.index])) {
        const carry = s.sceneElapsedMs - durationOf(list[s.index]);
        enterScene(s, s.index + 1, list);
        if (s.phase === 'playing') s.sceneElapsedMs = carry;
        advanced = true;
      }

      if (advanced || now - lastCommit >= COMMIT_INTERVAL_MS) {
        lastCommit = now;
        commit();
      } else {
        progressMotion.set(computeTotals(s).progress);
      }
      if (s.phase === 'playing') raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        setPaused(true);
      } else {
        last = performance.now(); // do not count the hidden period
        setPaused(false);
        if (!raf) raf = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    setPaused(document.hidden === true);
    if (!document.hidden) raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    // runId: replay while playing restarts the loop with a fresh `last`.
  }, [snap.phase, snap.runId, commit, computeTotals, progressMotion]);

  /* ---------------- Scroll lock ---------------- */

  const isFinal = snap.phase === 'final';
  useEffect(() => {
    if (!lockScroll) return undefined;
    if (isFinal) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    window.scrollTo(0, 0);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isFinal, lockScroll]);

  /* ---------------- Snapshot ---------------- */

  const list = scenes || [];
  const { totalMs, totalElapsedMs, progress } = computeTotals(snap);
  const scene = snap.phase === 'playing' ? list[snap.index] || null : null;

  return {
    phase: snap.phase,
    index: snap.index,
    scene,
    sceneElapsedMs: snap.phase === 'playing' ? snap.sceneElapsedMs : 0,
    totalElapsedMs,
    totalMs,
    progress,
    start,
    skip,
    replay,
    finish,
    // additive (beyond CONTRACTS section 6):
    runId: snap.runId, // increments on replay(); TimelineStage keys layers with it
    paused, // true while the document is hidden
    progressMotion, // MotionValue<number> 0..1, updated every frame
    scenes: list,
  };
}

export default useTimeline;
