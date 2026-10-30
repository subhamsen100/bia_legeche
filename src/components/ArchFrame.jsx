import { memo } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { FloraDefs, Lotus, RajStalk, U, useSvgId } from '../assets/svg/flora.jsx';
import styles from './ArchFrame.module.css';

const EASE = [0.22, 1, 0.36, 1];
const ARCH_OUTER = 'M10 392V162A140 140 0 0 1 290 162V392';
const ARCH_MID = 'M17 385V162A133 133 0 0 1 283 162V385';
const ARCH_INNER = 'M24 378V162A126 126 0 0 1 276 162V378';

const ARCH_DOTS = Array.from({ length: 17 }, (_, i) => {
  const a = Math.PI + (i + 1) * (Math.PI / 18);
  return [Math.round((150 + Math.cos(a) * 146) * 10) / 10, Math.round((162 + Math.sin(a) * 146) * 10) / 10];
});

/**
 * ArchFrame — arch (temple-door) portrait frame with a lotus crest,
 * rajanigandha climbing the pillars and marigold clusters at the base.
 * `children` fill the arch window (clipped). bloom=true: lines draw, crest
 * blooms, then children fade in. Reduced motion: opacity fades only.
 */
export const ArchFrame = memo(function ArchFrame({ bloom = true, children, className = '' }) {
  const reduced = useReducedMotionConfig();
  const id = useSvgId('af');
  const anim = bloom && !reduced;
  const fadeOnly = bloom && reduced;

  const draw = (delay) =>
    anim
      ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.3, ease: EASE, delay } }
      : { initial: false };
  const pop = (delay, origin = [0.5, 1]) =>
    anim
      ? {
          initial: { opacity: 0, scale: 0.4 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay },
          style: { originX: origin[0], originY: origin[1] },
        }
      : { initial: false };

  return (
    <div className={`${styles.root} ${className}`}>
      <motion.div
        className={styles.window}
        initial={anim || fadeOnly ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: fadeOnly ? 0.6 : 0.9, delay: anim ? 1.1 : fadeOnly ? 0.3 : 0 }}
      >
        {children}
      </motion.div>

      <motion.svg
        className={styles.frame}
        viewBox="0 0 300 400"
        aria-hidden="true"
        focusable="false"
        initial={anim ? { opacity: 0, scale: 0.94 } : fadeOnly ? { opacity: 0 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <FloraDefs id={id} />
        <g fill="none" strokeLinecap="round">
          <motion.path d={ARCH_OUTER} stroke="#7A1F2B" strokeWidth="2.2" {...draw(0)} />
          <motion.path d={ARCH_MID} stroke="#C9A24B" strokeWidth="1.2" {...draw(0.15)} />
          <motion.path d={ARCH_INNER} stroke="#C9A24B" strokeWidth="2.6" {...draw(0.3)} />
          <motion.path d="M4 393H296" stroke="#7A1F2B" strokeWidth="2.6" {...draw(0.5)} />
          <motion.path d="M20 380H280" stroke="#C9A24B" strokeWidth="1.4" {...draw(0.6)} />
        </g>
        <motion.g fill="#C9A24B" {...(anim ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.9, duration: 0.6 } } : { initial: false })}>
          {ARCH_DOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1.3 : 2.1} />
          ))}
        </motion.g>

        {/* rajanigandha climbing the pillars */}
        <motion.g {...pop(0.7, [0.5, 1])}>
          <RajStalk id={id} p0={[12, 396]} c={[4, 320]} p2={[16, 236]} n={7} seed={21} w={1.4} fs={1.7} />
          <RajStalk id={id} p0={[288, 396]} c={[296, 320]} p2={[284, 236]} n={7} seed={22} w={1.4} fs={1.7} />
        </motion.g>

        {/* marigold + shiuli clusters at the base */}
        <motion.g {...pop(0.85, [0, 1])}>
          <U id={id} k="ll" x={22} y={384} r={-30} s={2.2} />
          <U id={id} k="lf" x={30} y={392} r={-4} s={2.4} />
          <U id={id} k="mo" x={14} y={384} r={10} s={1.35} />
          <U id={id} k="my" x={38} y={392} r={70} s={1.05} />
          <U id={id} k="sh" x={8} y={360} r={20} s={1.2} />
        </motion.g>
        <motion.g {...pop(0.85, [1, 1])}>
          <U id={id} k="ll" x={278} y={384} r={210} s={2.2} />
          <U id={id} k="lf" x={270} y={392} r={184} s={2.4} />
          <U id={id} k="mo" x={286} y={384} r={40} s={1.35} />
          <U id={id} k="my" x={262} y={392} r={10} s={1.05} />
          <U id={id} k="sh" x={292} y={360} r={50} s={1.2} />
        </motion.g>

        {/* lotus crest */}
        <motion.g {...pop(0.6, [0.5, 1])}>
          <U id={id} k="lf" x={150} y={30} r={200} s={2.3} />
          <U id={id} k="lf" x={150} y={30} r={-20} s={2.3} />
          <U id={id} k="mr" x={122} y={30} r={10} s={0.9} />
          <U id={id} k="mr" x={178} y={30} r={40} s={0.9} />
          <Lotus id={id} x={150} y={32} s={1.25} />
        </motion.g>
      </motion.svg>
    </div>
  );
});

export default ArchFrame;
