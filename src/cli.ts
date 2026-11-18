import { findBreaks, type Break } from './breaks.js';
import { BusinessCalendar } from './calendar.js';
import { todayInDhaka, toISODate, weekdayName, yearOf } from './date.js';
import {
  ALL_TYPES,
  getHolidays,
  getHolidaysBetween,
  getYearInfo,
  nextHoliday,
  supportedYears,
} from './holidays.js';
import { toCSV } from './export/csv.js';
import { toICS } from './export/ics.js';
import { toJSON } from './export/json.js';
import type { CalendarOptions, Holiday, HolidayFilter, HolidayType, Religion } from './types.js';

export const VERSION = '0.1.0';

export interface CliIO {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Write a file (used by `--out`). */
  writeFile: (path: string, content: string) => void;
  /** Clock, injectable for tests. */
  now: () => Date;
}

export const HELP = `bd-holidays ${VERSION}: Bangladesh government holidays and business days

Usage:
  bd-holidays list [year] [--month N] [filters] [--format table|json|csv|ics] [--out FILE]
  bd-holidays export <year|from..to> --format ics|json|csv [filters] [--out FILE]
  bd-holidays check [date] [calendar options]
  bd-holidays next [date] [filters]
  bd-holidays add <date> <days> [calendar options]
  bd-holidays between <from> <to> [calendar options]
  bd-holidays business-days <year> <month> [calendar options]
  bd-holidays breaks [year|from..to] [--min-days N] [--max-leave N] [calendar options]
  bd-holidays sources [year]
  bd-holidays years

Filters:
  --all                 include optional holidays of every religion
  --type LIST           general,executive,optional (default general,executive)
  --religion LIST       muslim,hindu,christian,buddhist,ethnic-minority (adds their optional days)
  --region DISTRICT     include region-limited holidays for this district (e.g. Rangamati)
  --no-tentative        leave out moon-dependent dates that are not confirmed

Calendar options:
  --weekend LIST        weekly holidays (default fri,sat)
  --extra DATES         extra non-working dates, comma separated
  --working DATES       dates that are working days anyway, comma separated
  --unknown-year MODE   throw (default) or weekends-only

Breaks:
  --min-days N          shortest break to list, leave included (default 3)
  --max-leave N         working days of leave that may join days off (default 0)

Output:
  --lang en|bn          names in English (default) or Bangla
  --format FORMAT       table (default for list), json, csv or ics
  --out FILE            write to a file instead of stdout
  --bom                 add a UTF-8 BOM to CSV output (for Excel)
  -h, --help            show this help
  -v, --version         show the version
`;

interface ParsedArgs {
  positional: string[];
  flags: Map<string, string | true>;
}

const BOOLEAN_FLAGS = new Set(['all', 'no-tentative', 'bom', 'help', 'version']);

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '-h') flags.set('help', true);
    else if (arg === '-v') flags.set('version', true);
    else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
      if (eq !== -1) flags.set(name, arg.slice(eq + 1));
      else if (BOOLEAN_FLAGS.has(name)) flags.set(name, true);
      else {
        const value = argv[i + 1];
        if (value === undefined || value.startsWith('--')) throw new UsageError(`--${name} needs a value`);
        flags.set(name, value);
        i++;
      }
    } else positional.push(arg);
  }
  return { positional, flags };
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

