import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BusinessCalendar,
  UnsupportedYearError,
  addBusinessDays,
  businessDaysBetween,
  businessDaysInMonth,
  isBusinessDay,
  isWeekend,
  nextBusinessDay,
  previousBusinessDay,
  subtractBusinessDays,
} from '../src/index.js';

describe('default government calendar (Fri+Sat weekend)', () => {
  test('weekends', () => {
    assert.equal(isWeekend('2026-01-02'), true); // Friday
    assert.equal(isWeekend('2026-01-03'), true); // Saturday
    assert.equal(isWeekend('2026-01-04'), false); // Sunday
  });

  test('isBusinessDay', () => {
    assert.equal(isBusinessDay('2026-01-04'), true);
    assert.equal(isBusinessDay('2026-01-02'), false);
    assert.equal(isBusinessDay('2026-12-16'), false); // Victory Day
    assert.equal(isBusinessDay('2026-01-01'), true); // optional Christian holiday only
    assert.equal(isBusinessDay('2026-01-01', { religions: ['christian'] }), false);
  });

  test('nextBusinessDay skips the whole Eid-ul-Fitr 2027 block', () => {
    // Holidays 7-12 March 2027 (Sun-Fri), then Saturday 13 March is a weekend.
    assert.equal(nextBusinessDay('2027-03-04'), '2027-03-14');
    assert.equal(previousBusinessDay('2027-03-14'), '2027-03-04');
  });

  test('nextBusinessDay skips Eid-ul-Azha 2026 (26-31 May)', () => {
    assert.equal(nextBusinessDay('2026-05-25'), '2026-06-01');
  });

  test('addBusinessDays forwards and backwards', () => {
    assert.equal(addBusinessDays('2026-12-14', 1), '2026-12-15');
    assert.equal(addBusinessDays('2026-12-14', 2), '2026-12-17'); // skips 16 Dec
    assert.equal(addBusinessDays('2026-12-14', 0), '2026-12-14');
    assert.equal(addBusinessDays('2026-12-17', -2), '2026-12-14');
    assert.equal(subtractBusinessDays('2026-12-17', 2), '2026-12-14');
    assert.equal(addBusinessDays('2026-12-31', 1), '2027-01-03'); // 1-2 Jan are Fri/Sat
    assert.throws(() => addBusinessDays('2026-01-01', 1.5), RangeError);
  });

  test('businessDaysBetween mirrors addBusinessDays', () => {
    const start = '2026-03-01';
    for (const n of [1, 5, 10, 20, 40]) {
      const end = addBusinessDays(start, n);
      assert.equal(businessDaysBetween(start, end), n, `n=${n}`);
      assert.equal(businessDaysBetween(end, start), -n);
    }
    assert.equal(businessDaysBetween('2026-01-01', '2026-01-01'), 0);
  });

  test('business days in a month', () => {
    // December 2026: 31 days, 8 weekend days (4 Fri + 4 Sat), Victory Day (Wed) and Christmas (Fri, already weekend).
    const dec = businessDaysInMonth(2026, 12);
    assert.equal(dec.length, 31 - 8 - 1);
    assert.ok(!dec.includes('2026-12-16'));
    assert.throws(() => businessDaysInMonth(2026, 0), RangeError);
  });

  test('throws outside bundled years by default', () => {
    assert.throws(() => isBusinessDay('2028-01-02'), UnsupportedYearError);
    assert.throws(() => addBusinessDays('2027-12-30', 3), UnsupportedYearError);
  });
});

