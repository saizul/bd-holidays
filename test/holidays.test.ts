import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TYPES,
  UnsupportedYearError,
  dataCoverage,
  findHolidays,
  getHolidays,
  getHolidaysBetween,
  getHolidaysInMonth,
  getHolidaysOn,
  groupIntoRanges,
  isHoliday,
  isSupportedYear,
  nextHoliday,
  normaliseRegion,
  previousHoliday,
} from '../src/index.js';

describe('isHoliday', () => {
  test('general and executive holidays count by default', () => {
    assert.equal(isHoliday('2026-12-16'), true); // Victory Day, general
    assert.equal(isHoliday('2026-04-14'), true); // Pohela Boishakh, executive
    assert.equal(isHoliday('2026-03-23'), true); // Eid-ul-Fitr extended, executive
    assert.equal(isHoliday('2026-12-17'), false);
  });

  test('optional holidays only count when asked for', () => {
    assert.equal(isHoliday('2026-01-23'), false); // Saraswati Puja, optional (Hindu)
    assert.equal(isHoliday('2026-01-23', { religions: ['hindu'] }), true);
    assert.equal(isHoliday('2026-01-23', { religions: ['muslim'] }), false);
    assert.equal(isHoliday('2026-01-23', { types: ['optional'] }), true);
  });

  test('weekends are not holidays by themselves', () => {
    assert.equal(isHoliday('2026-01-02'), false); // a Friday with no holiday
  });

  test('region-limited holidays need a matching region', () => {
    assert.equal(isHoliday('2027-04-13'), false);
    assert.equal(isHoliday('2027-04-13', { region: 'Rangamati' }), true);
    assert.equal(isHoliday('2027-04-13', { region: 'khagrachari' }), true);
    assert.equal(isHoliday('2027-04-13', { region: 'বান্দরবান' }), true);
    assert.equal(isHoliday('2027-04-13', { region: 'Dhaka' }), false);
    // In other districts Buddhist employees can take it as an optional holiday.
    assert.equal(isHoliday('2027-04-13', { religions: ['buddhist'] }), true);
  });

  test('tentative dates can be excluded', () => {
    assert.equal(isHoliday('2027-03-10'), true);
    assert.equal(isHoliday('2027-03-10', { includeTentative: false }), false);
    assert.equal(isHoliday('2027-03-26', { includeTentative: false }), true);
  });

  test('accepts Date objects in Dhaka time', () => {
    // 2026-12-15T19:00Z is 16 December 01:00 in Dhaka.
    assert.equal(isHoliday(new Date('2026-12-15T19:00:00Z')), true);
    assert.equal(isHoliday(new Date('2026-12-15T17:00:00Z')), false);
  });

  test('throws for years without data', () => {
    assert.throws(() => isHoliday('2024-12-16'), UnsupportedYearError);
    assert.throws(() => isHoliday('2028-02-21'), (err: unknown) => err instanceof UnsupportedYearError && err.year === 2028);
    assert.equal(isSupportedYear(2026), true);
    assert.equal(isSupportedYear(2028), false);
  });

  test('rejects unknown filter values', () => {
    assert.throws(() => isHoliday('2026-01-01', { types: ['bank' as never] }), /Unknown holiday type/);
    assert.throws(() => isHoliday('2026-01-01', { religions: ['jedi' as never] }), /Unknown religion/);
  });
});

