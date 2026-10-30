import { memo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useSvgId } from '../assets/svg/flora.jsx';
import styles from './ShankhRipple.module.css';

function Conch() {
  const id = useSvgId('sr');
  return (
    <svg className={styles.conch} viewBox="0 0 120 90" focusable="false">
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".65" stopColor="#FBF1E1" />
          <stop offset="1" stopColor="#EAD3B4" />
        </linearGradient>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F4A261" />
          <stop offset="1" stopColor="#F6C9CF" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="80" rx="42" ry="4" fill="#7A1F2B" opacity=".12" />
      <g transform="rotate(-10 60 45)">
        {/* body with canal (left) and stepped spire (right) */}
        <path
          d="M6 54C18 46 28 30 48 23C64 17 82 20 92 27L99 26Q104 29 101 32L107 32Q111 35 107 38L115 40L106 44Q101 50 92 53C80 64 58 70 40 66C28 63 16 59 6 54Z"
          fill={`url(#${id}-s)`}
          stroke="#7A1F2B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* aperture / mouth */}
        <path d="M14 55C30 62 54 66 74 59C58 57 36 55 14 55Z" fill={`url(#${id}-m)`} stroke="#7A1F2B" strokeWidth="1.1" strokeLinejoin="round" />
        {/* whorls on the spire */}
        <path d="M92 27Q96 35 92 45M99 29Q101 35 99 41M106 33Q108 37 106 40" fill="none" stroke="#C9A24B" strokeWidth="1.1" strokeLinecap="round" />
        {/* coil ridges */}
        <path d="M80 22Q88 38 80 56M66 19Q76 38 66 62M52 22Q60 38 52 64" fill="none" stroke="#E0C78A" strokeWidth="1.1" strokeLinecap="round" />
        {/* shoulder knobs */}
        <g fill="#FFFCF6" stroke="#7A1F2B" strokeWidth=".8">
          <circle cx="58" cy="20.4" r="2" />
          <circle cx="71" cy="19.4" r="2" />
          <circle cx="83" cy="22" r="1.8" />
        </g>
        {/* gold cap band near the canal */}
        <path d="M24 42Q20 50 26 60" fill="none" stroke="#C9A24B" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 37Q25 49 31 62" fill="none" stroke="#C9A24B" strokeWidth="1" strokeLinecap="round" />
        <g fill="#7A1F2B">
          <circle cx="22.6" cy="47" r=".9" />
          <circle cx="23" cy="54" r=".9" />
        </g>
        {/* sindoor tilak */}
        <path d="M70 34Q72 40 70 46Q68 40 70 34Z" fill="#B8432A" />
        <circle cx="70" cy="49" r="1.4" fill="#F2A900" />
      </g>
    </svg>
  );
}

/**
 * ShankhRipple — conch shell with concentric ulu-dhwani ripple rings and
 * sound arcs from the mouth (visual only). Rings are HTML circles animated
 * with transform/opacity (compositor-only). Reduced motion: static faint rings.
 */
export const ShankhRipple = memo(function ShankhRipple({ play = true }) {
  const reduced = useReducedMotionConfig();
  const live = play && !reduced;
  return (
    <motion.div
      className={`${styles.root} ${live ? styles.live : ''}`}
      aria-hidden="true"
      data-reduced-motion={reduced ? 'true' : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {(live || reduced) && (
        <>
          <span className={styles.ring} />
          <span className={styles.ring} />
          <span className={styles.ring} />
        </>
      )}
      <Conch />
      {live && (
        <svg className={styles.waves} viewBox="0 0 40 60" focusable="false">
          <g fill="none" stroke="#C9A24B" strokeWidth="2" strokeLinecap="round">
            <path className={styles.w1} d="M30 18Q22 30 30 42" />
            <path className={styles.w2} d="M22 11Q10 30 22 49" />
            <path className={styles.w3} d="M14 4Q-1 30 14 56" />
          </g>
        </svg>
      )}
    </motion.div>
  );
});

export default ShankhRipple;
