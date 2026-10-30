import { memo, useMemo } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { rng } from '../assets/svg/paths.js';
import styles from './Fireflies.module.css';

/**
 * Fireflies — fixed ambient layer of warm glowing dots that drift and twinkle.
 * Glow is a radial-gradient (no filters). Reduced motion: dim, static dots.
 */
export const Fireflies = memo(function Fireflies({ count = 10 }) {
  const reduced = useReducedMotionConfig();
  const n = Math.max(0, Math.min(24, count | 0));
  const flies = useMemo(() => {
    const R = rng(411 + n);
    return Array.from({ length: n }, (_, i) => ({
      left: `${(4 + ((i + R()) / n) * 92).toFixed(1)}%`,
      top: `${(18 + R() * 74).toFixed(1)}%`,
      '--d': `${(9 + R() * 8).toFixed(1)}s`,
      '--t': `${(2.2 + R() * 2.4).toFixed(1)}s`,
      '--dl': `${(-R() * 12).toFixed(1)}s`,
      '--x1': `${(R() * 70 - 35).toFixed(0)}px`,
      '--y1': `${(R() * -60 - 10).toFixed(0)}px`,
      '--x2': `${(R() * 90 - 45).toFixed(0)}px`,
      '--y2': `${(R() * 50 - 25).toFixed(0)}px`,
      '--sz': `${(9 + R() * 7).toFixed(0)}px`,
    }));
  }, [n]);

  if (!n) return null;
  return (
    <div className={`${styles.layer} ${reduced ? styles.still : ''}`} aria-hidden="true" data-reduced-motion={reduced ? 'true' : undefined}>
      {flies.map((s, i) => (
        <span key={i} className={styles.fly} style={s}>
          <span className={styles.glow} />
        </span>
      ))}
    </div>
  );
});

export default Fireflies;
