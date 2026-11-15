import type { Holiday, Religion, SectionKey, YearInfo } from '../types.js';
import { NAMES, type ObservanceName } from './names.js';
import type { RawEntry, RawYear } from './raw.js';
import { Y2025 } from './2025.js';
import { Y2026 } from './2026.js';
import { Y2027 } from './2027.js';

const RAW_YEARS: readonly RawYear[] = [Y2025, Y2026, Y2027];

export const SECTION_KEYS: readonly SectionKey[] = [
  'general',
  'executive',
  'muslim',
  'hindu',
  'christian',
  'buddhist',
  'ethnic-minority',
];

function sectionToTypeAndReligion(section: SectionKey): Pick<Holiday, 'type' | 'religion'> {
  if (section === 'general' || section === 'executive') return { type: section };
  return { type: 'optional', religion: section as Religion };
}

function buildHoliday(year: number, section: SectionKey, entry: RawEntry): Holiday {
  const [date, weekday, key, flags = '', note] = entry;
  const name: ObservanceName = NAMES[key];
  const moonDependent = flags.includes('*') || flags.includes('!');
  const holiday: Holiday = {
    date,
    weekday,
    id: key,
    name: name.en,
    nameBn: name.bn,
    ...sectionToTypeAndReligion(section),
    moonDependent,
    tentative: moonDependent && !flags.includes('!'),
    sourceYear: year,
  };
  if (name.regions) holiday.regions = [...name.regions];
  if (note) holiday.note = note;
  return holiday;
}

const TYPE_ORDER = { general: 0, executive: 1, optional: 2 } as const;

function compareHolidays(a: Holiday, b: Holiday): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
  return (a.religion ?? '').localeCompare(b.religion ?? '');
}

function buildYear(raw: RawYear): { info: YearInfo; holidays: Holiday[] } {
  const holidays: Holiday[] = [];
  for (const section of SECTION_KEYS) {
    for (const entry of raw.sections[section]) holidays.push(buildHoliday(raw.year, section, entry));
  }
  for (const amendment of raw.amendments) {
    for (const entry of amendment.entries) {
      holidays.push(buildHoliday(raw.year, amendment.section, entry));
    }
  }
  holidays.sort(compareHolidays);
  const info: YearInfo = {
    year: raw.year,
    source: { ...raw.source },
    amendments: raw.amendments.map((a) => ({ ...a.source })),
    totals: structuredClone(raw.totals),
    confirmed: true,
  };
  return { info, holidays };
}

const BUILT = new Map<number, { info: YearInfo; holidays: Holiday[] }>();
for (const raw of RAW_YEARS) BUILT.set(raw.year, buildYear(raw));

/** Years with bundled data, ascending. */
export const SUPPORTED_YEARS: readonly number[] = Object.freeze([...BUILT.keys()].sort());

/** Raw access to a year's entries. Returns copies so callers cannot change the bundled data. */
export function yearHolidays(year: number): Holiday[] | undefined {
  const built = BUILT.get(year);
  return built?.holidays.map(cloneHoliday);
}

/** Internal, uncopied access used by hot paths. */
export function yearHolidaysUnsafe(year: number): readonly Holiday[] | undefined {
  return BUILT.get(year)?.holidays;
}

export function yearInfo(year: number): YearInfo | undefined {
  const built = BUILT.get(year);
  return built ? structuredClone(built.info) : undefined;
}

export function cloneHoliday(h: Holiday): Holiday {
  const copy: Holiday = { ...h };
  if (h.regions) copy.regions = [...h.regions];
  return copy;
}

/** Raw transcriptions, exported for data-integrity tests and tooling. */
export function rawYears(): readonly RawYear[] {
  return RAW_YEARS;
}
