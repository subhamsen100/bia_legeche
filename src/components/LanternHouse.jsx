import { memo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { FloraDefs, U, useSvgId } from '../assets/svg/flora.jsx';
import styles from './LanternHouse.module.css';

const PATH = 'M10 176C40 168 28 150 60 152C92 154 92 172 122 166C146 161 150 150 172 148';
const LIGHTS = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  const x = 118 + t * 112;
  const y = 92 + Math.sin(t * Math.PI) * 9;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
});

/**
 * LanternHouse — tiny lantern-lit Bengali house (curved do-chala roof) with a
 * hand-drawn dashed path that draws itself to the door, and a bouncing map
 * marker. play=false or reduced motion: static, fully drawn.
 */
export const LanternHouse = memo(function LanternHouse({ play = true }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('lh');
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
      <svg className={styles.svg} viewBox="0 0 260 190" focusable="false">
        <FloraDefs id={id} />
        <defs>
          <radialGradient id={`${id}-win`}>
            <stop offset="0" stopColor="#FFF4C2" />
            <stop offset="1" stopColor="#F2A900" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="#FFD873" stopOpacity=".55" />
            <stop offset="1" stopColor="#FFD873" stopOpacity="0" />
          </radialGradient>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="260" height="190">
            <motion.path
              d={PATH}
              fill="none"
              stroke="#fff"
              strokeWidth="8"
              strokeLinecap="round"
              initial={live ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: 0.4 }}
            />
          </mask>
        </defs>

        {/* moon + stars */}
        <path d="M44 22A16 16 0 1 0 60 44A13 13 0 1 1 44 22Z" fill="#F4E9CC" stroke="#C9A24B" strokeWidth="1" />
        <g fill="#C9A24B">
          <path className={styles.star} d="M88 18l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z" />
          <path className={styles.star} d="M206 26l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z" />
          <path className={styles.star} d="M146 40l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
        </g>

        {/* ground */}
        <path d="M0 160Q70 146 130 154T260 150V190H0Z" fill="#E7EFDD" />
        <path d="M0 160Q70 146 130 154T260 150" fill="none" stroke="#7FA487" strokeWidth="1.2" />

        {/* banana plant */}
        <path d="M84 156Q86 120 82 96" fill="none" stroke="#3E6B48" strokeWidth="3" strokeLinecap="round" />
        <U id={id} k="lf" x={82} y={98} r={-150} s={2.2} />
        <U id={id} k="ll" x={82} y={98} r={-30} s={2.4} />
        <U id={id} k="lf" x={83} y={108} r={-170} s={1.9} />
        <U id={id} k="ll" x={84} y={110} r={-8} s={2} />
        <U id={id} k="lf" x={82} y={96} r={-95} s={1.6} />

        {/* house */}
        <ellipse cx="175" cy="112" rx="70" ry="48" fill={`url(#${id}-halo)`} />
        <path d="M128 100H222V150H128Z" fill="#F1D9B5" stroke="#7A1F2B" strokeWidth="1.6" />
        <path d="M128 140H222" stroke="#B5543A" strokeWidth="1" opacity=".5" />
        <path d="M118 102Q175 52 232 102L224 106Q175 66 126 106Z" fill="#B5543A" stroke="#7A1F2B" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M126 106Q175 66 224 106L222 100Q175 62 128 100Z" fill="#8F3A26" />
        <path d="M140 88Q175 66 210 88M152 80Q175 70 198 80" fill="none" stroke="#7A1F2B" strokeWidth=".8" opacity=".55" />
        {/* door + windows */}
        <path d="M164 150V126Q175 112 186 126V150Z" fill={`url(#${id}-win)`} stroke="#7A1F2B" strokeWidth="1.6" />
        <path d="M175 116V150" stroke="#C98A00" strokeWidth=".8" />
        <g className={styles.flicker}>
          <rect x="138" y="114" width="14" height="16" rx="7" fill={`url(#${id}-win)`} stroke="#7A1F2B" strokeWidth="1.4" />
          <rect x="198" y="114" width="14" height="16" rx="7" fill={`url(#${id}-win)`} stroke="#7A1F2B" strokeWidth="1.4" />
        </g>
        <path d="M145 114V130M205 114V130" stroke="#7A1F2B" strokeWidth=".9" />
        {/* alpona at the door step */}
        <path d="M160 152Q175 158 190 152" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="175" cy="156" r="1.5" fill="#fff" />

        {/* fairy lights along the eave */}
        <path d="M118 92Q174 110 230 92" fill="none" stroke="#7A1F2B" strokeWidth=".6" opacity=".6" />
        <g>
          {LIGHTS.map(([x, y], i) => (
            <circle key={i} className={i % 2 ? styles.bulbA : styles.bulbB} cx={x} cy={y + 2} r="2.1" fill={i % 3 ? '#F2A900' : '#F4A261'} />
          ))}
        </g>
        {/* hanging lanterns at the eave corners */}
        {[126, 224].map((x) => (
          <g key={x} className={styles.lantern} transform={`translate(${x} 106)`}>
            <path d="M0 0V6" stroke="#7A1F2B" strokeWidth=".8" />
            <circle cx="0" cy="13" r="9" fill={`url(#${id}-halo)`} />
            <path d="M-4 6H4L5 16Q0 20-5 16Z" fill="#EC8A1C" stroke="#7A1F2B" strokeWidth=".9" />
            <path d="M-2 18.5H2" stroke="#7A1F2B" strokeWidth="1.2" />
          </g>
        ))}

        <U id={id} k="mo" x={130} y={152} r={10} s={0.8} />
        <U id={id} k="my" x={220} y={152} r={50} s={0.8} />
        <U id={id} k="sh" x={232} y={158} r={20} s={0.9} />

        {/* hand-drawn path (dashed, revealed by an animated mask) */}
        <g mask={`url(#${id}-m)`}>
          <path d={PATH} fill="none" stroke="#7A1F2B" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
        </g>
        <circle cx="10" cy="176" r="3" fill="#7A1F2B" />
      </svg>

      <motion.span
        className={styles.marker}
        initial={live ? { opacity: 0, y: -24 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span className={styles.bounce}>
          <svg viewBox="0 0 24 32" focusable="false">
            <path d="M12 31C12 31 2 19 2 11.5A10 10 0 0 1 22 11.5C22 19 12 31 12 31Z" fill="#7A1F2B" stroke="#4E121B" strokeWidth="1" />
            <circle cx="12" cy="11.5" r="4.6" fill="#F2A900" />
            <circle cx="12" cy="11.5" r="1.8" fill="#FFF8EC" />
          </svg>
        </span>
      </motion.span>
    </motion.div>
  );
});

export default LanternHouse;
