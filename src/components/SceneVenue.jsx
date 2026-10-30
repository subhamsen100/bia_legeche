/* Scene 6 (venue, nominal 12s). Lanterns float up behind everything.
   Desktop (>=900px): one composition, staged
     0.3s house (its path draws, marker drops ~2.4s later) . 0.8s name . 1.3s locality
     1.8s addresses . 3.0s QR card . 3.5s Open-in-Maps . 4.2s tagline
   Mobile (no scrolling at 360x640): name + locality stay as the header, then two beats
     beat 1 (0-6s): house + addresses (bn, en)
     beat 2 (6s-12s): locality folds away; QR card + Open-in-Maps (stacked) + tagline */
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { BilingualText } from './BilingualText.jsx';
import { LanternHouse } from './LanternHouse.jsx';
import { Lanterns } from './Lanterns.jsx';
import { MapQR } from './MapQR.jsx';
import { MapsButton } from './MapsButton.jsx';
import { EASE, Reveal, sceneMemo, useAfter, useMediaQuery, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneVenue.module.css';

const LAYOUT_T = { layout: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } };

export function VenueQRRow({ className = '', qrDelay = 0, buttonDelay = 0, animate = true }) {
  const { pick } = useLanguage();
  const R = animate ? Reveal : 'div';
  const rp = (delay) => (animate ? { delay } : {});
  return (
    <div className={`${styles.qrRow} ${className}`}>
      <R className={styles.qrCell} {...rp(qrDelay)}>
        <MapQR
          caption={<BilingualText as="span" text={config.copy.scanCaption} variant="caption" className={styles.caption} />}
          label={pick(config.copy.scanCaption)}
        />
      </R>
      <R className={styles.btnCell} {...rp(buttonDelay)}>
        <MapsButton>
          <BilingualText as="span" text={config.copy.openInMaps} variant="body" className={styles.btnText} />
        </MapsButton>
      </R>
    </div>
  );
}

function Header({ t, locality = true }) {
  return (
    <motion.div layout className={styles.header} transition={LAYOUT_T}>
      <Reveal delay={t(0.8)}>
        <BilingualText as="h1" text={config.venue.name} variant="display" className={styles.name} data-perch="" />
      </Reveal>
      <AnimatePresence initial={false}>
        {locality && (
          <motion.div
            key="loc"
            className={styles.localityClip}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.5, ease: EASE } }}
          >
            <Reveal delay={t(1.3)} className={styles.localityWrap}>
              <span className={styles.pin} aria-hidden="true" />
              <BilingualText text={config.venue.locality} variant="display" className={styles.locality} />
            </Reveal>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Address({ delay }) {
  return (
    <Reveal delay={delay} as="address" className={styles.address}>
      <BilingualText text={config.venue.address} variant="body" className={styles.addressText} />
    </Reveal>
  );
}

function House({ delay }) {
  const on = useAfter(delay);
  return <div className={styles.house}>{on && <LanternHouse play />}</div>;
}

function SceneVenueImpl({ durationMs = 12000 }) {
  const t = useTiming(durationMs, 12000);
  const desktop = useMediaQuery('(min-width: 900px) and (min-height: 560px)');
  const beat2 = useAfter(t(6));

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="venue" data-layout={desktop ? 'wide' : 'beats'} data-beat={desktop ? 'all' : beat2 ? '2' : '1'}>
      <div className={styles.sky} aria-hidden="true">
        <Lanterns count={desktop ? 9 : 6} />
      </div>
      <span className={layout.halo} aria-hidden="true" />

      {desktop ? (
        <div className={styles.wide}>
          <div className={styles.colLeft}>
            <House delay={t(0.3)} />
            <Header t={t} />
            <Address delay={t(1.8)} />
          </div>
          <div className={styles.colRight}>
            <VenueQRRow qrDelay={t(3.0)} buttonDelay={t(3.5)} />
            <Reveal delay={t(4.2)}>
              <BilingualText text={config.copy.venueTagline} variant="display" className={styles.tagline} />
            </Reveal>
          </div>
        </div>
      ) : (
        <LayoutGroup id="scene-venue">
          {/* beat 2 drops the locality line so the QR beat clears the bottom garlands */}
          <Header t={(s) => t(s - 0.6)} locality={!beat2} />
          <AnimatePresence mode="wait" initial={false}>
            {!beat2 ? (
              <motion.div
                key="beat1"
                className={styles.beat}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.55, ease: EASE } }}
              >
                <House delay={t(0.2)} />
                <Address delay={t(1.5)} />
              </motion.div>
            ) : (
              <motion.div key="beat2" className={styles.beat} initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                <VenueQRRow qrDelay={0.05} buttonDelay={t(0.6)} />
                <Reveal delay={t(1.2)}>
                  <BilingualText text={config.copy.venueTagline} variant="display" className={styles.tagline} />
                </Reveal>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      )}
    </section>
  );
}

export const SceneVenue = sceneMemo(SceneVenueImpl);
export default SceneVenue;
