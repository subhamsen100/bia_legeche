/* Scene 1 (opening, nominal 10s): the gate's lotus bud blooms in place.
   0.0s  lotus (closed) + event kicker, in exactly the gate's positions
   0.7s  open -> bloom (~1.9s), halo brightens, slow push-in for the whole scene
   2.5s  gold rule draws out beneath, kolka trio pops in (2.9s-3.3s)
   Petals (App layer) drift for the whole experience. */
import { useEffect, useState } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import config from '../config.js';
import { BilingualText } from './BilingualText.jsx';
import { KolkaMotif } from './KolkaMotif.jsx';
import { LotusBud } from './LotusBud.jsx';
import { EASE, GoldRule, sceneMemo, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import gate from './SceneGate.module.css';
import styles from './SceneOpening.module.css';

function SceneOpeningImpl({ durationMs = 10000 }) {
  const t = useTiming(durationMs, 10000);
  const reduced = useReducedMotionConfig();
  const [open, setOpen] = useState(false);
  const [bloomed, setBloomed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), t(0.7) * 1000);
    return () => clearTimeout(id);
  }, [t]);

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="opening" data-bloomed={bloomed ? 'true' : 'false'}>
      <motion.span
        className={layout.halo}
        aria-hidden="true"
        initial={{ opacity: 0.55, scale: 0.9 }}
        animate={{ opacity: open ? 1 : 0.55, scale: open ? 1.04 : 0.9 }}
        transition={{ duration: 2.4, ease: EASE }}
      />
      <div className={gate.kickerSlot}>
        <BilingualText as="h1" text={config.event.name} variant="display" className={`${layout.kicker} ${layout.eventName} ${gate.kicker}`} data-perch="" />
      </div>
      <motion.span
        className={`${gate.lotus} ${styles.lotus}`}
        initial={{ scale: 1 }}
        animate={{ scale: reduced ? 1 : 1.07 }}
        transition={{ duration: t(9), ease: 'linear', delay: t(0.7) }}
      >
        <LotusBud open={open} onOpened={() => setBloomed(true)} />
      </motion.span>
      <div className={gate.below}>
        <GoldRule delay={t(2.5)} className={styles.rule} />
        <span className={styles.trio} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={styles.kolka}
              initial={{ opacity: 0, scale: 0.5, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: t(2.9 + i * 0.2) }}
            >
              <KolkaMotif size={i === 1 ? 30 : 22} className={i === 0 ? styles.flip : ''} />
            </motion.span>
          ))}
        </span>
      </div>
    </section>
  );
}

export const SceneOpening = sceneMemo(SceneOpeningImpl);
export default SceneOpening;
