// Calendar correctness (CALENDAR SPEC): pure grid module + config labels, plain Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.js';
import { buildMonthGrid, weekdayOf } from '../src/components/MonthCalendarGrid.js';
import { formatNumber, toBengaliDigits, toLatinDigits } from '../src/utils/bengaliDigits.js';

const grid = buildMonthGrid(config.event.isoDate, config.calendar.weekStartsOn, config.event.timeZone);

test('config date is November 2027 with a Sunday week start', () => {
  assert.equal(config.event.isoDate, '2027-11-23');
  assert.equal(config.calendar.weekStartsOn, 0);
  assert.equal(grid.year, 2027);
  assert.equal(grid.monthIndex, 10);
});

test('1 Nov 2027 is a Monday and 23 Nov 2027 is a Tuesday', () => {
  assert.equal(grid.firstWeekday, 1);
  assert.equal(weekdayOf(2027, 10, 1), 1);
  assert.equal(weekdayOf(2027, 10, 23), 2);
  assert.equal(grid.markedWeekday, 2);
  // Cross-check with an independent UTC computation.
  assert.equal(new Date(Date.UTC(2027, 10, 1)).getUTCDay(), 1);
  assert.equal(new Date(Date.UTC(2027, 10, 23)).getUTCDay(), 2);
});

test('30 days, 5 rows of 7, one leading blank', () => {
  assert.equal(grid.daysInMonth, 30);
  assert.equal(grid.rows.length, 5);
  for (const row of grid.rows) assert.equal(row.length, 7);
  assert.equal(grid.leadingBlanks, 1);
  assert.equal(grid.rows[0][0].day, null);
  assert.equal(grid.rows[0][1].day, 1);
  const days = grid.rows.flat().filter((c) => c.day !== null).map((c) => c.day);
  assert.deepEqual(days, Array.from({ length: 30 }, (_, i) => i + 1));
});

test('23rd sits in the Tuesday column of row 4 and is the only marked cell', () => {
  const marked = [];
  grid.rows.forEach((row, r) => row.forEach((c, col) => c.isMarked && marked.push({ r, col, c })));
  assert.equal(marked.length, 1);
  const [{ r, col, c }] = marked;
  assert.equal(c.day, 23);
  assert.equal(r, 3, 'row index 3 = row 4');
  assert.equal(col, 2, 'column 2 = Tuesday when weeks start on Sunday');
  assert.equal(c.weekday, 2);
  assert.equal(grid.weekdayOrder[col], 2);
});

test('every cell weekday matches its column', () => {
  grid.rows.forEach((row) =>
    row.forEach((c, col) => {
      assert.equal(c.weekday, grid.weekdayOrder[col]);
      if (c.day !== null) assert.equal(c.weekday, new Date(Date.UTC(2027, 10, c.day)).getUTCDay());
    }),
  );
});

test('grid is derived from the ISO date (not hardcoded): other months/week starts', () => {
  const feb = buildMonthGrid('2028-02-10', 0);
  assert.equal(feb.daysInMonth, 29); // leap year
  assert.equal(feb.firstWeekday, 2); // 1 Feb 2028 is a Tuesday
  const monStart = buildMonthGrid('2027-11-23', 1);
  assert.equal(monStart.leadingBlanks, 0);
  assert.throws(() => buildMonthGrid('2027-13-01'));
});

test('header and weekday strings come from config', () => {
  assert.equal(config.calendar.monthNames.bn[grid.monthIndex], 'নভেম্বর');
  assert.equal(config.calendar.monthNames.en[grid.monthIndex], 'November');
  assert.equal(`${config.calendar.monthNames.bn[10]} ${formatNumber(2027, 'bn')}`, 'নভেম্বর ২০২৭');
  assert.deepEqual(config.calendar.weekdayShort.bn, ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']);
  assert.equal(config.calendar.weekdayLong.en[grid.markedWeekday], 'Tuesday');
});

// Mirrors MonthCalendar.markedLabelFor (JSX, not importable from plain Node).
function markedLabel(side) {
  const cal = config.calendar;
  return cal.markedLabel[side]
    .replace('{day}', formatNumber(grid.markedDay, side))
    .replace('{month}', cal.monthNames[side][grid.monthIndex])
    .replace('{year}', formatNumber(grid.year, side))
    .replace('{weekday}', cal.weekdayLong[side][grid.markedWeekday]);
}

test('marked-date aria-label templates', () => {
  assert.equal(markedLabel('en'), '23 November 2027, Tuesday, reception');
  const bn = markedLabel('bn');
  assert.ok(bn.startsWith('২৩ নভেম্বর ২০২৭, মঙ্গলবার'), bn);
  assert.ok(!/[0-9{}]/.test(bn), `no Latin digits / unreplaced tokens in bn label: ${bn}`);
});

test('Bengali digit conversion 1..30 round-trips', () => {
  const bn = '০১২৩৪৫৬৭৮৯';
  for (let n = 1; n <= 30; n++) {
    const expected = String(n).replace(/\d/g, (d) => bn[d]);
    assert.equal(toBengaliDigits(n), expected);
    assert.equal(toLatinDigits(expected), String(n));
  }
  assert.equal(formatNumber(23, 'en'), '23');
  assert.equal(formatNumber(23, 'both'), '২৩');
});
