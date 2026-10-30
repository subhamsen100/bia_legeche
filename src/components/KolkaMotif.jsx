import { memo } from 'react';
import { PAISLEY, PAISLEY_INNER, SHIULI } from '../assets/svg/paths.js';
import styles from './KolkaMotif.module.css';

/* rice-paste dots hugging the outside of the paisley bulb */
const DOTS = Array.from({ length: 11 }, (_, i) => {
  const a = ((40 + i * 19) * Math.PI) / 180;
  return [(31 + Math.cos(a) * 25.5).toFixed(1), (40 + Math.sin(a) * 23.5).toFixed(1), i % 2 ? 0.9 : 1.4];
});

/** KolkaMotif — static kolka (paisley) ornament in maroon, marigold and gold. */
export const KolkaMotif = memo(function KolkaMotif({ size = 48, className = '' }) {
  const px = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      className={`${styles.motif} ${className}`}
      style={{ '--km-size': px }}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="#C9A24B">
        {DOTS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <path d={PAISLEY} fill="#FDEFC4" stroke="#7A1F2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={PAISLEY_INNER} fill="#F2A900" stroke="#C98A00" strokeWidth=".8" />
      <path d="M36 23C42 29 41 39 36 44C31 49 24 49 22 45" fill="none" stroke="#7A1F2B" strokeWidth=".9" strokeLinecap="round" opacity=".7" />
      <g transform="translate(29 41) scale(.95)">
        {SHIULI.angles.map((a) => (
          <path key={a} d={SHIULI.petal} transform={`rotate(${a})`} fill="#fff" stroke="#C98A00" strokeWidth=".4" />
        ))}
        <circle r="1.7" fill="#7A1F2B" />
      </g>
      <path d="M44 14Q50 18 50 26M47 9Q55 14 55 23" fill="none" stroke="#C9A24B" strokeWidth=".9" strokeLinecap="round" />
    </svg>
  );
});

export default KolkaMotif;
