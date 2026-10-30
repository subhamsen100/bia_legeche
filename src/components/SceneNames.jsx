/* Scene 2 (names, nominal 10s): letter-by-letter names with a gold glint.
   0.5s  Bengali names, one grapheme cluster at a time (~0.16s each)
   ~1.9s kolka heart draws itself between the lines (1.6s stroke + fill)
   ~2.0s English names (Great Vibes), letter by letter
   ~3.8s names complete -> heart starts its heartbeat bounce
   ~4.2s glint wave sweeps across both lines; gold rule + event line settle (5s) */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { BilingualText } from './BilingualText.jsx';
import { KolkaHeart } from './KolkaHeart.jsx';
import { EASE, GoldRule, LetterReveal, letterTiming, sceneMemo, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneNames.module.css';

function SceneNamesImpl({ durationMs = 10000 }) {
  const { lang } = useLanguage();
  const t = useTiming(durationMs, 10000);
  const names = config.couple.names;
  const showBn = lang !== 'en';
  const showEn = lang !== 'bn';

  const plan = useMemo(() => {
    const bn = letterTiming(names.bn, { start: t(0.5), step: t(0.16) });
    const enStart = showBn ? Math.max(t(2.0), bn.endsAt - t(0.3)) : t(0.6);
    const en = letterTiming(names.en, { start: enStart, step: t(0.075) });
    const end = Math.max(showBn ? bn.endsAt : 0, showEn ? en.endsAt : 0);
    // KolkaHeart: draws over ~1.8s, then bounces; start drawing so the bounce lands when the names finish
    const heartDelay = Math.max(t(1.2), end - 1.8);
    return { bn, en, end, heartDelay, glint: end + t(0.45) };
  }, [names.bn, names.en, showBn, showEn, t]);

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="names">
      <span className={layout.halo} aria-hidden="true" />
      <h1 className={styles.names} data-perch="" data-lang-mode={lang}>
        {showBn && (
          <span className={styles.bnLine}>
            <LetterReveal text={names.bn} lang="bn" start={plan.bn.start} step={plan.bn.step} glintAt={plan.glint} />
          </span>
        )}
        <span className={styles.heart} aria-hidden="true">
          <KolkaHeart draw bounce delay={plan.heartDelay} size="var(--names-heart)" />
        </span>
        {showEn && (
          <span className={styles.enLine}>
            <LetterReveal text={names.en} lang="en" start={plan.en.start} step={plan.en.step} glintAt={plan.glint + 0.25} />
          </span>
        )}
      </h1>
      <motion.div
        className={styles.footer}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: plan.end + t(0.9) }}
      >
        <GoldRule delay={plan.end + t(0.9)} />
        <BilingualText text={config.event.name} variant="display" className={`${layout.kicker} ${layout.eventName}`} />
      </motion.div>
    </section>
  );
}

export const SceneNames = sceneMemo(SceneNamesImpl);
export default SceneNames;
