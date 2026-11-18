import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findBreaks, UnsupportedYearError, type Break } from '../src/index.js';
import { runCli, type CliIO } from '../src/cli.js';

const span = (b: Break) => `${b.start}..${b.end}`;

function run(argv: string[]) {
  let stdout = '';
  let stderr = '';
  const io: CliIO = {
    stdout: (t) => (stdout += t),
    stderr: (t) => (stderr += t),
    writeFile: () => undefined,
    now: () => new Date('2026-11-15T06:00:00Z'),
  };
  return { code: runCli(argv, io), stdout, stderr };
}

describe('findBreaks', () => {
  test('natural breaks of three days or more in 2026', () => {
    const breaks = findBreaks('2026-01-01', '2026-12-31');
    assert.ok(breaks.every((b) => b.leaveDays.length === 0 && b.days >= 3));
    const spans = breaks.map(span);
    assert.ok(spans.includes('2026-03-19..2026-03-23'), 'Eid-ul-Fitr');
    assert.ok(spans.includes('2026-03-26..2026-03-28'), 'Independence Day on a Thursday');
    assert.ok(spans.includes('2026-05-26..2026-05-31'), 'Eid-ul-Azha');
    const eid = breaks.find((b) => b.start === '2026-05-26')!;
    assert.equal(eid.days, 6);
    assert.ok(eid.holidays.some((h) => h.name === 'Eid-ul-Azha'));
  });

  test('one day of leave bridges a Wednesday holiday to the weekend', () => {
    const breaks = findBreaks('2026-12-01', '2026-12-31', { maxLeave: 1 });
    const victory = breaks.find((b) => b.start === '2026-12-16')!;
    assert.equal(victory.end, '2026-12-19');
    assert.equal(victory.days, 4);
    assert.deepEqual(victory.leaveDays, ['2026-12-17']);
    assert.equal(victory.holidays[0]!.name, 'Victory Day');
  });

  test('natural breaks sort before bridged ones that start on the same day', () => {
    const breaks = findBreaks('2026-03-01', '2026-03-31', { maxLeave: 2 }).filter((b) => b.start === '2026-03-19');
    assert.ok(breaks.length >= 2);
    assert.equal(breaks[0]!.leaveDays.length, 0);
    assert.ok(breaks[1]!.leaveDays.length > 0);
  });

  test('minDays filters short breaks', () => {
    assert.deepEqual(findBreaks('2026-01-01', '2026-12-31', { minDays: 6 }).map(span), ['2026-05-26..2026-05-31']);
    const twoDay = findBreaks('2026-12-01', '2026-12-14', { minDays: 2 });
    assert.ok(twoDay.some((b) => b.days === 2 && b.holidays.length === 0), 'plain weekends with minDays 2');
  });

  test('calendar options change the result', () => {
    const fridayOnly = findBreaks('2026-03-24', '2026-03-31', { weekend: ['Fri'] });
    assert.ok(!fridayOnly.some((b) => b.start === '2026-03-26'), 'Thu + Fri is only two days');
    const extra = findBreaks('2026-12-01', '2026-12-31', { extraHolidays: ['2026-12-17'] });
    assert.ok(extra.some((b) => span(b) === '2026-12-16..2026-12-19' && b.leaveDays.length === 0));
    const working = findBreaks('2026-05-20', '2026-06-05', { workingDays: ['2026-05-28'] });
    assert.ok(!working.some((b) => b.start === '2026-05-26' && b.end === '2026-05-31'), 'a declared working day splits the break');
  });

  test('breaks that cross the range edges are reported whole', () => {
    assert.deepEqual(findBreaks('2026-03-21', '2026-03-21').map(span), ['2026-03-19..2026-03-23']);
  });

  test('stops at the end of the bundled data instead of failing near the edge', () => {
    const breaks = findBreaks('2027-12-20', '2027-12-31', { minDays: 2 });
    assert.equal(breaks.at(-1)!.start, '2027-12-31');
  });

  test('invalid options and unsupported years', () => {
    assert.throws(() => findBreaks('2026-01-01', '2026-01-31', { minDays: 0 }), RangeError);
    assert.throws(() => findBreaks('2026-01-01', '2026-01-31', { maxLeave: -1 }), RangeError);
    assert.throws(() => findBreaks('2026-02-01', '2026-01-01'), RangeError);
    assert.throws(() => findBreaks('2030-01-01', '2030-01-31'), UnsupportedYearError);
    const weekends = findBreaks('2030-01-01', '2030-01-31', { unknownYear: 'weekends-only', minDays: 2 });
    assert.ok(weekends.length >= 4 && weekends.every((b) => b.holidays.length === 0));
  });
});

describe('breaks CLI', () => {
  test('table with leave suggestions', () => {
    const r = run(['breaks', '2026', '--max-leave', '1']);
    assert.equal(r.code, 0);
    assert.match(r.stdout, /^From\s+To\s+Days\s+Leave\s+Holidays/);
    assert.match(r.stdout, /2026-12-16 Wed\s+2026-12-19 Sat\s+4\s+2026-12-17\s+Victory Day/);
    assert.match(r.stdout, /2026-03-26 Thu\s+2026-03-28 Sat\s+3\s+-\s+Independence and National Day/);
  });

  test('json, ranges, Bangla names and an empty result', () => {
    const json = run(['breaks', '2026-12-01..2026-12-31', '--max-leave', '1', '--format', 'json']);
    const parsed = JSON.parse(json.stdout) as Break[];
    assert.ok(parsed.some((b) => b.start === '2026-12-16' && b.leaveDays[0] === '2026-12-17'));
    assert.match(run(['breaks', '2026-12-01..2026-12-31', '--max-leave', '1', '--lang', 'bn']).stdout, /বিজয় দিবস/);
    assert.equal(run(['breaks', '2026-12-01..2026-12-05', '--min-days', '9']).stdout, 'No breaks match.\n');
  });

  test('usage errors', () => {
    assert.equal(run(['breaks', '2026', '--min-days', '0']).code, 2);
    assert.equal(run(['breaks', '2026', '--max-leave', 'x']).code, 2);
    assert.equal(run(['breaks', '2026', '--format', 'ics']).code, 2);
    assert.equal(run(['breaks', 'soon']).code, 2);
    assert.equal(run(['breaks', '2031']).code, 1);
  });
});
