/* ==========================================================================
   MonthCalendar: month of config.event.isoDate (CALENDAR SPEC).
   - Grid from the pure buildMonthGrid(); week starts on config.calendar.weekStartsOn.
   - Header / weekday row / numerals follow the language mode.
   - Entrance (animate): rows fade in one by one, THEN the HeartMarker on the
     marked date draws itself (~1.2s), then blinks forever. The entrance starts
     when the card scrolls into view (immediately inside a scene).
   - Marked cell: maroon glow disc + ivory number, aria-label from
     calendar.markedLabel, PetalBurst on tap / hover / focus.
   ========================================================================== */
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotionConfig } from 'framer-motion';
import config from '../config.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { formatNumber } from '../utils/bengaliDigits.js';
import { buildMonthGrid } from './MonthCalendarGrid.js';
import { AlponaBorder } from './AlponaBorder.jsx';
import { HeartMarker } from './HeartMarker.jsx';
import { PetalBurst } from './PetalBurst.jsx';
import { useAfter, useMediaQuery } from './SceneKit.jsx';
import styles from './MonthCalendar.module.css';

const EASE = [0.22, 1, 0.36, 1];
const ROW_FADE_S = 0.5;
const HEART_DRAW_S = 1.2;

/** Accessible label for the marked date in one language side ('bn' | 'en'). */
export function markedLabelFor(side, grid = buildMonthGrid(config.event.isoDate, config.calendar.weekStartsOn, config.event.timeZone)) {
  const cal = config.calendar;
  return cal.markedLabel[side]
    .replace('{day}', formatNumber(grid.markedDay, side))
    .replace('{month}', cal.monthNames[side][grid.monthIndex])
    .replace('{year}', formatNumber(grid.year, side))
    .replace('{weekday}', cal.weekdayLong[side][grid.markedWeekday]);
}

/**
 * Heart marker size from the marked cell: ~1.45x the cell (so it reads as a
 * marker slightly larger than the cell) but capped so that, even at the 1.12
 * blink peak, it never covers the neighbouring numbers.
 */
function useHeartSize(cellRef, cap) {
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const el = cellRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((b) => (b && Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellRef]);
  if (!box || !box.w) return Math.min(cap, 62);
  return Math.round(Math.max(44, Math.min(cap, box.w * 1.45, box.h * 1.55)));
}

