import { memo } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { KOLKA_HEART_L, KOLKA_HEART_R, KOLKA_HEART_INNER } from '../assets/svg/paths.js';
import styles from './KolkaHeart.module.css';

const FILL =
  'M50 90C36 80 10 64 10 40C10 22 24 11 37 14C46 16.5 50 24 50 30C50 24 54 16.5 63 14C76 11 90 22 90 40C90 64 64 80 50 90Z';

/**
 * KolkaHeart — a heart formed by two mirrored kolka (paisley) curls that
 * draws itself (stroke-dash), then fills softly; `bounce` adds a gentle
 * heartbeat loop. `draw=false` renders it already drawn.
 * Reduced motion: drawn instantly with a short opacity fade, no bounce.
 */
export const KolkaHeart = memo(function KolkaHeart({ draw = true, bounce = false, delay = 0, size = 64 }) {
  const reduced = useReducedMotionConfig();
  const anim = draw && !reduced;
  const px = typeof size === 'number' ? `${size}px` : size;
  const cls = [styles.root, anim ? styles.anim : '', reduced ? styles.fade : '', bounce && !reduced ? styles.bounce : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={cls}
      style={{ '--kh-size': px, '--kh-delay': `${anim ? delay : 0}s` }}
      aria-hidden="true"
      data-reduced-motion={reduced ? 'true' : undefined}
    >
      <svg viewBox="0 0 100 100" className={styles.svg} focusable="false" key={anim ? 'a' : 's'}>
        <path className={styles.fill} d={FILL} fill="#FDEFC4" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className={styles.stroke} d={KOLKA_HEART_L} pathLength="1" stroke="#7A1F2B" strokeWidth="3.2" />
          <path className={styles.stroke} d={KOLKA_HEART_R} pathLength="1" stroke="#7A1F2B" strokeWidth="3.2" />
          <path className={`${styles.stroke} ${styles.late}`} d={KOLKA_HEART_INNER} pathLength="1" stroke="#C9A24B" strokeWidth="1.6" />
        </g>
        <g className={styles.dots} fill="#F2A900">
          <circle cx="50" cy="96" r="2.4" />
          <circle cx="50" cy="44" r="2" />
          <circle cx="50" cy="52" r="1.3" />
          <circle cx="4.5" cy="40" r="1.5" />
          <circle cx="95.5" cy="40" r="1.5" />
        </g>
      </svg>
    </span>
  );
});

export default KolkaHeart;
