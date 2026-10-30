import { memo } from 'react';
import { useSvgId } from '../assets/svg/flora.jsx';
import styles from './AlponaBorder.module.css';

const r1 = (n) => Math.round(n * 10) / 10;

/* ring: 16 outer petals, wave band, 8-petal lotus, dot rings */
const RING = (() => {
  const petals = [];
  for (let i = 0; i < 16; i++) petals.push(i * 22.5);
  const dots = (r, n, rot = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i * 360) / n + rot) * (Math.PI / 180);
      return [r1(100 + Math.cos(a) * r), r1(100 + Math.sin(a) * r)];
    });
  let wave = '';
  for (let i = 0; i < 24; i++) {
    const a0 = (i * 15 * Math.PI) / 180;
    const a1 = ((i * 15 + 15) * Math.PI) / 180;
    const am = ((i * 15 + 7.5) * Math.PI) / 180;
    const p = (a, r) => `${r1(100 + Math.cos(a) * r)} ${r1(100 + Math.sin(a) * r)}`;
    wave += `${i ? '' : `M${p(a0, 58)}`}Q${p(am, i % 2 ? 50 : 66)} ${p(a1, 58)}`;
  }
  return { petals, outerDots: dots(94, 48), innerDots: dots(44, 16, 11.25), wave };
})();

function Strip({ id }) {
  return (
    <svg className={styles.strip} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <defs>
        <pattern id={`${id}-p`} width="36" height="20" patternUnits="userSpaceOnUse">
          <rect width="36" height="20" style={{ fill: 'var(--alpona-ground, #7A1F2B)' }} />
          <g fill="none" style={{ stroke: 'var(--alpona-ink, #FFF8EC)' }} strokeWidth="1.1" strokeLinecap="round">
            <path d="M0 2.2H36M0 17.8H36" strokeWidth=".7" />
            <path d="M18 10C14 4 8 5 8.5 9.5C9 13 13 12.6 12.6 10.2M18 10C22 4 28 5 27.5 9.5C27 13 23 12.6 23.4 10.2" />
            <path d="M18 10C15.6 13 15.6 15 18 16.2C20.4 15 20.4 13 18 10Z" style={{ fill: 'var(--alpona-ink, #FFF8EC)' }} stroke="none" />
          </g>
          <g style={{ fill: 'var(--alpona-ink, #FFF8EC)' }}>
            <circle cx="0" cy="10" r="1.5" />
            <circle cx="36" cy="10" r="1.5" />
            <circle cx="3.6" cy="10" r=".8" />
            <circle cx="32.4" cy="10" r=".8" />
            <circle cx="18" cy="5.2" r=".9" />
          </g>
          <path d="M33 10Q36 13.8 39 10" fill="none" style={{ stroke: 'var(--alpona-gold, #E0C78A)' }} strokeWidth=".6" />
          <path d="M-3 10Q0 13.8 3 10" fill="none" style={{ stroke: 'var(--alpona-gold, #E0C78A)' }} strokeWidth=".6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-p)`} />
    </svg>
  );
}

function Ring() {
  return (
    <svg className={styles.ring} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="99" style={{ fill: 'var(--alpona-ground, #7A1F2B)' }} />
      <g fill="none" style={{ stroke: 'var(--alpona-ink, #FFF8EC)' }} strokeLinecap="round">
        {RING.petals.map((a) => (
          <path
            key={a}
            transform={`rotate(${a} 100 100)`}
            d="M100 12C108 22 110 32 100 42C90 32 92 22 100 12ZM100 19C103.6 24 104 29 100 34"
            strokeWidth="1.3"
          />
        ))}
        <circle cx="100" cy="100" r="74" strokeWidth=".8" />
        <path d={RING.wave} strokeWidth="1.2" />
        <circle cx="100" cy="100" r="35" strokeWidth=".8" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} transform={`rotate(${a} 100 100)`} d="M100 70C107 78 107 86 100 94C93 86 93 78 100 70Z" strokeWidth="1.2" />
        ))}
      </g>
      <g style={{ fill: 'var(--alpona-ink, #FFF8EC)' }}>
        {RING.outerDots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 0.9 : 1.6} />
        ))}
        {RING.innerDots.map(([x, y], i) => (
          <circle key={`i${i}`} cx={x} cy={y} r="1.2" />
        ))}
        <circle cx="100" cy="100" r="5" />
      </g>
      <circle cx="100" cy="100" r="9" fill="none" style={{ stroke: 'var(--alpona-gold, #E0C78A)' }} strokeWidth="1" />
    </svg>
  );
}

/** AlponaBorder — rice-paste (alpona) strip (full parent width, 20px) or ring medallion. */
export const AlponaBorder = memo(function AlponaBorder({ className = '', variant = 'strip' }) {
  const id = useSvgId('al');
  return (
    <div className={`${styles.root} ${variant === 'ring' ? styles.isRing : styles.isStrip} ${className}`} aria-hidden="true">
      {variant === 'ring' ? <Ring /> : <Strip id={id} />}
    </div>
  );
});

export default AlponaBorder;
