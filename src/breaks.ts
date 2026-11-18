import { BusinessCalendar } from './calendar.js';
import { addDays, fromDayNumber, toDayNumber, toISODate } from './date.js';
import { UnsupportedYearError } from './holidays.js';
import type { CalendarOptions, DateInput, Holiday, ISODate } from './types.js';

/** Options for {@link findBreaks}: a calendar plus what counts as a break. */
export interface BreakOptions extends CalendarOptions {
  /** Shortest stretch of days off to report, leave included. Default 3. */
  minDays?: number;
  /**
   * Working days you are willing to take as leave to join days off into a longer break.
   * Default 0: only breaks that need no leave.
   */
  maxLeave?: number;
}

/** A run of consecutive days off, possibly bridged with leave days. */
export interface Break {
  start: ISODate;
  end: ISODate;
  /** Calendar days from `start` to `end`, inclusive. */
  days: number;
  /** Working days inside the break that need leave (empty for a natural break). */
  leaveDays: ISODate[];
  /** The holidays inside the break, in date order. */
  holidays: Holiday[];
}

/** How far past the requested range a break is followed to find its true length. */
const EDGE_SCAN_DAYS = 31;

interface Run {
  start: number;
  end: number;
}

/**
 * Long weekends and holiday breaks between `from` and `to` (inclusive), for planning leave.
 *
 * A break is a run of consecutive non-business days (weekends, holidays, extra closures) of at
 * least `minDays`. With `maxLeave` > 0, runs separated by at most that many working days are
 * also joined, and the working days in between are listed as `leaveDays`. Breaks that overlap
 * the range are reported whole, even if they start before `from` or end after `to`.
 *
 * ```js
 * findBreaks('2026-01-01', '2026-12-31', { minDays: 4, maxLeave: 1 });
 * ```
 */
export function findBreaks(from: DateInput, to: DateInput, options: BreakOptions = {}): Break[] {
  const { minDays = 3, maxLeave = 0, ...calendarOptions } = options;
  if (!Number.isInteger(minDays) || minDays < 1) throw new RangeError('minDays must be a positive integer');
  if (!Number.isInteger(maxLeave) || maxLeave < 0) throw new RangeError('maxLeave must be a non-negative integer');
  const first = toDayNumber(toISODate(from));
  const last = toDayNumber(toISODate(to));
  if (last < first) throw new RangeError('`to` must not be before `from`');
  const calendar = new BusinessCalendar(calendarOptions);

  // Days inside the range must be known; days just outside are best effort.
  const off = new Map<number, boolean>();
  for (let d = first; d <= last; d++) off.set(d, !calendar.isBusinessDay(fromDayNumber(d)));
  const edge = (d: number): boolean | undefined => {
    if (off.has(d)) return off.get(d);
    try {
      const value = !calendar.isBusinessDay(fromDayNumber(d));
      off.set(d, value);
      return value;
    } catch (err) {
      if (err instanceof UnsupportedYearError) return undefined;
      throw err;
    }
  };
  // Extend the scan window so breaks (and bridges) that cross the range edges are complete.
  let scanStart = first;
  for (let i = 0; i < EDGE_SCAN_DAYS + maxLeave && edge(scanStart - 1) !== undefined; i++) scanStart--;
  let scanEnd = last;
  for (let i = 0; i < EDGE_SCAN_DAYS + maxLeave && edge(scanEnd + 1) !== undefined; i++) scanEnd++;

  const runs: Run[] = [];
  for (let d = scanStart; d <= scanEnd; d++) {
    if (!off.get(d)) continue;
    const previous = runs[runs.length - 1];
    if (previous && previous.end === d - 1) previous.end = d;
    else runs.push({ start: d, end: d });
  }

  const found = new Map<string, Break>();
  for (let a = 0; a < runs.length; a++) {
    let leave = 0;
    for (let b = a; b < runs.length; b++) {
      if (b > a) leave += runs[b]!.start - runs[b - 1]!.end - 1;
      if (leave > maxLeave) break;
      const start = runs[a]!.start;
      const end = runs[b]!.end;
      if (end < first || start > last) continue;
      // A break cut off by the edge of the bundled data is reported as far as it is known.
      if (end - start + 1 < minDays) continue;
      const key = `${start}:${end}`;
      if (!found.has(key)) found.set(key, describe(calendar, start, end, off));
    }
  }
  return [...found.values()].sort((x, y) => x.start.localeCompare(y.start) || x.leaveDays.length - y.leaveDays.length);
}

function describe(calendar: BusinessCalendar, start: number, end: number, off: Map<number, boolean>): Break {
  const leaveDays: ISODate[] = [];
  const holidays: Holiday[] = [];
  for (let d = start; d <= end; d++) {
    const iso = fromDayNumber(d);
    if (!off.get(d)) leaveDays.push(iso);
    try {
      holidays.push(...calendar.status(iso).holidays);
    } catch (err) {
      if (!(err instanceof UnsupportedYearError)) throw err;
    }
  }
  const startIso = fromDayNumber(start);
  return { start: startIso, end: addDays(startIso, end - start), days: end - start + 1, leaveDays, holidays };
}
