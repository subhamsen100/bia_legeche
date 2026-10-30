/* SceneFinal: the free-scroll page after the guided sequence. Everything in
   one place, in lal-paar framed sections that fade up as they scroll in:
   hero (names, date line) . invitation message . couple & parents . date
   (calendar with the blinking heart + countdown) . venue (house, addresses,
   QR + Open in Maps) . closing blessing + Replay + Share on WhatsApp. */
import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { BilingualText } from './BilingualText.jsx';
import { Countdown } from './Countdown.jsx';
import { FamilyCard } from './FamilyCard.jsx';
import { FloralVine } from './FloralVine.jsx';
import { KolkaHeart } from './KolkaHeart.jsx';
import { LalPaarFrame } from './LalPaarFrame.jsx';
import { LanternHouse } from './LanternHouse.jsx';
import { MonthCalendar } from './MonthCalendar.jsx';
import { DateBloom, useDateParts } from './SceneDate.jsx';
import { VenueQRRow } from './SceneVenue.jsx';
import { EASE, GoldRule, useAfter } from './SceneKit.jsx';
import { WhatsAppShare } from './WhatsAppShare.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneFinal.module.css';

/* Fades up when scrolled into view; reveals anyway after REVEAL_FALLBACK_S so
   nothing stays hidden for full-page captures / print / no-IntersectionObserver. */
const REVEAL_FALLBACK_S = 3.5;

function InView({ children, className, as = 'section', ...rest }) {
  const M = motion[as] || motion.section;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const late = useAfter(REVEAL_FALLBACK_S);
  const shown = inView || late;
  return (
    <M
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 26 }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
      transition={{ duration: 0.9, ease: EASE }}
      {...rest}
    >
      {children}
    </M>
  );
}

function SectionHeading({ text, id }) {
  return (
    <div className={styles.headingWrap}>
      <BilingualText as="h2" id={id} text={text} variant="display" className={styles.heading} data-perch="" />
      <GoldRule draw={false} className={styles.headingRule} />
    </div>
  );
}

function ReplayIcon() {
  return (
    <svg className={styles.btnIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4.2h4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const SceneFinal = memo(function SceneFinal({ onReplay }) {
  const { lang, num } = useLanguage();
  const parts = useDateParts();
  const msg = config.copy.message;
  const numSide = lang === 'en' ? 'en' : 'bn';

  return (
    <article className={styles.page} data-scene="final" data-lang-mode={lang}>
      {/* ---------- hero ---------- */}
      <InView as="header" className={styles.hero}>
        <BilingualText text={config.event.name} variant="display" className={`${layout.kicker} ${styles.kicker}`} />
        <BilingualText as="h1" text={config.couple.names} variant="names" className={styles.names} data-perch="" />
        <span className={styles.heroHeart} aria-hidden="true">
          <KolkaHeart draw={false} bounce size="var(--final-heart)" />
        </span>
        <BilingualText text={parts.long} variant="display" className={styles.heroDate} />
        <BilingualText text={config.event.timeLabel} variant="display" className={styles.heroTime} />
      </InView>

      {/* ---------- invitation message ---------- */}
      <InView className={styles.section} aria-label={lang === 'en' ? msg.en[0] : msg.bn[0]}>
        <LalPaarFrame>
          <div className={styles.message}>
            {lang !== 'en' && (
              <p lang="bn" className={styles.msgBn}>
                {msg.bn.map((l, i) => (
                  <span key={i} className={i === 0 ? styles.lead : undefined}>
                    {l}
                  </span>
                ))}
              </p>
            )}
            {lang === 'both' && <GoldRule draw={false} className={styles.msgRule} />}
            {lang !== 'bn' && (
              <p lang="en" className={styles.msgEn}>
                {msg.en.map((l, i) => (
                  <span key={i} className={i === 0 ? styles.lead : undefined}>
                    {l}
                  </span>
                ))}
              </p>
            )}
          </div>
        </LalPaarFrame>
      </InView>

      {/* ---------- couple & families ---------- */}
      <InView className={styles.section} aria-labelledby="final-couple">
        <LalPaarFrame>
          <SectionHeading id="final-couple" text={config.copy.sectionHeadings.couple} />
          <div className={styles.couple}>
            <FamilyCard kind="bride" layout="column" animate={false} bloom={false} headingAs="h3" className={styles.family} />
            <div className={styles.coupleVine} aria-hidden="true">
              <FloralVine orientation="horizontal" draw={false} />
            </div>
            <FamilyCard kind="groom" layout="column" animate={false} bloom={false} headingAs="h3" className={styles.family} />
          </div>
        </LalPaarFrame>
      </InView>

      {/* ---------- date ---------- */}
      <InView className={styles.section} aria-labelledby="final-date">
        <LalPaarFrame>
          <SectionHeading id="final-date" text={config.copy.sectionHeadings.date} />
          <div className={styles.dateLockup}>
            <div className={styles.dateNum}>
              <DateBloom delay={0.2} />
              <span className={styles.dayBig} lang={numSide} aria-hidden="true">
                {num(parts.day)}
              </span>
            </div>
            <div className={styles.dateMeta}>
              <BilingualText text={parts.weekday} variant="display" className={styles.dateWeekday} />
              <BilingualText text={parts.monthYear} variant="display" className={styles.dateMonth} />
              <BilingualText text={config.event.timeLabel} variant="display" className={styles.dateTime} />
            </div>
          </div>
          <p className="visually-hidden">{lang === 'en' ? parts.long.en : lang === 'bn' ? parts.long.bn : `${parts.long.bn} / ${parts.long.en}`}</p>
          <BilingualText text={config.copy.dateTagline} variant="display" className={styles.tagline} />
          <div className={styles.calendarWrap}>
            <MonthCalendar animate delay={0.3} startAfter={REVEAL_FALLBACK_S + 0.4} id="final-calendar" />
          </div>
          <div className={styles.countdownWrap}>
            <Countdown />
          </div>
        </LalPaarFrame>
      </InView>

      {/* ---------- venue ---------- */}
      <InView className={styles.section} aria-labelledby="final-venue">
        <LalPaarFrame>
          <SectionHeading id="final-venue" text={config.copy.sectionHeadings.venue} />
          <div className={styles.house}>
            <LanternHouse play />
          </div>
          <BilingualText as="h3" text={config.venue.name} variant="display" className={styles.venueName} data-perch="" />
          <BilingualText text={config.venue.locality} variant="display" className={styles.locality} />
          <address className={styles.address}>
            <BilingualText text={config.venue.address} variant="body" className={styles.addressText} />
          </address>
          <VenueQRRow animate={false} className={styles.qrRow} />
          <BilingualText text={config.copy.venueTagline} variant="display" className={styles.tagline} />
        </LalPaarFrame>
      </InView>

      {/* ---------- closing + actions ---------- */}
      <InView as="footer" className={styles.closing}>
        <KolkaHeart draw={false} size="var(--final-heart)" />
        <BilingualText text={config.copy.closing} variant="display" className={styles.closingText} />
        <GoldRule draw={false} className={styles.closingRule} />
        <BilingualText text={config.copy.signed} variant="names" className={styles.signed} />
        <div className={styles.actions}>
          <button type="button" className={styles.replay} onClick={onReplay} data-no-skip="" data-replay="">
            <ReplayIcon />
            <BilingualText as="span" text={config.copy.replay} variant="body" className={styles.btnLabel} />
          </button>
          <WhatsAppShare />
        </div>
      </InView>
    </article>
  );
});

export default SceneFinal;
