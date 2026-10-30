import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion';
import config from '../config.js';
import styles from './TimelineStage.module.css';

/* ==========================================================================
   TimelineStage: full-viewport stage that crossfades the timed scenes.
   - Outgoing and incoming scenes overlap as absolutely positioned layers for
     config.timeline.crossfadeMs (AnimatePresence mode="sync").
   - Tap/click anywhere skips to the next scene, EXCEPT inside [data-no-skip]
     or on interactive elements. Keyboard (focus on the stage): Space, Enter,
     ArrowRight skip; Escape finishes.
   - Reduced motion: plain opacity fade.
   ========================================================================== */

const NO_SKIP_SELECTOR = [
  '[data-no-skip]',
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[contenteditable]',
].join(',');

function isExcluded(target, stageEl) {
  if (!(target instanceof Element)) return false;
  const hit = target.closest(NO_SKIP_SELECTOR);
  // Only exclusions inside the stage count (the stage itself is never one).
  return Boolean(hit && hit !== stageEl && stageEl && stageEl.contains(hit));
}

function SceneLayer({ children, reduced, fadeSec }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      className={styles.layer}
      data-scene-layer={isPresent ? 'active' : 'exiting'}
      aria-hidden={isPresent ? undefined : true}
      style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
      transition={{ duration: fadeSec, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function TimelineStage({ timeline, renderScene, className, autoFocus = true }) {
  const stageRef = useRef(null);
  const reduced = useReducedMotion();
  const fadeSec = Math.max(0, Number(config.timeline.crossfadeMs) || 0) / 1000;

  const { phase, scene, sceneElapsedMs, skip, finish } = timeline;
  const runId = timeline.runId ?? 0;

  // Move focus to the stage when it appears so keyboard skipping works right
  // after the gate. The gate button may still hold focus while its exit fade
  // runs and then unmount, dropping focus to <body>; so re-check after the
  // crossfade and on focusout. Only "orphaned" focus is taken (body, a
  // detached node, or the gate button), never a real control.
  useEffect(() => {
    if (!autoFocus) return undefined;
    const claim = () => {
      const stage = stageRef.current;
      if (!stage || !stage.isConnected) return;
      const active = document.activeElement;
      const orphaned =
        !active ||
        active === document.body ||
        active === document.documentElement ||
        !active.isConnected ||
        Boolean(active.closest && active.closest('[data-gate-button]'));
      if (orphaned && active !== stage) stage.focus({ preventScroll: true });
    };
    claim();
    const crossMs = Math.max(0, Number(config.timeline.crossfadeMs) || 0);
    const timers = [crossMs + 100, crossMs + 600].map((ms) => window.setTimeout(claim, ms));
    let raf = 0;
    const onFocusOut = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(claim); // after the blur settles (activeElement updated)
    };
    document.addEventListener('focusout', onFocusOut);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [autoFocus]);

  const onClick = useCallback(
    (e) => {
      if (isExcluded(e.target, stageRef.current)) return;
      skip();
    },
    [skip],
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'ArrowRight') return;
      // Space/Enter on a focused button inside a scene must activate that button.
      if (e.target !== stageRef.current && isExcluded(e.target, stageRef.current)) return;
      e.preventDefault();
      if (!e.repeat) skip();
    },
    [skip, finish],
  );

  const durationMs = scene ? scene.durationMs : 0;

  return (
    <div
      ref={stageRef}
      className={className ? `${styles.stage} ${className}` : styles.stage}
      data-timeline-stage=""
      data-phase={phase}
      data-scene-id={scene ? scene.id : undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <AnimatePresence mode="sync" initial>
        {phase === 'playing' && scene ? (
          <SceneLayer key={`${runId}:${scene.id}`} reduced={reduced} fadeSec={fadeSec}>
            {renderScene(scene, { sceneElapsedMs, durationMs })}
          </SceneLayer>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default TimelineStage;
