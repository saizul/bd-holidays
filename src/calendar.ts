import { yearHolidaysUnsafe } from './data/index.js';
import { addDays, fromDayNumber, parseWeekday, toDayNumber, toISODate, weekdayIndex, yearOf } from './date.js';
import { UnsupportedYearError, matchesFilter, resolveFilter, type ResolvedFilter } from './holidays.js';
import type { CalendarOptions, DateInput, Holiday, ISODate, UnknownYearPolicy } from './types.js';

/** Friday and Saturday: the weekly holidays of Bangladesh government offices. */
export const GOVERNMENT_WEEKEND: readonly number[] = Object.freeze([5, 6]);

export type RollConvention = 'following' | 'preceding' | 'modified-following' | 'modified-preceding';

/** Why a date is not a business day. */
export interface DayStatus {
  date: ISODate;
  businessDay: boolean;
  weekend: boolean;
  /** Matching holidays on the date. */
  holidays: Holiday[];
  /** Listed in `extraHolidays`. */
  extraHoliday: boolean;
  /** Listed in `workingDays` (overrides weekend and holidays). */
  workingDayOverride: boolean;
}

/** Limits the search loops so a misconfiguration cannot spin forever. */
const MAX_SCAN_DAYS = 366 * 50;

/**
 * A business-day calendar: weekly holidays plus the bundled government holidays,
 * with optional company-specific additions and overrides.
 */
export class BusinessCalendar {
  readonly weekend: ReadonlySet<number>;
  readonly unknownYear: UnknownYearPolicy;
  private readonly filter: ResolvedFilter;
  private readonly extra: ReadonlySet<ISODate>;
  private readonly working: ReadonlySet<ISODate>;
  private readonly holidayCache = new Map<number, ReadonlySet<ISODate>>();

  constructor(options: CalendarOptions = {}) {
    const weekend = new Set<number>((options.weekend ?? GOVERNMENT_WEEKEND).map(parseWeekday));
    if (weekend.size >= 7) throw new RangeError('The weekend cannot cover all seven days');
    this.weekend = weekend;
    this.unknownYear = options.unknownYear ?? 'throw';
    if (this.unknownYear !== 'throw' && this.unknownYear !== 'weekends-only') {
      throw new RangeError(`Invalid unknownYear policy "${String(this.unknownYear)}"`);
    }
    this.filter = resolveFilter(options);
    this.extra = new Set((options.extraHolidays ?? []).map(toISODate));
    this.working = new Set((options.workingDays ?? []).map(toISODate));
  }

  private holidaySet(year: number): ReadonlySet<ISODate> {
    let set = this.holidayCache.get(year);
    if (set) return set;
    const list = yearHolidaysUnsafe(year);
    if (!list) {
      if (this.unknownYear === 'throw') throw new UnsupportedYearError(year);
      set = new Set();
    } else {
      set = new Set(list.filter((h) => matchesFilter(h, this.filter)).map((h) => h.date));
    }
    this.holidayCache.set(year, set);
    return set;
  }

  isWeekend(date: DateInput): boolean {
    return this.weekend.has(weekdayIndex(toISODate(date)));
  }

  /** True if the date is a holiday under this calendar (bundled or extra), ignoring weekends. */
  isHoliday(date: DateInput): boolean {
    const iso = toISODate(date);
    return this.extra.has(iso) || this.holidaySet(yearOf(iso)).has(iso);
  }

  isBusinessDay(date: DateInput): boolean {
    return this.isBusinessISO(toISODate(date));
  }

  private isBusinessISO(iso: ISODate): boolean {
    if (this.working.has(iso)) return true;
    if (this.weekend.has(weekdayIndex(iso))) return false;
    if (this.extra.has(iso)) return false;
    return !this.holidaySet(yearOf(iso)).has(iso);
  }

  /** Detailed status of a date. */
  status(date: DateInput): DayStatus {
    const iso = toISODate(date);
    const list = yearHolidaysUnsafe(yearOf(iso));
    if (!list && this.unknownYear === 'throw') throw new UnsupportedYearError(yearOf(iso));
    const holidays = (list ?? []).filter((h) => h.date === iso && matchesFilter(h, this.filter)).map((h) => ({ ...h }));
    return {
      date: iso,
      businessDay: this.isBusinessISO(iso),
      weekend: this.weekend.has(weekdayIndex(iso)),
      holidays,
      extraHoliday: this.extra.has(iso),
      workingDayOverride: this.working.has(iso),
    };
  }

  /** The first business day strictly after `date`. */
  nextBusinessDay(date: DateInput): ISODate {
    return this.step(toISODate(date), 1);
  }

  /** The last business day strictly before `date`. */
  previousBusinessDay(date: DateInput): ISODate {
    return this.step(toISODate(date), -1);
  }

