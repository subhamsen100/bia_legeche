/* Scene 7 (closing blessing, nominal 6s).
   0.2s kolka heart draws . 0.5s blessing (bn) . 1.2s blessing (en)
   2.2s gold rule . 2.6s signature (Bengali serif / English Great Vibes). Holds to 6s,
   then the timeline hands over to the free-scroll final page. */
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { BilingualText } from './BilingualText.jsx';
import { KolkaHeart } from './KolkaHeart.jsx';
import { GoldRule, Reveal, sceneMemo, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneClosing.module.css';

function SceneClosingImpl({ durationMs = 6000 }) {
  const { lang } = useLanguage();
  const t = useTiming(durationMs, 6000);
  const closing = config.copy.closing;

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="closing" data-lang-mode={lang}>
      <span className={layout.halo} aria-hidden="true" />
      <div className={styles.heart} aria-hidden="true">
        <KolkaHeart draw delay={t(0.2)} size="var(--closing-heart)" />
      </div>
      <h1 className={styles.blessing} data-perch="">
        {lang !== 'en' && (
          <Reveal as="span" delay={t(0.5)} className={styles.bn} lang="bn">
            {closing.bn}
          </Reveal>
        )}
        {lang !== 'bn' && (
          <Reveal as="span" delay={lang === 'both' ? t(1.2) : t(0.5)} className={styles.en} lang="en">
            {closing.en}
          </Reveal>
        )}
      </h1>
      <GoldRule delay={t(2.2)} className={styles.rule} />
      <Reveal delay={t(2.6)}>
        <BilingualText text={config.copy.signed} variant="names" className={styles.signed} />
      </Reveal>
    </section>
  );
}

export const SceneClosing = sceneMemo(SceneClosingImpl);
export default SceneClosing;
