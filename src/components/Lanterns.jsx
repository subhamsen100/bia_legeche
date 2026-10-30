import { memo, useMemo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { rng } from '../assets/svg/paths.js';
import { useSvgId } from '../assets/svg/flora.jsx';
import styles from './Lanterns.module.css';

function LanternDefs({ id }) {
  return (
    <svg className={styles.sprite} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B8432A" />
          <stop offset=".45" stopColor="#EC8A1C" />
          <stop offset="1" stopColor="#FFE08A" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#FFD873" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFD873" stopOpacity="0" />
        </radialGradient>
        <g id={`${id}-l`}>
          <circle cx="16" cy="26" r="16" fill={`url(#${id}-halo)`} />
          <path d="M7 6Q16 0 25 6L22.6 33Q16 35.4 9.4 33Z" fill={`url(#${id}-body)`} />
          <path d="M12 4.4Q12.6 19 12.7 34M20 4.4Q19.4 19 19.3 34M16 3V34.7" fill="none" stroke="#9A3A1F" strokeWidth=".5" opacity=".45" />
          <path d="M7.3 8.6Q16 5 24.7 8.6" fill="none" stroke="#7A1F2B" strokeWidth=".8" opacity=".6" />
          <path d="M9.4 33Q16 35.4 22.6 33" fill="none" stroke="#7A1F2B" strokeWidth="1.1" />
          <ellipse cx="16" cy="36.6" rx="1.5" ry="2.2" fill="#FFF4C2" />
          <ellipse cx="16" cy="37" rx=".7" ry="1.1" fill="#F2A900" />
        </g>
      </defs>
    </svg>
  );
}

/**
 * Lanterns — sky lanterns (fanush) rising through the parent box (absolute fill).
 * Reduced motion: lanterns hang still and simply fade in.
 */
export const Lanterns = memo(function Lanterns({ count = 6 }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('ln');
  const n = Math.max(0, Math.min(14, count | 0));
  const items = useMemo(() => {
    const R = rng(73 + n);
    return Array.from({ length: n }, (_, i) => {
      const depth = R();
      const w = 18 + depth * 22;
      return {
        w,
        style: {
          left: `${(((i + 0.15 + R() * 0.7) / n) * 92 + 2).toFixed(1)}%`,
          '--w': `${w.toFixed(0)}px`,
          '--rise': `${(17 - depth * 6 + R() * 3).toFixed(1)}s`,
          '--dl': `${(-R() * 16).toFixed(1)}s`,
          '--bob': `${(2.6 + R() * 1.6).toFixed(1)}s`,
          '--o': (0.55 + depth * 0.45).toFixed(2),
          '--sy': `${(20 + R() * 60).toFixed(0)}%`,
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
        transition={{ duration: 1 }}
      >
        <LanternDefs id={id} />
        {items.map((it, i) => (
          <span key={i} className={styles.still} style={it.style}>
            <svg viewBox="0 0 32 42" className={styles.glyph} focusable="false">
              <use href={`#${id}-l`} />
            </svg>
          </span>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={styles.layer} aria-hidden="true">
      <LanternDefs id={id} />
      {items.map((it, i) => (
        <span key={i} className={styles.rise} style={it.style}>
          <span className={styles.bob}>
            <svg viewBox="0 0 32 42" className={styles.glyph} focusable="false">
              <use href={`#${id}-l`} />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
});

export default Lanterns;