function list(value: string | true | undefined): string[] | undefined {
  if (value === undefined || value === true) return undefined;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function stringFlag(args: ParsedArgs, name: string): string | undefined {
  const v = args.flags.get(name);
  if (v === true) throw new UsageError(`--${name} needs a value`);
  return v;
}

function filterFrom(args: ParsedArgs): HolidayFilter {
  const filter: HolidayFilter = {};
  if (args.flags.has('all')) filter.types = [...ALL_TYPES];
  const types = list(args.flags.get('type'));
  if (types) filter.types = types as HolidayType[];
  const religions = list(args.flags.get('religion'));
  if (religions) filter.religions = religions as Religion[];
  const region = stringFlag(args, 'region');
  if (region) filter.region = region;
  if (args.flags.has('no-tentative')) filter.includeTentative = false;
  return filter;
}

function calendarFrom(args: ParsedArgs): CalendarOptions {
  const options: CalendarOptions = filterFrom(args);
  const weekend = list(args.flags.get('weekend'));
  if (weekend) options.weekend = weekend.map((w) => (/^\d$/.test(w) ? Number(w) : w)) as CalendarOptions['weekend'];
  const extra = list(args.flags.get('extra'));
  if (extra) options.extraHolidays = extra;
  const working = list(args.flags.get('working'));
  if (working) options.workingDays = working;
  const unknown = stringFlag(args, 'unknown-year');
  if (unknown) {
    if (unknown !== 'throw' && unknown !== 'weekends-only') throw new UsageError('--unknown-year must be throw or weekends-only');
    options.unknownYear = unknown;
  }
  return options;
}

function parseYear(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!/^\d{4}$/.test(value)) throw new UsageError(`Invalid year "${value}"`);
  return Number(value);
}

function label(h: Holiday): string {
  if (h.type === 'optional') return `optional/${h.religion}`;
  return h.type;
}

/** Render a fixed-width text table. Width is measured in code points, which is close enough for Bangla in terminals. */
export function renderTable(holidays: readonly Holiday[], lang: 'en' | 'bn'): string {
  if (holidays.length === 0) return 'No holidays match.\n';
  const rows = holidays.map((h) => [
    h.date,
    h.weekday,
    label(h),
    (lang === 'bn' ? h.nameBn : h.name) + (h.tentative ? ' *' : '') + (h.regions ? ` [${h.regions.join('/')}]` : ''),
  ]);
  const header = ['Date', 'Day', 'Type', 'Name'];
  const widths = header.map((hd, i) => Math.max(hd.length, ...rows.map((r) => [...r[i]!].length)));
  const fmt = (r: string[]) =>
    r.map((c, i) => (i === r.length - 1 ? c : c + ' '.repeat(widths[i]! - [...c].length))).join('  ');
  const lines = [fmt(header), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(fmt)];
  if (holidays.some((h) => h.tentative)) lines.push('', '* tentative: depends on the sighting of the moon');
  return lines.join('\n') + '\n';
}

function render(holidays: Holiday[], args: ParsedArgs, io: CliIO, defaultFormat: string): string {
  const format = stringFlag(args, 'format') ?? defaultFormat;
  const lang = stringFlag(args, 'lang') ?? 'en';
  if (lang !== 'en' && lang !== 'bn') throw new UsageError('--lang must be en or bn');
  switch (format) {
    case 'table':
      return renderTable(holidays, lang);
    case 'json':
      return toJSON(holidays, { now: io.now() });
    case 'csv':
      return toCSV(holidays, { bom: args.flags.has('bom') });
    case 'ics':
      return toICS(holidays, { now: io.now(), bangla: lang === 'bn' });
    default:
      throw new UsageError(`Unknown format "${format}" (use table, json, csv or ics)`);
  }
}

function emit(content: string, args: ParsedArgs, io: CliIO): void {
  const out = stringFlag(args, 'out');
  if (out) {
    io.writeFile(out, content);
    io.stderr(`Wrote ${out}\n`);
  } else io.stdout(content);
}

function intFlag(args: ParsedArgs, name: string, fallback: number, min: number): number {
  const raw = stringFlag(args, name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < min) throw new UsageError(`--${name} must be a whole number of at least ${min}`);
  return n;
}

function rangeForSpec(spec: string): [string, string] {
  const range = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(spec);
  if (range) return [range[1]!, range[2]!];
  const year = parseYear(spec, 0);
  return [`${year}-01-01`, `${year}-12-31`];
}

