import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  daysInMonth,
  fromDayNumber,
  isLeapYear,
  isValidISODate,
  parseWeekday,
  toDayNumber,
  toISODate,
  todayInDhaka,
  weekdayIndex,
  weekdayName,
} from '../src/date.js';

describe('date helpers', () => {
  test('validates ISO dates including leap years', () => {
    assert.ok(isValidISODate('2024-02-29'));
    assert.ok(!isValidISODate('2025-02-29'));
    assert.ok(!isValidISODate('2025-13-01'));
    assert.ok(!isValidISODate('2025-00-10'));
    assert.ok(!isValidISODate('2025-04-31'));
    assert.ok(!isValidISODate('2025-4-1'));
    assert.ok(!isValidISODate('20250401'));
    assert.ok(isValidISODate('2000-02-29'));
    assert.ok(!isValidISODate('1900-02-29'));
  });

  test('leap years and month lengths', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2100), false);
    assert.equal(daysInMonth(2026, 2), 28);
    assert.equal(daysInMonth(2028, 2), 29);
    assert.equal(daysInMonth(2026, 12), 31);
    assert.equal(daysInMonth(2026, 13), 0);
  });

  test('toISODate trims strings and rejects bad input', () => {
    assert.equal(toISODate(' 2026-03-26 '), '2026-03-26');
    assert.throws(() => toISODate('2026-02-30'), RangeError);
    assert.throws(() => toISODate('tomorrow'), RangeError);
    assert.throws(() => toISODate(new Date('nope')), TypeError);
    assert.throws(() => toISODate(42 as unknown as string), TypeError);
  });

  test('Date objects are read in Dhaka time (UTC+6)', () => {
    // 20:00 UTC on 30 March is 02:00 on 31 March in Dhaka.
    assert.equal(toISODate(new Date('2025-03-30T20:00:00Z')), '2025-03-31');
    assert.equal(toISODate(new Date('2025-03-30T17:59:59Z')), '2025-03-30');
    assert.equal(toISODate(new Date('2025-03-30T18:00:00Z')), '2025-03-31');
    assert.equal(todayInDhaka(new Date('2026-12-31T19:00:00Z')), '2027-01-01');
  });

  test('day numbers round-trip and weekdays are correct', () => {
    assert.equal(toDayNumber('1970-01-01'), 0);
    assert.equal(fromDayNumber(toDayNumber('2027-12-31')), '2027-12-31');
    assert.equal(weekdayName('2026-03-26'), 'Thu');
    assert.equal(weekdayName('2025-12-16'), 'Tue');
    assert.equal(weekdayIndex('1969-12-31'), 3);
    assert.equal(weekdayName('2027-02-21'), 'Sun');
  });

  test('addDays crosses months and years', () => {
    assert.equal(addDays('2025-12-31', 1), '2026-01-01');
    assert.equal(addDays('2028-03-01', -1), '2028-02-29');
    assert.equal(addDays('2026-01-15', 0), '2026-01-15');
    assert.equal(addDays('2026-01-15', 365), '2027-01-15');
  });

  test('parseWeekday accepts numbers and names', () => {
    assert.equal(parseWeekday(5), 5);
    assert.equal(parseWeekday('fri'), 5);
    assert.equal(parseWeekday('Saturday'), 6);
    assert.equal(parseWeekday(' SUN '), 0);
    assert.throws(() => parseWeekday(7), RangeError);
    assert.throws(() => parseWeekday(1.5), RangeError);
    assert.throws(() => parseWeekday('funday'), RangeError);
  });
});
