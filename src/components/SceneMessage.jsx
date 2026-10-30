/* Scene 4 (invitation message, nominal 12s): Bengali then English, each line
   fading up in sequence.
   Both mode:  bn lines 0.5s / 1.6s / 2.7s -> gold rule 3.9s -> en lines 4.3s / 5.2s / 6.1s
   One language: lines 0.6s / 2.0s / 3.4s. Everything has landed by ~7s and holds. */
import { motion } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { KolkaMotif } from './KolkaMotif.jsx';
import { EASE, GoldRule, Reveal, sceneMemo, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneMessage.module.css';

function Lines({ lines, side, delays }) {
  return (
    <p lang={side} className={`${styles.block} ${styles[side]}`} data-message-lang={side}>
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className={`${styles.line} ${i === 0 ? styles.lead : ''}`}
          data-message-line={i + 1}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: delays[i] ?? delays[delays.length - 1] }}
        >
          {line}
        </motion.span>
      ))}
    </p>
  );
}

function SceneMessageImpl({ durationMs = 12000 }) {
  const { lang } = useLanguage();
  const t = useTiming(durationMs, 12000);
  const msg = config.copy.message;
  const both = lang === 'both';

  const bnDelays = (both ? [0.5, 1.6, 2.7] : [0.6, 2.0, 3.4]).map(t);
  const enDelays = (both ? [4.3, 5.2, 6.1] : [0.6, 2.0, 3.4]).map(t);

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="message" data-lang-mode={lang}>
      <span className={layout.halo} aria-hidden="true" />
      <Reveal delay={t(0.1)} className={styles.orn} aria-hidden="true" y={-8}>
        <KolkaMotif size={22} className={styles.ornL} />
        <KolkaMotif size={30} />
        <KolkaMotif size={22} />
      </Reveal>
      <div className={styles.text}>
        {lang !== 'en' && <Lines lines={msg.bn} side="bn" delays={bnDelays} />}
        {both && <GoldRule delay={t(3.9)} className={styles.rule} />}
        {lang !== 'bn' && <Lines lines={msg.en} side="en" delays={enDelays} />}
      </div>
    </section>
  );
}

export const SceneMessage = sceneMemo(SceneMessageImpl);
export default SceneMessage;
