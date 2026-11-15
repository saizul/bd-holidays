import { SUPPORTED_YEARS, cloneHoliday, yearHolidaysUnsafe, yearInfo } from './data/index.js';
import { addDays, monthOf, toDayNumber, toISODate, yearOf } from './date.js';
import type { DateInput, Holiday, HolidayFilter, HolidayType, ISODate, Religion, YearInfo } from './types.js';

export const DEFAULT_TYPES: readonly HolidayType[] = Object.freeze(['general', 'executive']);
export const ALL_TYPES: readonly HolidayType[] = Object.freeze(['general', 'executive', 'optional']);
export const RELIGIONS: readonly Religion[] = Object.freeze([
  'muslim',
  'hindu',
  'christian',
  'buddhist',
  'ethnic-minority',
]);

/** Thrown when a date falls in a year that has no bundled data. */
export class UnsupportedYearError extends RangeError {
  readonly year: number;
  constructor(year: number) {
    super(
      `No holiday data for ${year}. Bundled years: ${SUPPORTED_YEARS.join(', ')}. ` +
        `Use { unknownYear: 'weekends-only' } to treat it as having weekends only.`,
    );
    this.name = 'UnsupportedYearError';
    this.year = year;
  }
}

const REGION_ALIASES: Record<string, string> = {
  rangamati: 'rangamati',
  khagrachhari: 'khagrachhari',
  khagrachari: 'khagrachhari',
  khagrachori: 'khagrachhari',
  bandarban: 'bandarban',
  // Bangla spellings
  রাঙ্গামাটি: 'rangamati',
  রাঙামাটি: 'rangamati',
  খাগড়াছড়ি: 'khagrachhari',
  বান্দরবান: 'bandarban',
};

/** Normalise a district name for comparison. */
export function normaliseRegion(region: string): string {
  const compact = region.toLowerCase().replace(/[\s\-_.]+/g, '').replace(/(hill)?district$/, '');
  return REGION_ALIASES[compact] ?? compact;
}

export function isSupportedYear(year: number): boolean {
  return SUPPORTED_YEARS.includes(year);
}

export function supportedYears(): number[] {
  return [...SUPPORTED_YEARS];
}

/** Normalised view of a filter, with defaults filled in. */
export interface ResolvedFilter {
  types: ReadonlySet<HolidayType>;
  religions: ReadonlySet<Religion>;
  region: string | undefined;
  includeTentative: boolean;
}

export function resolveFilter(filter: HolidayFilter = {}): ResolvedFilter {
  const types = new Set<HolidayType>(filter.types ?? DEFAULT_TYPES);
  for (const t of types) {
    if (!ALL_TYPES.includes(t)) throw new RangeError(`Unknown holiday type "${t}"`);
  }
  const religions = new Set<Religion>(filter.religions ?? []);
  for (const r of religions) {
    if (!RELIGIONS.includes(r)) throw new RangeError(`Unknown religion "${r}"`);
  }
  // Asking for a religion's optional holidays implies the optional type.
  if (religions.size > 0) types.add('optional');
  return {
    types,
    religions,
    region: filter.region ? normaliseRegion(filter.region) : undefined,
    includeTentative: filter.includeTentative ?? true,
  };
}

/** Whether a holiday counts under a filter. */
export function matchesFilter(h: Holiday, filter: ResolvedFilter): boolean {
  if (!filter.types.has(h.type)) return false;
  if (h.type === 'optional' && filter.religions.size > 0 && !filter.religions.has(h.religion!)) return false;
  if (h.tentative && !filter.includeTentative) return false;
  if (h.regions) {
    if (!filter.region) return false;
    if (!h.regions.some((r) => normaliseRegion(r) === filter.region)) return false;
  }
  return true;
}

function requireYear(year: number): readonly Holiday[] {
  const list = yearHolidaysUnsafe(year);
  if (!list) throw new UnsupportedYearError(year);
  return list;
}

/**
 * Holidays of a year that match the filter, sorted by date.
 * By default: general and executive-order holidays, nationwide ones only.
 * Pass `{ types: ALL_TYPES }` to include optional holidays. Region-limited entries only appear
 * when `region` matches; use `listAll` for every entry without filtering.
 */
export function getHolidays(year: number, filter?: HolidayFilter): Holiday[] {
  const resolved = resolveFilter(filter);
  return requireYear(year).filter((h) => matchesFilter(h, resolved)).map(cloneHoliday);
}

/** Every bundled entry of a year, regardless of type, religion or region. */
export function listAll(year: number): Holiday[] {
  return requireYear(year).map(cloneHoliday);
}

/** Holidays of one month (1-12). */
export function getHolidaysInMonth(year: number, month: number, filter?: HolidayFilter): Holiday[] {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`Invalid month ${month}`);
  return getHolidays(year, filter).filter((h) => monthOf(h.date) === month);
}

/** All matching holiday entries on a date (several can share a day). */
export function getHolidaysOn(date: DateInput, filter?: HolidayFilter): Holiday[] {
  const iso = toISODate(date);
  const resolved = resolveFilter(filter);
  return requireYear(yearOf(iso))
    .filter((h) => h.date === iso && matchesFilter(h, resolved))
    .map(cloneHoliday);
}