function short(iso: string): string {
  return `${iso} ${weekdayName(iso)}`;
}

/** Text table of breaks: dates, length, leave needed and the holidays inside. */
export function renderBreaks(breaks: readonly Break[], lang: 'en' | 'bn'): string {
  if (breaks.length === 0) return 'No breaks match.\n';
  const rows = breaks.map((b) => {
    const names = [...new Set(b.holidays.map((h) => (lang === 'bn' ? h.nameBn : h.name) + (h.tentative ? ' *' : '')))];
    return [
      short(b.start),
      short(b.end),
      String(b.days),
      b.leaveDays.length ? b.leaveDays.join(', ') : '-',
      names.join('; ') || 'weekend',
    ];
  });
  const header = ['From', 'To', 'Days', 'Leave', 'Holidays'];
  const widths = header.map((hd, i) => Math.max(hd.length, ...rows.map((r) => [...r[i]!].length)));
  const fmt = (r: string[]) =>
    r.map((c, i) => (i === r.length - 1 ? c : c + ' '.repeat(widths[i]! - [...c].length))).join('  ');
  const lines = [fmt(header), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(fmt)];
  if (breaks.some((b) => b.holidays.some((h) => h.tentative))) lines.push('', '* tentative: depends on the sighting of the moon');
  return lines.join('\n') + '\n';
}

function holidaysForSpec(spec: string, filter: HolidayFilter, today: string): Holiday[] {
  const range = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(spec);
  if (range) return getHolidaysBetween(range[1]!, range[2]!, filter);
  return getHolidays(parseYear(spec, yearOf(today)), filter);
}

