import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { MARIGOLD_PETAL, SHIULI, rng } from '../assets/svg/paths.js';
import styles from './PetalBurst.module.css';

const SPARK = 'M0-5Q.6-.6 5 0Q.6 .6 0 5Q-.6 .6-5 0Q-.6-.6 0-5Z';

function Shiuli() {
  return (
    <g>
      {SHIULI.angles.map((a) => (
        <path key={a} d={SHIULI.petal} transform={`rotate(${a})`} fill="#fff" stroke="#E2CDB0" strokeWidth=".4" />
      ))}
      <circle r="1.6" fill="#F4A261" />
    </g>
  );
}

const GLYPHS = [
  () => <Shiuli />,
  () => <path d={MARIGOLD_PETAL} transform="translate(0 5)" fill="#F08A18" stroke="#B4510A" strokeWidth=".4" />,
  () => <path d={SPARK} fill="#F2A900" />,
  () => <path d={MARIGOLD_PETAL} transform="translate(0 5)" fill="#F5B415" stroke="#C98A00" strokeWidth=".4" />,
  () => <path d={SPARK} fill="#C9A24B" transform="scale(.8)" />,
];

const LIFETIME_MS = 1100;

/**
 * PetalBurst — absolutely centred in its positioned parent. Each change of
 * `burstKey` (after mount) emits a short radial burst of shiuli, marigold
 * petals and gold sparkles. Reduced motion: only a brief soft glow.
 */
export const PetalBurst = memo(function PetalBurst({ burstKey, count = 10 }) {
  const reduced = useReducedMotionConfig();
  const [burst, setBurst] = useState(null);
  const prevKey = useRef(burstKey);
  const n = Math.max(1, Math.min(24, count | 0));

  useEffect(() => {
    if (prevKey.current === burstKey) return undefined;
    prevKey.current = burstKey;
    const token = `${String(burstKey)}-${Date.now()}`;
    setBurst(token);
    const t = setTimeout(() => setBurst((b) => (b === token ? null : b)), LIFETIME_MS);
    return () => clearTimeout(t);
  }, [burstKey]);

  const parts = useMemo(() => {
    if (!burst) return [];
    let h = 0;
    for (let i = 0; i < burst.length; i++) h = (h * 31 + burst.charCodeAt(i)) | 0;
    const R = rng(h);
    return Array.from({ length: n }, (_, i) => {
      const a = ((i + R() * 0.6) / n) * Math.PI * 2;
      const dist = 26 + R() * 30;
      return {
        G: GLYPHS[i % GLYPHS.length],
        style: {
          '--dx': `${(Math.cos(a) * dist).toFixed(1)}px`,
          '--dy': `${(Math.sin(a) * dist - 6).toFixed(1)}px`,
          '--rot': `${(R() * 300 - 150).toFixed(0)}deg`,
          '--sz': `${(9 + R() * 7).toFixed(0)}px`,
          '--dur': `${(700 + R() * 350).toFixed(0)}ms`,
        },
      };
    });
  }, [burst, n]);

  return (
    <span className={styles.root} aria-hidden="true">
      {burst && reduced && (
        <motion.span
          key={burst}
          className={styles.glow}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.9, times: [0, 0.35, 1] }}
        />
      )}
      {burst && !reduced && (
        <span key={burst} className={styles.burst}>
          <span className={styles.flash} />
          {parts.map(({ G, style }, i) => (
            <span key={i} className={styles.bit} style={style}>
              <svg viewBox="-7 -7 14 14" focusable="false">
                <G />
              </svg>
            </span>
          ))}
        </span>
      )}
    </span>
  );
});

export default PetalBurst;