describe('listing', () => {
  test('getHolidays default counts general + executive days (region-limited excluded)', () => {
    // 2027: 15 general (one CHT-only) + 14 executive = 28 nationwide entries.
    assert.equal(getHolidays(2027).length, 28);
    assert.equal(getHolidays(2027, { region: 'Bandarban' }).length, 29);
    // 2025: 12 general + July Uprising amendment + 14 executive.
    assert.equal(getHolidays(2025).length, 27);
  });

  test('getHolidays sorts by date then type', () => {
    const list = getHolidays(2026, { types: [...ALL_TYPES] });
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1]!.date <= list[i]!.date);
    const may1 = list.filter((h) => h.date === '2026-05-01').map((h) => h.id);
    assert.deepEqual(may1.sort(), ['buddha-purnima', 'may-day']);
  });

  test('religion filter lists only that religion among optional days', () => {
    const hindu = getHolidays(2026, { types: ['optional'], religions: ['hindu'] });
    assert.equal(hindu.length, 9);
    assert.ok(hindu.every((h) => h.religion === 'hindu'));
    const christian = getHolidays(2027, { types: ['optional'], religions: ['christian'] });
    assert.deepEqual(
      christian.map((h) => h.date),
      ['2027-01-01', '2027-02-10', '2027-03-25', '2027-03-26', '2027-03-27', '2027-03-28', '2027-12-24', '2027-12-26'],
    );
  });

  test('getHolidaysInMonth', () => {
    const march2027 = getHolidaysInMonth(2027, 3);
    assert.deepEqual(
      [...new Set(march2027.map((h) => h.date))],
      ['2027-03-05', '2027-03-07', '2027-03-08', '2027-03-09', '2027-03-10', '2027-03-11', '2027-03-12', '2027-03-26'],
    );
    assert.throws(() => getHolidaysInMonth(2027, 13), RangeError);
    assert.deepEqual(getHolidaysInMonth(2027, 7), []);
  });

  test('getHolidaysOn returns every matching entry on a date', () => {
    const d = getHolidaysOn('2027-05-20');
    assert.deepEqual(d.map((h) => `${h.type}:${h.id}`), ['general:buddha-purnima', 'executive:eid-ul-azha-extended']);
    assert.deepEqual(getHolidaysOn('2027-05-22'), []);
  });

  test('getHolidaysBetween spans years', () => {
    const list = getHolidaysBetween('2025-12-15', '2026-01-31');
    assert.deepEqual(
      list.map((h) => h.date),
      ['2025-12-16', '2025-12-25'],
    );
    const withOptional = getHolidaysBetween('2025-12-15', '2026-01-31', { types: [...ALL_TYPES] });
    assert.ok(withOptional.some((h) => h.date === '2026-01-01'));
    assert.throws(() => getHolidaysBetween('2026-02-01', '2026-01-01'), RangeError);
    assert.throws(() => getHolidaysBetween('2027-12-01', '2028-01-31'), UnsupportedYearError);
  });

  test('nextHoliday and previousHoliday', () => {
    assert.deepEqual(nextHoliday('2026-12-16').map((h) => h.id), ['christmas']);
    assert.deepEqual(nextHoliday('2026-12-25').map((h) => h.date), ['2027-01-24']);
    assert.deepEqual(nextHoliday('2026-04-30').map((h) => h.id).sort(), ['buddha-purnima', 'may-day']);
    assert.deepEqual(previousHoliday('2027-01-24').map((h) => h.id), ['christmas']);
    assert.deepEqual(nextHoliday('2027-12-25'), []);
    assert.deepEqual(previousHoliday('2025-01-01'), []);
    assert.deepEqual(nextHoliday('2024-06-01').map((h) => h.date), ['2025-02-15']);
    assert.deepEqual(nextHoliday('2025-12-31', { religions: ['christian'] }).map((h) => h.id), ['english-new-year']);
  });

  test('findHolidays by id and name', () => {
    const eid = findHolidays('eid-ul-fitr');
    assert.deepEqual(eid.map((h) => h.date), ['2025-03-31', '2026-03-21', '2027-03-10']);
    assert.equal(findHolidays('Victory').length, 3);
    assert.equal(findHolidays('বিজয় দিবস').length, 3);
    assert.deepEqual(findHolidays('  '), []);
    assert.equal(findHolidays('Durga', { types: ['general'] }).length, 3);
  });

  test('groupIntoRanges merges consecutive days of one observance', () => {
    const ranges = groupIntoRanges(getHolidays(2026, { types: ['executive'] }));
    const azha = ranges.filter((r) => r.id === 'eid-ul-azha-extended');
    // 26-27 May, then (Eid on 28 May is a general holiday) 29-31 May.
    assert.deepEqual(
      azha.map((r) => [r.start, r.end, r.days]),
      [
        ['2026-05-26', '2026-05-27', 2],
        ['2026-05-29', '2026-05-31', 3],
      ],
    );
    assert.deepEqual(groupIntoRanges([]), []);
  });

  test('normaliseRegion and coverage', () => {
    assert.equal(normaliseRegion('Khagrachari District'), 'khagrachhari');
    assert.equal(normaliseRegion('Rangamati Hill District'), 'rangamati');
    assert.deepEqual(dataCoverage(), { from: '2025-01-01', to: '2027-12-31' });
  });
});
