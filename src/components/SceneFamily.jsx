/* Scene 3 (couple & families, nominal 12s).
   0.1s  section kicker
   0.4s  bride arch blooms (frame lines draw, crest pops; portrait fades in ~1.1s later)
   1.1s  groom arch blooms
   2.0s  bride name + family line fade up;  2.7s groom's
   2.4s  floral vine draws between the portraits; holds to the end.
   >=768px: bride left / groom right with a horizontal vine; mobile: stacked rows
   (portrait beside text, mirrored for the groom) joined by the vine. */
import config from '../config.js';
import { BilingualText } from './BilingualText.jsx';
import { FamilyCard } from './FamilyCard.jsx';
import { FloralVine } from './FloralVine.jsx';
import { Reveal, sceneMemo, useAfter, useMediaQuery, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneFamily.module.css';

function SceneFamilyImpl({ durationMs = 12000 }) {
  const t = useTiming(durationMs, 12000);
  const wide = useMediaQuery('(min-width: 768px)');
  const vineOn = useAfter(t(2.4));

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="family">
      <span className={layout.halo} aria-hidden="true" />
      <Reveal delay={t(0.1)} className={styles.head}>
        <BilingualText as="h1" text={config.copy.sectionHeadings.couple} variant="display" className={`${layout.kicker} ${styles.kicker}`} data-perch="" />
      </Reveal>
      <div className={styles.pair} data-wide={wide ? 'true' : 'false'}>
        <FamilyCard kind="bride" layout={wide ? 'column' : 'row'} archDelay={t(0.4)} textDelay={t(2.0)} className={styles.card} />
        <div className={styles.vine} aria-hidden="true">
          {vineOn && <FloralVine orientation="horizontal" />}
        </div>
        <FamilyCard kind="groom" layout={wide ? 'column' : 'rowReverse'} archDelay={t(1.1)} textDelay={t(2.7)} className={styles.card} />
      </div>
    </section>
  );
}

export const SceneFamily = sceneMemo(SceneFamilyImpl);
export default SceneFamily;
