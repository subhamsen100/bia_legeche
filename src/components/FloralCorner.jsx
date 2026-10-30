import { memo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useParallax } from '../hooks/useParallax.js';
import { FloraDefs, Garland, Lotus, RajStalk, U, useSvgId } from '../assets/svg/flora.jsx';
import styles from './FloralCorner.module.css';

const LEAVES = [
  [44, 6, 8, 2.6, 'lf'],
  [6, 44, 82, 2.6, 'lf'],
  [86, 30, 24, 2.2, 'll'],
  [30, 86, 66, 2.2, 'll'],
  [60, 40, 40, 2, 'lf'],
  [40, 60, 50, 2, 'lf'],
];

const SHIULI_SPOTS = [
  [74, 74, 12, 1.6, 'sh'],
  [104, 52, 200, 1.25, 'shs'],
  [52, 104, 300, 1.25, 'sh'],
  [128, 22, 40, 1.05, 'sh'],
  [22, 128, 130, 1.05, 'shs'],
  [96, 94, 70, 0.95, 'shs'],
  [168, 92, 15, 0.9, 'sh'],
  [92, 168, 250, 0.9, 'shs'],
  [214, 34, 60, 0.8, 'shs'],
  [34, 214, 160, 0.8, 'sh'],
];

/* rice-paste dot arc just outside the garland */
const DOTS = Array.from({ length: 13 }, (_, i) => {
  const a = ((6 + i * 6.5) * Math.PI) / 180;
  return [Math.round(Math.cos(a) * 214 * 10) / 10, Math.round(Math.sin(a) * 214 * 10) / 10];
});

function CornerArt({ id }) {
  return (
    <svg className={styles.svg} viewBox="0 0 260 260" focusable="false">
      <FloraDefs id={id} />
      {/* alpona: dotted arc + curls */}
      <g fill="#C9A24B" opacity=".75">
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.1 : 1.9} />
        ))}
      </g>
      <g fill="none" stroke="#C9A24B" strokeWidth="1.1" strokeLinecap="round" opacity=".8">
        <path d="M0 238C18 236 30 226 27 214C25 206 15 207 16 214C17 219 23 219 23 215" />
        <path d="M238 0C236 18 226 30 214 27C206 25 207 15 214 16C219 17 219 23 215 23" />
      </g>

      {/* lotus pad tucked in the corner */}
      <path d="M0 58A58 58 0 0 0 58 0L0 0Z" fill="#5E8A62" />
      <path d="M0 0L42 40M0 0L55 16M0 0L16 55M0 0L50 30M0 0L30 50" stroke="#2C4F35" strokeWidth=".8" opacity=".45" />

      {LEAVES.map(([x, y, r, s, k], i) => (
        <U key={i} id={id} k={k} x={x} y={y} r={r} s={s} />
      ))}

      <RajStalk id={id} p0={[26, 20]} c={[84, 24]} p2={[146, 62]} n={7} seed={4} w={1.4} fs={1.9} />
      <RajStalk id={id} p0={[20, 26]} c={[24, 84]} p2={[62, 146]} n={7} seed={8} w={1.4} fs={1.9} />

      <Garland id={id} p0={[204, 0]} c={[140, 140]} p2={[0, 204]} n={19} s={0.95} leafEvery={3} />

      {SHIULI_SPOTS.map(([x, y, r, s, k], i) => (
        <U key={i} id={id} k={k} x={x} y={y} r={r} s={s} />
      ))}

      <U id={id} k="mr" x={104} y={12} r={20} s={1.1} />
      <U id={id} k="mr" x={12} y={104} r={70} s={1.1} />
      <U id={id} k="mo" x={68} y={18} r={10} s={1.55} />
      <U id={id} k="my" x={18} y={68} r={50} s={1.55} />
      <Lotus id={id} x={16} y={16} r={135} s={1.9} />
    </svg>
  );
}

function PendantArt({ id }) {
  return (
    <svg className={styles.svg} viewBox="0 0 30 110" focusable="false">
      <FloraDefs id={id} />
      <path d="M15 0V74" stroke="#A3812F" strokeWidth=".8" />
      <U id={id} k="mo" x={15} y={10} r={20} s={0.72} />
      <U id={id} k="my" x={15} y={24} r={80} s={0.72} />
      <U id={id} k="mo" x={15} y={38} r={140} s={0.7} />
      <U id={id} k="mr" x={15} y={52} r={10} s={0.66} />
      <U id={id} k="rf" x={15} y={62} r={160} s={1.1} />
      <U id={id} k="rf" x={15} y={62} r={200} s={1.1} />
      <U id={id} k="rf" x={15} y={63} r={180} s={1.25} />
      <U id={id} k="sh" x={15} y={62} r={0} s={0.85} />
    </svg>
  );
}

/**
 * FloralCorner — fixed corner garland (marigold mala, rajanigandha stalks,
 * shiuli, lotus) with a slow CSS sway and scroll/tilt parallax.
 */
export const FloralCorner = memo(function FloralCorner({ position = 'tl', size }) {
  const reduced = useReducedMotionConfig();
  const { x, y } = useParallax(10);
  const id = useSvgId('fc');
  const pid = useSvgId('fp');
  const top = position === 'tl' || position === 'tr';
  const dim = size == null ? undefined : typeof size === 'number' ? `${size}px` : size;

  return (
    <motion.div
      className={`${styles.corner} ${styles[position] || styles.tl}`}
      style={{ x, y, ...(dim ? { '--corner-size': dim } : null) }}
      aria-hidden="true"
      data-reduced-motion={reduced ? 'true' : undefined}
    >
      <div className={styles.mirror}>
        <div className={`${styles.sway} ${reduced ? '' : styles.animate}`}>
          <CornerArt id={id} />
          {top && (
            <div className={`${styles.pendant} ${reduced ? '' : styles.animate}`}>
              <PendantArt id={pid} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default FloralCorner;