export const MonthCalendar = memo(function MonthCalendar({
  animate = true,
  delay = 0, // seconds before the first row appears (after the card is in view)
  rowStagger = 0.16,
  startAfter, // seconds: start even if never scrolled into view (full-page captures)
  className = '',
  id,
}) {
  const { lang } = useLanguage();
  const reduced = useReducedMotionConfig();
  const wide = useMediaQuery('(min-width: 768px) and (min-height: 700px)');
  const markedRef = useRef(null);
  const heartSize = useHeartSize(markedRef, wide ? 74 : 64);
  const cal = config.calendar;
  const grid = useMemo(
    () => buildMonthGrid(config.event.isoDate, cal.weekStartsOn, config.event.timeZone),
    [cal.weekStartsOn],
  );

  const rootRef = useRef(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  const late = useAfter(startAfter > 0 ? startAfter : Infinity);
  const started = !animate || inView || late;
  const [burstKey, setBurstKey] = useState(0);
  const lastBurst = useRef(0);
  const burst = useCallback(() => {
    const t = Date.now();
    if (t - lastBurst.current < 350) return;
    lastBurst.current = t;
    setBurstKey((k) => k + 1);
  }, []);

  const rowsDone = delay + (grid.rows.length - 1) * rowStagger + ROW_FADE_S;
  const heartDelay = animate && !reduced ? rowsDone + 0.15 : animate ? rowsDone : 0;

  const numSide = lang === 'en' ? 'en' : 'bn';
  const markedLabel =
    lang === 'both' ? `${markedLabelFor('bn', grid)} / ${markedLabelFor('en', grid)}` : markedLabelFor(lang, grid);
  const monthBn = `${cal.monthNames.bn[grid.monthIndex]} ${formatNumber(grid.year, 'bn')}`;
  const monthEn = `${cal.monthNames.en[grid.monthIndex]} ${formatNumber(grid.year, 'en')}`;

  const rowMotion = (i) =>
    animate
      ? {
          initial: { opacity: 0, y: 8 },
          animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
          transition: { duration: ROW_FADE_S, ease: EASE, delay: delay + i * rowStagger },
        }
      : { initial: false };

  return (
    <motion.div
      ref={rootRef}
      id={id}
      className={`${styles.card} ${className}`}
      data-month-calendar=""
      data-lang-mode={lang}
      {...(animate
        ? {
            initial: { opacity: 0 },
            animate: { opacity: started ? 1 : 0 },
            transition: { duration: 0.6, ease: EASE, delay: Math.max(0, delay - 0.35) },
          }
        : {})}
    >
      <AlponaBorder className={styles.alpona} />

      <div className={styles.header} data-perch="">
        <span className={styles.headerOrn} aria-hidden="true" />
        <h3 className={styles.title} id={id ? `${id}-title` : undefined}>
          {lang !== 'en' && (
            <span lang="bn" className={styles.titleBn}>
              {monthBn}
            </span>
          )}
          {lang === 'both' && (
            <span className={styles.titleSep} lang="en" aria-hidden="true">
              /
            </span>
          )}
          {lang !== 'bn' && (
            <span lang="en" className={styles.titleEn}>
              {monthEn}
            </span>
          )}
        </h3>
        <span className={`${styles.headerOrn} ${styles.headerOrnR}`} aria-hidden="true" />
      </div>

      <div
        className={styles.grid}
        role="grid"
        aria-labelledby={id ? `${id}-title` : undefined}
        aria-label={id ? undefined : lang === 'en' ? monthEn : lang === 'bn' ? monthBn : `${monthBn} / ${monthEn}`}
        aria-readonly="true"
      >
        <div className={`${styles.row} ${styles.weekRow}`} role="row">
          {grid.weekdayOrder.map((wd) => (
            <span
              key={wd}
              role="columnheader"
              className={styles.weekday}
              aria-label={lang === 'en' ? cal.weekdayLong.en[wd] : lang === 'bn' ? cal.weekdayLong.bn[wd] : `${cal.weekdayLong.bn[wd]} / ${cal.weekdayLong.en[wd]}`}
            >
              {lang !== 'en' && (
                <span lang="bn" className={styles.wdBn} aria-hidden="true">
                  {cal.weekdayShort.bn[wd]}
                </span>
              )}
              {lang === 'en' && (
                <span lang="en" className={styles.wdEn} aria-hidden="true">
                  {cal.weekdayShort.en[wd]}
                </span>
              )}
              {lang === 'both' && (
                <span lang="en" className={styles.wdInitial} aria-hidden="true">
                  {cal.weekdayInitial.en[wd]}
                </span>
              )}
            </span>
          ))}
        </div>

        {grid.rows.map((row, r) => (
          <motion.div key={r} className={styles.row} role="row" data-row={r + 1} {...rowMotion(r)}>
            {row.map((cell, c) => {
              if (cell.day === null) {
                return <span key={c} role="gridcell" className={`${styles.cell} ${styles.blank}`} data-weekday={cell.weekday} />;
              }
              if (!cell.isMarked) {
                return (
                  <span key={c} role="gridcell" className={styles.cell} data-weekday={cell.weekday} data-day={cell.day}>
                    <span className={styles.num} lang={numSide}>
                      {formatNumber(cell.day, numSide)}
                    </span>
                  </span>
                );
              }
              return (
                <span
                  key={c}
                  ref={markedRef}
                  role="gridcell"
                  tabIndex={0}
                  style={{ '--cal-heart': `${heartSize}px` }}
                  data-heart-size={heartSize}
                  className={`${styles.cell} ${styles.marked}`}
                  data-weekday={cell.weekday}
                  data-day={cell.day}
                  data-marked-date={config.event.isoDate}
                  data-no-skip=""
                  aria-label={markedLabel}
                  aria-selected="true"
                  onClick={burst}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && burst()}
                  onFocus={burst}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      burst();
                    }
                  }}
                >
                  <span className={styles.disc} aria-hidden="true" />
                  <span className={styles.markedNums} aria-hidden="true">
                    <span className={styles.num} lang={numSide}>
                      {formatNumber(cell.day, numSide)}
                    </span>
                    {lang === 'both' && (
                      <span className={styles.latin} lang="en">
                        {formatNumber(cell.day, 'en')}
                      </span>
                    )}
                  </span>
                  {started && (
                    <HeartMarker
                      size={heartSize}
                      draw={animate}
                      blink
                      delay={heartDelay}
                      drawDuration={HEART_DRAW_S}
                      className={styles.heart}
                    />
                  )}
                  <PetalBurst burstKey={burstKey} count={12} />
                </span>
              );
            })}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

export default MonthCalendar;