/** True if at least one matching holiday falls on the date. Weekends are not holidays here; see `isBusinessDay`. */
export function isHoliday(date: DateInput, filter?: HolidayFilter): boolean {
  return getHolidaysOn(date, filter).length > 0;
}

/** Matching holidays in the inclusive range `[from, to]`. Spans years; every year must be bundled. */
export function getHolidaysBetween(from: DateInput, to: DateInput, filter?: HolidayFilter): Holiday[] {
  const start = toISODate(from);
  const end = toISODate(to);
  if (start > end) throw new RangeError(`"from" (${start}) is after "to" (${end})`);
  const resolved = resolveFilter(filter);
  const out: Holiday[] = [];
  for (let y = yearOf(start); y <= yearOf(end); y++) {
    for (const h of requireYear(y)) {
      if (h.date >= start && h.date <= end && matchesFilter(h, resolved)) out.push(cloneHoliday(h));
    }
  }
  return out;
}

function scan(date: DateInput, filter: HolidayFilter | undefined, direction: 1 | -1): Holiday[] {
  const start = toISODate(date);
  const resolved = resolveFilter(filter);
  const years = direction === 1 ? SUPPORTED_YEARS : [...SUPPORTED_YEARS].reverse();
  for (const y of years) {
    if (direction === 1 && y < yearOf(start)) continue;
    if (direction === -1 && y > yearOf(start)) continue;
    const list = direction === 1 ? requireYear(y) : [...requireYear(y)].reverse();
    let found: ISODate | undefined;
    const sameDay: Holiday[] = [];
    for (const h of list) {
      const after = direction === 1 ? h.date > start : h.date < start;
      if (!after || !matchesFilter(h, resolved)) continue;
      if (found === undefined) found = h.date;
      if (h.date !== found) break;
      sameDay.push(cloneHoliday(h));
    }
    if (found) return direction === 1 ? sameDay : sameDay.reverse();
  }
  return [];
}

/**
 * The next holiday strictly after `date` (all entries on that day).
 * Returns `[]` if none is left in the bundled data.
 */
export function nextHoliday(date: DateInput, filter?: HolidayFilter): Holiday[] {
  return scan(date, filter, 1);
}

/** The most recent holiday strictly before `date`. */
export function previousHoliday(date: DateInput, filter?: HolidayFilter): Holiday[] {
  return scan(date, filter, -1);
}

/**
 * Search all bundled years. An exact id (e.g. `eid-ul-fitr`) returns that observance only;
 * otherwise the query is matched case-insensitively against English and Bangla names.
 */
export function findHolidays(query: string, filter?: HolidayFilter): Holiday[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const resolved = filter ? resolveFilter(filter) : undefined;
  // An exact id match means "this observance", not every name containing the text.
  const byId = SUPPORTED_YEARS.some((y) => requireYear(y).some((h) => h.id === q));
  const out: Holiday[] = [];
  for (const y of SUPPORTED_YEARS) {
    for (const h of requireYear(y)) {
      const hit = byId ? h.id === q : h.name.toLowerCase().includes(q) || h.nameBn.includes(query.trim());
      if (hit && (!resolved || matchesFilter(h, resolved))) out.push(cloneHoliday(h));
    }
  }
  return out;
}

/** Source and totals for a bundled year. */
export function getYearInfo(year: number): YearInfo {
  const info = yearInfo(year);
  if (!info) throw new UnsupportedYearError(year);
  return info;
}

/**
 * Collapse consecutive days of the same observance into ranges, e.g. the five Eid-ul-Azha days.
 * Useful for display and calendar export.
 */
export interface HolidayRange {
  id: string;
  name: string;
  nameBn: string;
  type: HolidayType;
  religion?: Religion;
  start: ISODate;
  end: ISODate;
  days: number;
  moonDependent: boolean;
  tentative: boolean;
  regions?: string[];
}

export function groupIntoRanges(holidays: readonly Holiday[]): HolidayRange[] {
  const sorted = [...holidays].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const open = new Map<string, HolidayRange>();
  const out: HolidayRange[] = [];
  for (const h of sorted) {
    const key = `${h.id}|${h.type}|${h.religion ?? ''}`;
    const current = open.get(key);
    if (current && toDayNumber(h.date) === toDayNumber(current.end) + 1) {
      current.end = h.date;
      current.days += 1;
      current.tentative ||= h.tentative;
      continue;
    }
    const range: HolidayRange = {
      id: h.id,
      name: h.name,
      nameBn: h.nameBn,
      type: h.type,
      start: h.date,
      end: h.date,
      days: 1,
      moonDependent: h.moonDependent,
      tentative: h.tentative,
    };
    if (h.religion) range.religion = h.religion;
    if (h.regions) range.regions = [...h.regions];
    open.set(key, range);
    out.push(range);
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** Convenience: the day after the last bundled date. */
export function dataCoverage(): { from: ISODate; to: ISODate } {
  const first = SUPPORTED_YEARS[0]!;
  const last = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1]!;
  return { from: `${first}-01-01`, to: addDays(`${last + 1}-01-01`, -1) };
}
