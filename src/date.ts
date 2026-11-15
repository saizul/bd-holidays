import type { DateInput, ISODate, Weekday } from './types.js';

/** Bangladesh Standard Time is UTC+6 with no daylight saving time. */
export const DHAKA_OFFSET_MINUTES = 6 * 60;

export const WEEKDAYS: readonly Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** True if `value` is a real calendar date in `YYYY-MM-DD` form. */
export function isValidISODate(value: string): boolean {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

/**
 * Normalise a date input to `YYYY-MM-DD`.
 * A `Date` is converted to the calendar date in Dhaka (UTC+6), so `2025-03-30T20:00Z` becomes `2025-03-31`.
 */
export function toISODate(input: DateInput): ISODate {
  if (input instanceof Date) {
    const t = input.getTime();
    if (Number.isNaN(t)) throw new TypeError('Invalid Date');
    const shifted = new Date(t + DHAKA_OFFSET_MINUTES * 60_000);
    return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
  }
  if (typeof input !== 'string') throw new TypeError(`Expected an ISO date string or Date, got ${typeof input}`);
  const trimmed = input.trim();
  if (!isValidISODate(trimmed)) throw new RangeError(`Invalid date "${input}", expected YYYY-MM-DD`);
  return trimmed;
}

/** Days since 1970-01-01 for an ISO date (UTC arithmetic, no time zone involved). */
export function toDayNumber(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(day: number): ISODate {
  const dt = new Date(day * DAY_MS);
  return `${pad(dt.getUTCFullYear(), 4)}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(iso) + days);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayIndex(iso: ISODate): number {
  // 1970-01-01 was a Thursday (4).
  return (((toDayNumber(iso) + 4) % 7) + 7) % 7;
}

export function weekdayName(iso: ISODate): Weekday {
  return WEEKDAYS[weekdayIndex(iso)]!;
}

export function yearOf(iso: ISODate): number {
  return Number(iso.slice(0, 4));
}

export function monthOf(iso: ISODate): number {
  return Number(iso.slice(5, 7));
}

/** Parse a weekday given as number (0-6), short or long English name. */
export function parseWeekday(value: number | string): number {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0 || value > 6) throw new RangeError(`Invalid weekday ${value}`);
    return value;
  }
  const key = value.trim().slice(0, 3).toLowerCase();
  const idx = WEEKDAYS.findIndex((w) => w.toLowerCase() === key);
  if (idx === -1) throw new RangeError(`Invalid weekday "${value}"`);
  return idx;
}

/** "Today" in Dhaka. `now` is injectable for tests. */
export function todayInDhaka(now: Date = new Date()): ISODate {
  return toISODate(now);
}
