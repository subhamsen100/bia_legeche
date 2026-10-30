import { memo, useMemo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { FloraDefs, useSvgId } from '../assets/svg/flora.jsx';
import { MARIGOLD_PETAL, rng } from '../assets/svg/paths.js';
import styles from './Petals.module.css';

/* kind -> sprite piece + transform inside a -12..12 viewBox */
const KINDS = [
  { k: 'shs', t: 'scale(1.05)' },
  { k: 'mpo', t: 'translate(0 5)' },
  { k: 'rf', t: 'translate(0 9.5) scale(1.15)' },
  { k: 'sh', t: 'scale(1.05)' },
  { k: 'mpy', t: 'translate(0 5)' },
  { k: 'shs', t: 'rotate(120) scale(1.05)' },
  { k: 'mpr', t: 'translate(0 5)' },
  { k: 'rf', t: 'translate(1 9.5) rotate(10) scale(1.15)' },
];

const STATIC_SPOTS = [
  [6, 18, 30],
  [91, 12, 200],
  [14, 82, 110],
  [86, 74, 300],
  [48, 94, 60],
  [70, 30, 150],
];

function PetalSprite({ id }) {
  return (
    <svg className={styles.sprite} aria-hidden="true" focusable="false">
      <FloraDefs id={id} />
      <defs>
        {[
          ['mpo', '#EC7E12', '#B4510A', '#F9B53A'],
          ['mpy', '#F5B415', '#C98A00', '#FDDB6A'],
          ['mpr', '#CF5428', '#86291A', '#F09452'],
        ].map(([k, fill, edge, light]) => (
          <g key={k} id={`${id}-${k}`}>
            <path d={MARIGOLD_PETAL} fill={fill} stroke={edge} strokeWidth=".4" />
            <path d="M0-1.5Q-2.6-5-3.4-9.4M0-1.5Q0-6 .1-10M0-1.5Q2.6-5 3.6-9.4" fill="none" stroke={edge} strokeWidth=".35" opacity=".55" />
            <path d="M-3.8-9.6Q-1.6-11.2 0-9.8Q1.8-11.2 4-9.4" fill="none" stroke={light} strokeWidth=".7" opacity=".9" />
          </g>
        ))}
      </defs>
    </svg>
  );
}

function PetalGlyph({ id, kind }) {
  return (
    <svg className={styles.glyph} viewBox="-12 -12 24 24" focusable="false">
      <use href={`#${id}-${kind.k}`} transform={kind.t} />
    </svg>
  );
}

/**
 * Petals — fixed full-viewport layer of drifting shiuli, rajanigandha and
 * marigold petals. Pure CSS keyframes on transform (fall + sway/flutter).
 * Reduced motion: a few static petals that simply fade in.
 */
export const Petals = memo(function Petals({ count = 24 }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('pt');
  const n = Math.max(0, Math.min(30, count | 0));

  const petals = useMemo(() => {
    const R = rng(1987 + n);
    return Array.from({ length: n }, (_, i) => {
      const size = 13 + R() * 11;
      return {
        kind: KINDS[i % KINDS.length],
        style: {
          left: `${(((i + R() * 0.8) / n) * 100).toFixed(2)}%`,
          '--size': `${size.toFixed(1)}px`,
          '--fall': `${(11 + R() * 8 + (24 - size) * 0.25).toFixed(2)}s`,
          '--delay': `${(R() * 11).toFixed(2)}s`,
          '--sway': `${(1.6 + R() * 1.8).toFixed(2)}s`,
          '--sx': `${(14 + R() * 26).toFixed(0)}px`,
          '--r0': `${(R() * 360).toFixed(0)}deg`,
          '--r1': `${(R() * 360 + 120).toFixed(0)}deg`,
          '--ry': `${(R() * 140 - 70).toFixed(0)}deg`,
          '--o': (0.72 + R() * 0.28).toFixed(2),
        },
      };
    });
  }, [n]);

  if (!n) return null;

  if (reduced) {
    return (
      <motion.div
        className={styles.layer}
        aria-hidden="true"
        data-reduced-motion="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <PetalSprite id={id} />
        {STATIC_SPOTS.slice(0, Math.min(6, n)).map(([x, y, r], i) => (
          <span
            key={i}
            className={styles.still}
            style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, '--size': '16px' }}
          >
            <PetalGlyph id={id} kind={KINDS[i % KINDS.length]} />
          </span>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={styles.layer} aria-hidden="true">
      <PetalSprite id={id} />
      {petals.map((p, i) => (
        <span key={i} className={styles.fall} style={p.style}>
          <span className={styles.sway}>
            <PetalGlyph id={id} kind={p.kind} />
          </span>
        </span>
      ))}
    </div>
  );
});

export default Petals;