  private step(iso: ISODate, dir: 1 | -1): ISODate {
    let day = toDayNumber(iso);
    for (let i = 0; i < MAX_SCAN_DAYS; i++) {
      day += dir;
      const candidate = fromDayNumber(day);
      if (this.isBusinessISO(candidate)) return candidate;
    }
    throw new RangeError('No business day found within the scan limit');
  }

  /**
   * Move `amount` business days from `date` (negative moves backwards).
   * The start date itself is never counted; `amount = 0` returns the date unchanged.
   */
  addBusinessDays(date: DateInput, amount: number): ISODate {
    if (!Number.isInteger(amount)) throw new RangeError(`amount must be an integer, got ${amount}`);
    let iso = toISODate(date);
    const dir: 1 | -1 = amount < 0 ? -1 : 1;
    for (let left = Math.abs(amount); left > 0; left--) iso = this.step(iso, dir);
    return iso;
  }

  /**
   * Number of business days in `(from, to]`: the count you would pass to `addBusinessDays`
   * to get from `from` to `to` when `to` is a business day. Negative when `to` is before `from`.
   */
  businessDaysBetween(from: DateInput, to: DateInput): number {
    const a = toISODate(from);
    const b = toISODate(to);
    if (a === b) return 0;
    const sign = a < b ? 1 : -1;
    const [lo, hi] = sign === 1 ? [a, b] : [b, a];
    let count = 0;
    for (let d = toDayNumber(lo) + 1, end = toDayNumber(hi); d <= end; d++) {
      if (this.isBusinessISO(fromDayNumber(d))) count++;
    }
    return sign * count;
  }

  /** Business days in the inclusive range `[from, to]`, in order. */
  businessDaysInRange(from: DateInput, to: DateInput): ISODate[] {
    const a = toISODate(from);
    const b = toISODate(to);
    if (a > b) throw new RangeError(`"from" (${a}) is after "to" (${b})`);
    const out: ISODate[] = [];
    for (let d = toDayNumber(a), end = toDayNumber(b); d <= end; d++) {
      const iso = fromDayNumber(d);
      if (this.isBusinessISO(iso)) out.push(iso);
    }
    return out;
  }

  /** Business days in a month (1-12). */
  businessDaysInMonth(year: number, month: number): ISODate[] {
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`Invalid month ${month}`);
    const first = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
    const last = addDays(month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`, -1);
    return this.businessDaysInRange(first, last);
  }

  /**
   * Move a date onto a business day using a market roll convention.
   * `modified-following` rolls forward unless that crosses into the next month, then backward.
   */
  roll(date: DateInput, convention: RollConvention = 'following'): ISODate {
    const iso = toISODate(date);
    if (this.isBusinessISO(iso)) return iso;
    switch (convention) {
      case 'following':
        return this.step(iso, 1);
      case 'preceding':
        return this.step(iso, -1);
      case 'modified-following': {
        const next = this.step(iso, 1);
        return next.slice(0, 7) === iso.slice(0, 7) ? next : this.step(iso, -1);
      }
      case 'modified-preceding': {
        const prev = this.step(iso, -1);
        return prev.slice(0, 7) === iso.slice(0, 7) ? prev : this.step(iso, 1);
      }
      default:
        throw new RangeError(`Unknown roll convention "${String(convention)}"`);
    }
  }
}

let defaultCalendar: BusinessCalendar | undefined;
function calendarFor(options?: CalendarOptions): BusinessCalendar {
  if (options) return new BusinessCalendar(options);
  defaultCalendar ??= new BusinessCalendar();
  return defaultCalendar;
}

/** Business day under the government calendar (Fri+Sat weekend, general + executive holidays) or the given options. */
export function isBusinessDay(date: DateInput, options?: CalendarOptions): boolean {
  return calendarFor(options).isBusinessDay(date);
}

export function isWeekend(date: DateInput, options?: CalendarOptions): boolean {
  return calendarFor(options).isWeekend(date);
}

export function addBusinessDays(date: DateInput, amount: number, options?: CalendarOptions): ISODate {
  return calendarFor(options).addBusinessDays(date, amount);
}

export function subtractBusinessDays(date: DateInput, amount: number, options?: CalendarOptions): ISODate {
  return calendarFor(options).addBusinessDays(date, -amount);
}

export function businessDaysBetween(from: DateInput, to: DateInput, options?: CalendarOptions): number {
  return calendarFor(options).businessDaysBetween(from, to);
}

export function nextBusinessDay(date: DateInput, options?: CalendarOptions): ISODate {
  return calendarFor(options).nextBusinessDay(date);
}

export function previousBusinessDay(date: DateInput, options?: CalendarOptions): ISODate {
  return calendarFor(options).previousBusinessDay(date);
}

export function businessDaysInMonth(year: number, month: number, options?: CalendarOptions): ISODate[] {
  return calendarFor(options).businessDaysInMonth(year, month);
}