describe('BusinessCalendar options', () => {
  test('custom weekend (Friday only, as many private firms use)', () => {
    const cal = new BusinessCalendar({ weekend: ['Fri'] });
    assert.equal(cal.isBusinessDay('2026-01-03'), true); // Saturday
    assert.equal(cal.isBusinessDay('2026-01-02'), false);
    const satSun = new BusinessCalendar({ weekend: [6, 0] });
    assert.equal(satSun.isBusinessDay('2026-01-02'), true);
    assert.equal(satSun.isBusinessDay('2026-01-04'), false);
  });

  test('rejects a weekend that covers every day', () => {
    assert.throws(() => new BusinessCalendar({ weekend: [0, 1, 2, 3, 4, 5, 6] }), RangeError);
  });

  test('extra holidays and declared working days', () => {
    const cal = new BusinessCalendar({ extraHolidays: ['2026-01-04'], workingDays: ['2026-01-03', '2026-12-16'] });
    assert.equal(cal.isBusinessDay('2026-01-04'), false);
    assert.equal(cal.isBusinessDay('2026-01-03'), true); // working Saturday
    assert.equal(cal.isBusinessDay('2026-12-16'), true);
    assert.equal(cal.isHoliday('2026-01-04'), true);
    assert.equal(cal.isHoliday('2026-12-16'), true);
  });

  test('weekends-only policy for unknown years', () => {
    const cal = new BusinessCalendar({ unknownYear: 'weekends-only' });
    assert.equal(cal.isBusinessDay('2028-02-21'), true); // no data, Monday
    assert.equal(cal.isBusinessDay('2028-02-25'), false); // Friday
    assert.equal(cal.addBusinessDays('2027-12-30', 1), '2028-01-02');
    assert.throws(() => new BusinessCalendar({ unknownYear: 'maybe' as never }), RangeError);
  });

  test('region-aware calendar for a hill-district office', () => {
    const cal = new BusinessCalendar({ region: 'Rangamati' });
    assert.equal(cal.isBusinessDay('2026-04-13'), false);
    assert.equal(isBusinessDay('2026-04-13'), true);
  });

  test('excluding tentative dates', () => {
    const cal = new BusinessCalendar({ includeTentative: false });
    assert.equal(cal.isBusinessDay('2027-03-10'), true); // Eid date not counted
    assert.equal(cal.isBusinessDay('2027-03-26'), false); // fixed holiday, Friday anyway
    assert.equal(cal.isBusinessDay('2027-04-14'), false); // Pohela Boishakh
  });

  test('status explains why a day is off', () => {
    const cal = new BusinessCalendar();
    const s = cal.status('2027-05-20');
    assert.equal(s.businessDay, false);
    assert.equal(s.weekend, false);
    assert.deepEqual(s.holidays.map((h) => h.id), ['buddha-purnima', 'eid-ul-azha-extended']);
    const plain = cal.status('2027-05-23');
    assert.equal(plain.businessDay, true);
    assert.deepEqual(plain.holidays, []);
    assert.throws(() => cal.status('2030-01-01'), UnsupportedYearError);
  });

  test('roll conventions', () => {
    const cal = new BusinessCalendar();
    assert.equal(cal.roll('2026-01-04'), '2026-01-04');
    assert.equal(cal.roll('2026-01-02', 'following'), '2026-01-04');
    assert.equal(cal.roll('2026-01-02', 'preceding'), '2026-01-01'); // optional holiday only, so a business day
    // 31 Oct 2026 is a Saturday; following would be 1 Nov, so modified-following goes back.
    assert.equal(cal.roll('2026-10-31', 'modified-following'), '2026-10-29');
    // 1 Jan 2027 is a Friday; preceding would be in December, so modified-preceding goes forward.
    assert.equal(cal.roll('2027-01-01', 'modified-preceding'), '2027-01-03');
    assert.throws(() => cal.roll('2026-01-02', 'sideways' as never), RangeError);
  });

  test('businessDaysInRange', () => {
    const cal = new BusinessCalendar();
    assert.deepEqual(cal.businessDaysInRange('2026-12-14', '2026-12-19'), ['2026-12-14', '2026-12-15', '2026-12-17']);
    assert.throws(() => cal.businessDaysInRange('2026-12-19', '2026-12-14'), RangeError);
  });

  test('a full year count is stable', () => {
    const cal = new BusinessCalendar();
    const days = cal.businessDaysInRange('2026-01-01', '2026-12-31');
    // 365 days - 104 weekend days (52 Fri + 52 Sat; 2026 starts on Thursday so it has 53 Thursdays)
    // - weekday holidays. Holidays on weekdays in 2026 (nationwide general + executive):
    const weekdayHolidays = new Set(
      ['2026-02-04', '2026-03-17', '2026-03-19', '2026-03-22', '2026-03-23', '2026-03-26', '2026-04-14', '2026-05-26',
        '2026-05-27', '2026-05-28', '2026-05-31', '2026-08-05', '2026-08-26', '2026-10-20', '2026-10-21', '2026-12-16'],
    );
    assert.equal(days.length, 365 - 104 - weekdayHolidays.size);
  });
});
