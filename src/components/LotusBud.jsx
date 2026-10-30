import { memo, useEffect, useRef } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useSvgId } from '../assets/svg/flora.jsx';
import styles from './LotusBud.module.css';

const PETAL = 'M0 0C-25-13-33-60-4-104Q0-109 4-104C33-60 25-13 0 0Z';
const VEIN = 'M0-4Q-3-50 0-98M-6-8Q-16-40-6-80M6-8Q16-40 6-80';
const EASE = [0.22, 1, 0.36, 1];

/* [closedRotate, openRotate, scale, gradient, delay, scaleYOpen] */
const LAYERS = [
  [-15, -74, 0.8, 'b', 0, 1],
  [15, 74, 0.8, 'b', 0, 1],
  [-9, -48, 0.9, 'b', 0.12, 1],
  [9, 48, 0.9, 'b', 0.12, 1],
  ['pod'],
  [-4, -22, 0.97, 'm', 0.24, 1],
  [4, 22, 0.97, 'm', 0.24, 1],
  [0, 0, 1.02, 'f', 0.36, 0.5],
];

const STAMENS = Array.from({ length: 13 }, (_, i) => -66 + i * 11);
const DOTS = Array.from({ length: 15 }, (_, i) => {
  const a = ((200 + i * 10) * Math.PI) / 180;
  return [Math.round((100 + Math.cos(a) * 92) * 10) / 10, Math.round((128 + Math.sin(a) * 92) * 10) / 10];
});

/**
 * LotusBud — ornate closed lotus bud that blooms when `open` turns true and
 * calls `onOpened` once the bloom settles. Reduced motion: switches straight
 * to the open state with an opacity fade.
 * Width defaults to clamp(150px, 46vw, 260px); override with --lotus-size.
 */
export const LotusBud = memo(function LotusBud({ open = false, onOpened }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('lb');
  const cb = useRef(onOpened);
  cb.current = onOpened;

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => cb.current && cb.current(), reduced ? 450 : 1900);
    return () => clearTimeout(t);
  }, [open, reduced]);

  const tr = (delay) => (reduced ? { duration: 0 } : { duration: 1.5, ease: EASE, delay });

  return (
    <motion.div
      className={`${styles.root} ${!open && !reduced ? styles.breathe : ''}`}
      aria-hidden="true"
      data-open={open ? 'true' : 'false'}
      data-reduced-motion={reduced ? 'true' : undefined}
      key={reduced ? `r${open}` : 'm'}
      initial={reduced ? { opacity: 0.35 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <svg viewBox="0 0 200 220" className={styles.svg} focusable="false">
        <defs>
          <linearGradient id={`${id}-b`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#FBE3E2" />
            <stop offset=".6" stopColor="#EBA0AE" />
            <stop offset="1" stopColor="#B84A64" />
          </linearGradient>
          <linearGradient id={`${id}-m`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#FFF6F1" />
            <stop offset=".6" stopColor="#F4BFC8" />
            <stop offset="1" stopColor="#CF6A82" />
          </linearGradient>
          <linearGradient id={`${id}-f`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#FFFCF6" />
            <stop offset=".55" stopColor="#F9D6DA" />
            <stop offset="1" stopColor="#DE8598" />
          </linearGradient>
          <radialGradient id={`${id}-g`}>
            <stop offset="0" stopColor="#FFE9A8" stopOpacity=".95" />
            <stop offset=".5" stopColor="#F8C94D" stopOpacity=".35" />
            <stop offset="1" stopColor="#F8C94D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* halo + alpona dots */}
        <circle cx="100" cy="118" r="84" fill="none" stroke="#C9A24B" strokeWidth=".8" strokeDasharray="1 5" strokeLinecap="round" opacity=".8" />
        <g fill="#C9A24B">
          {DOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 2} />
          ))}
        </g>
        <motion.circle
          cx="100"
          cy="112"
          r="70"
          fill={`url(#${id}-g)`}
          initial={false}
          animate={{ opacity: open ? 1 : 0.35 }}
          transition={reduced ? { duration: 0 } : { duration: 1.6, ease: EASE, delay: 0.3 }}
        />

        {/* kolka flourishes */}
        <g fill="none" stroke="#C9A24B" strokeWidth="1.3" strokeLinecap="round">
          <path d="M60 186C34 182 20 162 30 146C36 136 50 140 48 150C47 156 40 156 40 151" />
          <path d="M140 186C166 182 180 162 170 146C164 136 150 140 152 150C153 156 160 156 160 151" />
        </g>

        {/* water + pad */}
        <path d="M44 196Q100 206 156 196M62 205Q100 212 138 205" fill="none" stroke="#7FA487" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
        <path d="M58 182Q100 168 142 182Q100 198 58 182Z" fill="#3E6B48" />
        <path d="M100 176V190M78 181L100 185L122 181" fill="none" stroke="#7FA487" strokeWidth=".8" />

        <g transform="translate(100 178)">
          {LAYERS.map((L, i) => {
            if (L[0] === 'pod') {
              return (
                <motion.g
                  key="pod"
                  initial={false}
                  animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.6 }}
                  transition={tr(0.35)}
                  style={{ originX: 0.5, originY: 1 }}
                >
                  {STAMENS.map((a) => (
                    <path
                      key={a}
                      d="M0-30L0-52"
                      transform={`rotate(${a * 0.55} 0 -30)`}
                      stroke="#E39A00"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  ))}
                  {STAMENS.map((a) => (
                    <circle key={`s${a}`} cx={Math.sin((a * 0.55 * Math.PI) / 180) * 22} cy={-30 - Math.cos((a * 0.55 * Math.PI) / 180) * 22} r="1.8" fill="#F2A900" />
                  ))}
                  <path d="M-15-28Q0-44 15-28Q12-20 0-19Q-12-20-15-28Z" fill="#B5C46A" stroke="#7A8F3A" strokeWidth=".8" />
                  <g fill="#6E7F2E">
                    <circle cx="-6" cy="-29" r="1.4" />
                    <circle cx="0" cy="-31" r="1.4" />
                    <circle cx="6" cy="-29" r="1.4" />
                    <circle cx="-3" cy="-25" r="1.4" />
                    <circle cx="3" cy="-25" r="1.4" />
                  </g>
                </motion.g>
              );
            }
            const [c, o, s, g, delay, sy] = L;
            return (
              <motion.g
                key={i}
                initial={false}
                animate={{ rotate: open ? o : c, scaleY: open ? sy : 1 }}
                transition={tr(delay)}
                style={{ originX: 0.5, originY: 1 }}
              >
                <g transform={`scale(${s})`}>
                  <path d={PETAL} fill={`url(#${id}-${g})`} stroke="#C9A24B" strokeWidth="1" />
                  <path d={VEIN} fill="none" stroke="#fff" strokeWidth=".9" strokeOpacity=".55" />
                </g>
              </motion.g>
            );
          })}
        </g>

        {/* gold bindings on the closed bud */}
        <motion.g
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4 }}
          fill="none"
          stroke="#C9A24B"
          strokeLinecap="round"
        >
          <path d="M80 150Q100 158 120 150" strokeWidth="1.6" />
          <path d="M86 128Q100 134 114 128" strokeWidth="1.2" />
          <circle cx="100" cy="154" r="2.4" fill="#F2A900" stroke="none" />
          <circle cx="100" cy="70" r="2" fill="#F2A900" stroke="none" />
        </motion.g>
      </svg>
    </motion.div>
  );
});

export default LotusBud;
