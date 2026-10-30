/* Scene 5 (date reveal, nominal 14s). Must fit 360x640 with no scrolling.
   0.2s  conch + ulu-dhwani ripples; marigold bloom opens behind the number
   0.4s  big "২৩" / "23" flips down into place (rotateX)
   1.0s  weekday + month/year;  1.9s  tagline
   3.4s  "compress upward": the hero lockup glides to the top (framer layout
         animation; mobile -> one row [date | weekday, month] with the conch
         bowing out so the row clears the corner garlands; desktop -> left column)
   4.1s  calendar card fades in once the lockup has settled; rows fade in one by
         one from 4.5s (0.16s apart)
   ~5.8s heart draws itself round the 23rd (1.2s), then blinks for the rest
   6.3s  live countdown fades up; everything holds until 14s. */
import { useMemo } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotionConfig } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { formatNumber } from '../utils/bengaliDigits.js';
import { BilingualText } from './BilingualText.jsx';
import { Countdown } from './Countdown.jsx';
import { MonthCalendar } from './MonthCalendar.jsx';
import { buildMonthGrid } from './MonthCalendarGrid.js';
import { ShankhRipple } from './ShankhRipple.jsx';
import { EASE, Reveal, sceneMemo, useAfter, useMediaQuery, useTiming } from './SceneKit.jsx';
import layout from './SceneLayout.module.css';
import styles from './SceneDate.module.css';

const LAYOUT_T = { layout: { duration: 0.95, ease: [0.65, 0, 0.35, 1] } };

/** Weekday + month/year pairs derived from the ISO date (never stored as text). */
export function useDateParts() {
  return useMemo(() => {
    const cal = config.calendar;
    const g = buildMonthGrid(config.event.isoDate, cal.weekStartsOn, config.event.timeZone);
    const side = (s) => ({
      weekday: cal.weekdayLong[s][g.markedWeekday],
      month: cal.monthNames[s][g.monthIndex],
      day: formatNumber(g.markedDay, s),
      year: formatNumber(g.year, s),
    });
    const bn = side('bn');
    const en = side('en');
    return {
      grid: g,
      day: g.markedDay,
      meta: { bn: `${bn.weekday}, ${bn.month} ${bn.year}`, en: `${en.weekday}, ${en.month} ${en.year}` },
      weekday: { bn: bn.weekday, en: en.weekday },
      monthYear: { bn: `${bn.month} ${bn.year}`, en: `${en.month} ${en.year}` },
      long: { bn: `${bn.weekday}, ${bn.day} ${bn.month} ${bn.year}`, en: `${en.weekday}, ${en.day} ${en.month} ${en.year}` },
    };
  }, []);
}

const BLOOM_PETALS = Array.from({ length: 12 }, (_, i) => i * 30);

/** Marigold bloom ring that opens behind the big number. */
export function DateBloom({ delay = 0, className = '' }) {
  const reduced = useReducedMotionConfig();
  return (
    <motion.svg
      className={`${styles.bloom} ${reduced ? '' : styles.bloomSpin} ${className}`}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
      initial={{ opacity: 0, scale: 0.35, rotate: -40 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.6, ease: EASE, delay }}
    >
      <defs>
        <radialGradient id="sd-bloom-g">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity="1" />
          <stop offset=".55" stopColor="#FDEFC4" stopOpacity=".9" />
          <stop offset="1" stopColor="#FDEFC4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="96" fill="url(#sd-bloom-g)" />
      <g>
        {BLOOM_PETALS.map((a) => (
          <path
            key={a}
            transform={`rotate(${a})`}
            d="M0-58C11-66 13-82 0-94C-13-82-11-66 0-58Z"
            fill="#FDEFC4"
            stroke="#C9A24B"
            strokeWidth="1.1"
          />
        ))}
        {BLOOM_PETALS.map((a) => (
          <circle key={`d${a}`} transform={`rotate(${a + 15})`} cx="0" cy="-70" r="2" fill="#F2A900" />
        ))}
      </g>
      <circle r="56" fill="none" stroke="#C9A24B" strokeWidth=".8" strokeDasharray="1.5 4" strokeLinecap="round" />
      <circle r="50" fill="none" stroke="#C9A24B" strokeOpacity=".55" strokeWidth=".6" />
    </motion.svg>
  );
}

function SceneDateImpl({ durationMs = 14000 }) {
  const { lang, num } = useLanguage();
  const t = useTiming(durationMs, 14000);
  const parts = useDateParts();
  const compact = useAfter(t(3.4));
  // must match the desktop media query in SceneDate.module.css
  const desktop = useMediaQuery('(min-width: 900px) and (min-height: 560px)');
  // mobile: the conch bows out just before the compress so the row is only [date | meta]
  const shankhOut = useAfter(Math.max(0, t(3.4) - 0.45));
  const numSide = lang === 'en' ? 'en' : 'bn';

  return (
    <section className={`${layout.scene} ${styles.scene}`} data-scene="date" data-phase={compact ? 'compact' : 'hero'} data-lang-mode={lang}>
      <span className={`${layout.halo} ${styles.halo}`} aria-hidden="true" />
      <LayoutGroup id="scene-date">
        <motion.div layout className={styles.top} transition={LAYOUT_T}>
          <motion.div layout className={styles.lockup} transition={LAYOUT_T}>
            <AnimatePresence initial={false}>
              {(desktop || !shankhOut) && (
                <motion.div
                  key="shankh"
                  layout
                  className={styles.shankh}
                  transition={LAYOUT_T}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                >
                  <ShankhRipple play />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div layout className={styles.dayWrap} transition={LAYOUT_T}>
              <DateBloom delay={t(0.2)} />
              <motion.h1
                className={styles.day}
                lang={numSide}
                data-perch=""
                aria-label={lang === 'both' ? `${parts.long.bn} / ${parts.long.en}` : parts.long[numSide]}
                initial={{ opacity: 0, rotateX: -100 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ duration: 1.25, ease: [0.2, 0.9, 0.3, 1.12], delay: t(0.4) }}
              >
                <span aria-hidden="true">{num(parts.day)}</span>
              </motion.h1>
            </motion.div>
            <motion.div layout className={styles.meta} transition={LAYOUT_T}>
              <Reveal delay={t(1.0)}>
                <BilingualText text={parts.meta} variant="display" className={styles.metaText} />
              </Reveal>
            </motion.div>
          </motion.div>
          <motion.div layout className={styles.tagline} transition={LAYOUT_T}>
            <Reveal delay={t(1.9)}>
              <BilingualText text={config.copy.dateTagline} variant="display" className={styles.taglineText} />
            </Reveal>
          </motion.div>
        </motion.div>

        {compact && (
          <motion.div
            layout
            className={styles.bottom}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...LAYOUT_T, opacity: { duration: 0.6, delay: 0.7 } }}
          >
            <MonthCalendar animate delay={t(1.1)} rowStagger={t(0.16)} className={styles.calendar} />
            <Reveal delay={t(2.9)} className={styles.countdown}>
              <Countdown compact />
            </Reveal>
          </motion.div>
        )}
      </LayoutGroup>
    </section>
  );
}

export const SceneDate = sceneMemo(SceneDateImpl);
export default SceneDate;