/** Run the CLI. Returns the process exit code. */
export function runCli(argv: readonly string[], io: CliIO): number {
  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    io.stderr(`${(err as Error).message}\n`);
    return 2;
  }
  if (args.flags.has('version')) {
    io.stdout(`${VERSION}\n`);
    return 0;
  }
  const [command, ...rest] = args.positional;
  if (args.flags.has('help') || !command || command === 'help') {
    io.stdout(HELP);
    return command || args.flags.has('help') ? 0 : 1;
  }
  const today = todayInDhaka(io.now());
  try {
    switch (command) {
      case 'list': {
        const filter = filterFrom(args);
        let holidays = holidaysForSpec(rest[0] ?? String(yearOf(today)), filter, today);
        const month = stringFlag(args, 'month');
        if (month !== undefined) {
          const m = Number(month);
          if (!Number.isInteger(m) || m < 1 || m > 12) throw new UsageError(`Invalid month "${month}"`);
          holidays = holidays.filter((h) => Number(h.date.slice(5, 7)) === m);
        }
        emit(render(holidays, args, io, 'table'), args, io);
        return 0;
      }
      case 'export': {
        if (!rest[0]) throw new UsageError('export needs a year or a range like 2026-01-01..2026-06-30');
        const holidays = holidaysForSpec(rest[0], filterFrom(args), today);
        emit(render(holidays, args, io, 'ics'), args, io);
        return 0;
      }
      case 'check': {
        const cal = new BusinessCalendar(calendarFrom(args));
        const s = cal.status(toISODate(rest[0] ?? today));
        const lang = stringFlag(args, 'lang') ?? 'en';
        if (stringFlag(args, 'format') === 'json') {
          io.stdout(JSON.stringify(s, null, 2) + '\n');
          return 0;
        }
        const reasons: string[] = [];
        if (s.weekend) reasons.push('weekly holiday');
        for (const h of s.holidays) reasons.push(`${lang === 'bn' ? h.nameBn : h.name} (${label(h)}${h.tentative ? ', tentative' : ''})`);
        if (s.extraHoliday) reasons.push('extra holiday');
        if (s.workingDayOverride) reasons.push('declared working day');
        io.stdout(
          `${s.date} (${new Date(`${s.date}T00:00:00Z`).toUTCString().slice(0, 3)}): ` +
            `${s.businessDay ? 'business day' : 'not a business day'}` +
            (reasons.length ? `: ${reasons.join('; ')}` : '') +
            '\n',
        );
        return s.businessDay ? 0 : 3;
      }
      case 'next': {
        const from = toISODate(rest[0] ?? today);
        const found = nextHoliday(from, filterFrom(args));
        if (found.length === 0) {
          io.stdout('No later holiday in the bundled data.\n');
          return 1;
        }
        emit(render(found, args, io, 'table'), args, io);
        return 0;
      }
      case 'add': {
        if (rest.length < 2) throw new UsageError('add needs <date> <days>');
        const n = Number(rest[1]);
        if (!Number.isInteger(n)) throw new UsageError(`Invalid number of days "${rest[1]}"`);
        io.stdout(`${new BusinessCalendar(calendarFrom(args)).addBusinessDays(rest[0]!, n)}\n`);
        return 0;
      }
      case 'between': {
        if (rest.length < 2) throw new UsageError('between needs <from> <to>');
        io.stdout(`${new BusinessCalendar(calendarFrom(args)).businessDaysBetween(rest[0]!, rest[1]!)}\n`);
        return 0;
      }
      case 'business-days': {
        if (rest.length < 2) throw new UsageError('business-days needs <year> <month>');
        const days = new BusinessCalendar(calendarFrom(args)).businessDaysInMonth(parseYear(rest[0], 0), Number(rest[1]));
        if (stringFlag(args, 'format') === 'json') io.stdout(JSON.stringify(days) + '\n');
        else io.stdout(`${days.length} business days\n${days.join('\n')}\n`);
        return 0;
      }
      case 'breaks': {
        const [from, to] = rangeForSpec(rest[0] ?? String(yearOf(today)));
        const breaks = findBreaks(from, to, {
          ...calendarFrom(args),
          minDays: intFlag(args, 'min-days', 3, 1),
          maxLeave: intFlag(args, 'max-leave', 0, 0),
        });
        const format = stringFlag(args, 'format') ?? 'table';
        const lang = stringFlag(args, 'lang') ?? 'en';
        if (lang !== 'en' && lang !== 'bn') throw new UsageError('--lang must be en or bn');
        if (format === 'json') emit(JSON.stringify(breaks, null, 2) + '\n', args, io);
        else if (format === 'table') emit(renderBreaks(breaks, lang), args, io);
        else throw new UsageError(`Unknown format "${format}" for breaks (use table or json)`);
        return 0;
      }
      case 'sources': {
        const years = rest[0] ? [parseYear(rest[0], 0)] : supportedYears();
        const infos = years.map(getYearInfo);
        if (stringFlag(args, 'format') === 'json') {
          io.stdout(JSON.stringify(infos, null, 2) + '\n');
          return 0;
        }
        for (const info of infos) {
          io.stdout(`${info.year}: ${info.source.title}\n`);
          if (info.source.memo) io.stdout(`  memo:      ${info.source.memo}\n`);
          io.stdout(`  issued:    ${info.source.issued}\n`);
          if (info.source.gazetted) io.stdout(`  gazetted:  ${info.source.gazetted}\n`);
          io.stdout(`  url:       ${info.source.url}\n`);
          if (info.source.pdf) io.stdout(`  pdf:       ${info.source.pdf}\n`);
          io.stdout(`  retrieved: ${info.source.retrieved}\n`);
          for (const a of info.amendments) io.stdout(`  amendment: ${a.title} (${a.issued}) ${a.url}\n`);
        }
        return 0;
      }
      case 'years':
        io.stdout(`${supportedYears().join('\n')}\n`);
        return 0;
      default:
        throw new UsageError(`Unknown command "${command}". Run bd-holidays --help.`);
    }
  } catch (err) {
    const e = err as Error;
    io.stderr(`error: ${e.message}\n`);
    return e instanceof UsageError ? 2 : 1;
  }
}
