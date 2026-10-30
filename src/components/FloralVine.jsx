import { memo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { FloraDefs, useSvgId } from '../assets/svg/flora.jsx';
import styles from './FloralVine.module.css';

const STEM = 'M4 20C24 6 44 34 66 22C74 18 86 18 94 22C116 34 136 6 156 20';
const TENDRILS = 'M30 15Q34 6 41 8Q44 12 39 13M130 15Q126 6 119 8Q116 12 121 13';
/* [k, x, y, rotate, scale, delay] */
const BITS = [
  ['lf', 16, 13, -60, 0.95, 0.35],
  ['ll', 24, 15, 40, 0.8, 0.45],
  ['lf', 50, 24, 120, 0.9, 0.55],
  ['ll', 110, 24, 60, 0.9, 0.55],
  ['lf', 136, 15, 140, 0.8, 0.45],
  ['ll', 144, 13, 240, 0.95, 0.35],
  ['sh', 40, 26, 10, 0.9, 0.7],
  ['shs', 120, 26, 200, 0.9, 0.7],
  ['rb', 6, 20, -70, 0.9, 0.8],
  ['rb', 154, 20, 70, 0.9, 0.8],
  ['mo', 70, 21, 20, 0.9, 0.9],
  ['my', 90, 21, 80, 0.9, 0.95],
  ['mr', 80, 18, 40, 1.05, 1],
];

/**
 * FloralVine — small marigold/shiuli vine that joins the two portraits.
 * draw=true: stem draws itself, then leaves and flowers pop in.
 * Reduced motion: fades in.
 */
export const FloralVine = memo(function FloralVine({ orientation = 'horizontal', draw = true }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('fv');
  const anim = draw && !reduced;
  const vertical = orientation === 'vertical';

  return (
    <motion.svg
      className={`${styles.vine} ${vertical ? styles.v : styles.h}`}
      viewBox={vertical ? '0 0 40 160' : '0 0 160 40'}
      aria-hidden="true"
      focusable="false"
      initial={draw && reduced ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <FloraDefs id={id} />
      <g transform={vertical ? 'translate(40 0) rotate(90)' : undefined}>
        <motion.path
          d={STEM}
          fill="none"
          stroke="#3E6B48"
          strokeWidth="1.4"
          strokeLinecap="round"
          initial={anim ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d={TENDRILS}
          fill="none"
          stroke="#7FA487"
          strokeWidth=".9"
          strokeLinecap="round"
          initial={anim ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        />
        {BITS.map(([k, x, y, r, s, delay], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <motion.g
              initial={anim ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <use href={`#${id}-${k}`} transform={`rotate(${r}) scale(${s})`} />
            </motion.g>
          </g>
        ))}
      </g>
    </motion.svg>
  );
});

export default FloralVine;
