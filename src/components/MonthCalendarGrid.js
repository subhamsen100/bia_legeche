/* ==========================================================================
   MonthCalendarGrid: PURE month-grid builder (no JSX, no CSS, no React).
   QA imports this with plain Node, so keep it dependency-free.

   buildMonthGrid('2027-11-23', 0) ->
   {
     year: 2027, monthIndex: 10, daysInMonth: 30,
     firstWeekday: 1,            // weekday of the 1st (0 = Sunday)
     leadingBlanks: 1,           // blank cells before the 1st (depends on weekStartsOn)
     markedDay: 23, markedWeekday: 2,
     weekdayOrder: [0..6],       // column -> weekday index
     rows: [[{ day: null|n, weekday: 0-6, isMarked }, ... 7], ...]
   }
   Weekdays are computed with Intl in the event time zone (Asia/Kolkata) at
   local noon, so the result never depends on the machine's time zone.
   ========================================================================== */

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Parse 'YYYY-MM-DD' -> { year, monthIndex, day } (throws on a malformed date). */
export function parseIsoDate(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!m) throw new Error(`buildMonthGrid: expected YYYY-MM-DD, got "${isoDate}"`);
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > daysInMonthOf(year, monthIndex)) {
    throw new Error(`buildMonthGrid: invalid date "${isoDate}"`);
  }
  return { year, monthIndex, day };
}

/** Days in a month (monthIndex 0-11). */
export function daysInMonthOf(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Weekday (0 = Sunday) of a calendar date in `timeZone`.
 * Uses 06:30 UTC (= 12:00 IST) so the date is the same calendar day in any zone from UTC-6 to UTC+14.
 */
export function weekdayOf(year, monthIndex, day, timeZone = 'Asia/Kolkata') {
  const instant = new Date(Date.UTC(year, monthIndex, day, 6, 30));
  try {
    const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(instant);
    if (name in WEEKDAY_INDEX) return WEEKDAY_INDEX[name];
  } catch {
    /* Intl without time-zone data: fall through to the UTC computation */
  }
  return new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
}

/**
 * @param {string} isoDate 'YYYY-MM-DD' (the marked date; its month is shown)
 * @param {number} [weekStartsOn=0] 0 = Sunday ... 6 = Saturday
 * @param {string} [timeZone='Asia/Kolkata']
 */
export function buildMonthGrid(isoDate, weekStartsOn = 0, timeZone = 'Asia/Kolkata') {
  const { year, monthIndex, day: markedDay } = parseIsoDate(isoDate);
  const start = ((Number(weekStartsOn) % 7) + 7) % 7;
  const daysInMonth = daysInMonthOf(year, monthIndex);
  const firstWeekday = weekdayOf(year, monthIndex, 1, timeZone);
  const leadingBlanks = (firstWeekday - start + 7) % 7;
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (start + i) % 7);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const rows = [];
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(
      cells.slice(r * 7, r * 7 + 7).map((day, c) => ({
        day,
        weekday: weekdayOrder[c],
        isMarked: day === markedDay,
      })),
    );
  }

  return {
    year,
    monthIndex,
    daysInMonth,
    firstWeekday,
    leadingBlanks,
    markedDay,
    markedWeekday: weekdayOf(year, monthIndex, markedDay, timeZone),
    weekdayOrder,
    rows,
  };
}

export default buildMonthGrid;
