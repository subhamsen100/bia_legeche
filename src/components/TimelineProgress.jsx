import { useEffect, useMemo } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import config from '../config.js';
import styles from './TimelineProgress.module.css';

/* ==========================================================================
   TimelineProgress: a thin vine that grows left -> right along the bottom of
   the viewport as the guided sequence plays. Leaves sprout as the stem passes
   them, small gold blossoms mark scene boundaries, and a marigold bud rides
   the growing tip. role="progressbar", data-no-skip, safe-area aware.
   Hidden unless timeline.phase === 'playing'.
   ========================================================================== */

// Geometry in px of the vine's own coordinate system (the SVG is stretched
// horizontally only, so vertical positions are real pixels).
const H = 28; // track height
const STEM_Y = 18; // stem centre line
const AMP = 2; // wave amplitude
const CYCLES = 7; // wave cycles across the full width
const LEAF_COUNT = 20;

function stemY(frac) {
  return STEM_Y + AMP * Math.sin(frac * Math.PI * 2 * CYCLES);
}

const STEM_PATH = (() => {
  const pts = [];
  const steps = 280;
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    pts.push(`${(f * 1000).toFixed(1)},${stemY(f).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
})();

const LEAVES = Array.from({ length: LEAF_COUNT }, (_, i) => {
  const at = (i + 0.6) / (LEAF_COUNT + 0.2);
  return { at, up: i % 2 === 0, y: stemY(at) };
});

function pairLabel(pair) {
  if (!pair) return undefined;
  return pair.en || pair.bn || undefined;
}

function Leaf({ up, reduced }) {
  const rotate = up ? -38 : 32;
  return (
    <motion.span
      className={styles.leaf}
      aria-hidden="true"
      style={{ originX: 0, originY: 0.5 }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0, rotate: rotate * 0.3 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate }}
      transition={
        reduced ? { duration: 0.3 } : { type: 'spring', stiffness: 260, damping: 16, mass: 0.6 }
      }
    >
      <svg viewBox="0 0 14 8" width="14" height="8" focusable="false">
      <path d="M0.5 4 C3.5 -0.6 10 -0.4 13.5 4 C10 8.4 3.5 8.6 0.5 4 Z" fill="var(--leaf)" />
      <path d="M1.5 4 L11.5 4" stroke="var(--leaf-300)" strokeWidth="0.7" strokeLinecap="round" />
      </svg>
    </motion.span>
  );
}

function Blossom({ reduced }) {
  return (
    <motion.span
      className={styles.blossom}
      aria-hidden="true"
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0, rotate: -60 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
      transition={reduced ? { duration: 0.3 } : { type: 'spring', stiffness: 220, damping: 14 }}
    >
      <svg viewBox="-6 -6 12 12" width="11" height="11" focusable="false">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-3" rx="1.9" ry="2.7" fill="var(--gold)" transform={`rotate(${a})`} />
      ))}
      <circle r="1.6" fill="var(--marigold)" />
      </svg>
    </motion.span>
  );
}

export function TimelineProgress({ timeline, label, className }) {
  const reduced = useReducedMotion();
  const { phase, progress } = timeline;
  const runId = timeline.runId ?? 0;
  const scenes = timeline.scenes || config.timeline.scenes;

  // Prefer the per-frame MotionValue from useTimeline; fall back to the
  // (~10Hz) numeric progress if a caller passes a plain object.
  const fallback = useMotionValue(progress || 0);
  useEffect(() => {
    fallback.set(progress || 0);
  }, [fallback, progress]);
  const mv = timeline.progressMotion || fallback;

  const clip = useTransform(mv, (v) => `inset(-6px ${((1 - v) * 100).toFixed(3)}% -6px -2px)`);
  const tipX = useTransform(mv, (v) => `${((v - 1) * 100).toFixed(3)}%`);
  const tipY = useTransform(mv, (v) => stemY(v) - STEM_Y);

  // Scene boundaries (cumulative fractions, excluding 0 and 1).
  const boundaries = useMemo(() => {
    const total = scenes.reduce((sum, s) => sum + (Number(s.durationMs) || 0), 0);
    if (!total) return [];
    const out = [];
    let acc = 0;
    for (let i = 0; i < scenes.length - 1; i += 1) {
      acc += Number(scenes[i].durationMs) || 0;
      out.push(acc / total);
    }
    return out;
  }, [scenes]);

  const ariaLabel = label || pairLabel(config.ui && config.ui.progress);
  const pct = Math.round(Math.min(1, Math.max(0, progress || 0)) * 100);

  return (
    <AnimatePresence>
      {phase === 'playing' ? (
        <motion.div
          key="vine"
          className={className ? `${styles.root} ${className}` : styles.root}
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          data-no-skip=""
          data-timeline-progress=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.track} style={{ height: H }}>
            {/* faint guide showing the path still to grow */}
            <svg
              className={styles.svg}
              viewBox={`0 0 1000 ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path d={STEM_PATH} className={styles.guide} vectorEffect="non-scaling-stroke" />
            </svg>

            <motion.div className={styles.grown} style={{ clipPath: clip, WebkitClipPath: clip }}>
              <svg
                className={styles.svg}
                viewBox={`0 0 1000 ${H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <path d={STEM_PATH} className={styles.stemShadow} vectorEffect="non-scaling-stroke" />
                <path d={STEM_PATH} className={styles.stem} vectorEffect="non-scaling-stroke" />
              </svg>
            </motion.div>

            {LEAVES.map((leaf, i) =>
              progress >= leaf.at ? (
                <span
                  key={`${runId}-l${i}`}
                  className={styles.leafSlot}
                  style={{ left: `${leaf.at * 100}%`, top: leaf.y }}
                >
                  <Leaf up={leaf.up} reduced={reduced} />
                </span>
              ) : null,
            )}

            {boundaries.map((at, i) =>
              progress >= at ? (
                <span
                  key={`${runId}-b${i}`}
                  className={styles.blossomSlot}
                  style={{ left: `${at * 100}%`, top: stemY(at) }}
                >
                  <Blossom reduced={reduced} />
                </span>
              ) : null,
            )}

            <motion.div className={styles.tipRail} style={{ x: tipX, y: tipY }} aria-hidden="true">
              <span className={styles.tip} style={{ top: STEM_Y }} data-vine-tip="">
                <svg viewBox="-7 -8 14 14" width="14" height="14" focusable="false">
                  <path d="M-5.5 2 C-5 -1 -2 -2 0 -1 C2 -2 5 -1 5.5 2 C3 1 -3 1 -5.5 2 Z" fill="var(--leaf)" />
                  <path d="M0 -7 C3.6 -4.6 3.8 0.6 0 1.6 C-3.8 0.6 -3.6 -4.6 0 -7 Z" fill="var(--marigold)" />
                  <path d="M0 -6 C1.3 -4 1.3 -1 0 0.8" stroke="var(--marigold-700)" strokeWidth="0.6" fill="none" />
                </svg>
              </span>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default TimelineProgress;
