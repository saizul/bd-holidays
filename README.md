# bd-holidays

[![CI](https://github.com/saizul/bd-holidays/actions/workflows/ci.yml/badge.svg)](https://github.com/saizul/bd-holidays/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

Bangladesh government holidays and business-day maths for Node.js, with a CLI.

The bundled data for **2025, 2026 and 2027** is transcribed from the official holiday notices
of the Ministry of Public Administration (জনপ্রশাসন মন্ত্রণালয়), with the source document recorded
for every year. General holidays, executive-order holidays and the optional holidays of each
religion are kept apart, and every entry has an English and a Bangla name.

```js
import { isHoliday, isBusinessDay, addBusinessDays } from 'bd-holidays';

isHoliday('2026-12-16');               // true: Victory Day
isBusinessDay('2026-03-19');           // false: Eid-ul-Fitr holidays
addBusinessDays('2027-03-04', 1);      // '2027-03-14': skips Eid-ul-Fitr 2027 and the weekend
```

## Features

- **Official data**: 2025-2027 lists from the Ministry of Public Administration notices, each
  with memo number, issue date, gazette date, page URL, PDF URL and retrieval date.
- **Three holiday types, kept separate**: general holidays (সাধারণ ছুটি), executive-order
  holidays (নির্বাহী আদেশে সরকারি ছুটি) and optional holidays (ঐচ্ছিক ছুটি) for Muslim, Hindu,
  Christian, Buddhist and ethnic minority communities.
- **Bangla and English names** for every entry, spelled as in the notice.
- **Moon-dependent dates flagged**: entries marked `*` in the notice have `moonDependent: true`
  and `tentative: true`, and can be left out of calculations.
- **Regional holidays**: Chaitra Sankranti is a general holiday only in Rangamati, Khagrachhari
  and Bandarban; it counts only when you set that `region`.
- **Business days**: Friday and Saturday weekend by default (government offices), configurable
  for private firms, with extra closures, declared working days and roll conventions.
- **Exports**: iCalendar (`.ics`), CSV (Excel-friendly with `--bom`) and JSON.
- **Long breaks and leave planning**: find long weekends and holiday breaks, and where one or two
  days of leave join them into a longer break.
- **CLI**: list, check, next, add, between, business-days, breaks, export, sources.
- **Zero runtime dependencies**, ESM and CommonJS builds, full TypeScript types.

## Install

```bash
npm install bd-holidays
```

Requires Node.js 20 or newer. Run the CLI without installing:

```bash
npx bd-holidays list 2027
```

### Install from GitHub Packages

Releases are also published to GitHub Packages as `@saizul/bd-holidays`. Point the `@saizul`
scope at the GitHub registry in your project's `.npmrc`:

```ini
@saizul:registry=https://npm.pkg.github.com
```

GitHub Packages needs authentication even for public packages. Create a personal access token
(classic) with the `read:packages` scope and expose it through an environment variable, then
reference it from your user-level `~/.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
npm install @saizul/bd-holidays
```

```js
import { isHoliday } from '@saizul/bd-holidays';
```

## Usage

### Is it a holiday?

```js
import { isHoliday, getHolidaysOn } from 'bd-holidays';

isHoliday('2026-04-14');                              // true (Pohela Boishakh, executive order)
isHoliday('2026-01-23');                              // false (Saraswati Puja is optional)
isHoliday('2026-01-23', { religions: ['hindu'] });    // true
isHoliday('2027-04-13');                              // false (hill districts only)
isHoliday('2027-04-13', { region: 'Rangamati' });     // true

getHolidaysOn('2027-05-20');
// [ { id: 'buddha-purnima', type: 'general', ... },
//   { id: 'eid-ul-azha-extended', type: 'executive', ... } ]
```

`Date` objects are read in Bangladesh time (UTC+6), so `new Date('2026-12-15T19:00:00Z')` is
16 December.

### Listing holidays

```js
import { getHolidays, getHolidaysInMonth, ALL_TYPES, groupIntoRanges } from 'bd-holidays';

getHolidays(2027);                                    // general + executive, nationwide
getHolidays(2027, { types: [...ALL_TYPES] });         // with every optional holiday
getHolidays(2027, { types: ['optional'], religions: ['christian'] });
getHolidaysInMonth(2026, 10, { religions: ['hindu'] });

// Merge multi-day observances, e.g. the Eid-ul-Azha block
groupIntoRanges(getHolidays(2026, { types: ['executive'] }));
```

Each entry looks like this:

```js
{
  date: '2027-03-10',
  weekday: 'Wed',
  id: 'eid-ul-fitr',
  name: 'Eid-ul-Fitr',
  nameBn: 'ঈদ-উল-ফিতর',
  type: 'general',            // 'general' | 'executive' | 'optional'
  religion: undefined,        // set for optional holidays
  moonDependent: true,
  tentative: true,
  regions: undefined,         // e.g. ['Rangamati', 'Khagrachhari', 'Bandarban']
  sourceYear: 2027
}
```

### Business days

```js
import {
  isBusinessDay, addBusinessDays, subtractBusinessDays, businessDaysBetween,
  nextBusinessDay, previousBusinessDay, businessDaysInMonth,
} from 'bd-holidays';

isBusinessDay('2026-01-02');                  // false (Friday)
nextBusinessDay('2026-05-25');                // '2026-06-01' (Eid-ul-Azha 26-31 May)
addBusinessDays('2026-12-14', 2);             // '2026-12-17' (skips Victory Day)
subtractBusinessDays('2026-12-17', 2);        // '2026-12-14'
businessDaysBetween('2026-12-14', '2026-12-17'); // 2, counts (from, to]
businessDaysInMonth(2026, 12).length;         // 22
```

`addBusinessDays(date, n)` never counts the start date, and `businessDaysBetween(a, b)` is the
`n` that gets you from `a` to `b`, so the two functions agree.

### A calendar for your own office

```js
import { BusinessCalendar } from 'bd-holidays';

const shop = new BusinessCalendar({
  weekend: ['Fri'],                    // Saturday is a working day
  religions: ['hindu'],                // staff take the Hindu optional days
  region: 'Khagrachhari',              // office in a hill district
  extraHolidays: ['2026-06-10'],       // company anniversary
  workingDays: ['2026-05-29'],         // declared working day
  includeTentative: true,              // count moon-dependent dates (default)
  unknownYear: 'throw',                // or 'weekends-only' outside 2025-2027
});

shop.isBusinessDay('2026-06-10');      // false
shop.addBusinessDays('2026-05-25', 3);
shop.status('2027-05-20');             // why a day is off
shop.roll('2027-04-30', 'modified-following'); // '2027-04-29'
```

Roll conventions: `following`, `preceding`, `modified-following`, `modified-preceding`.

### Long breaks and leave planning

```js
import { findBreaks } from 'bd-holidays';

findBreaks('2026-01-01', '2026-12-31', { minDays: 5 });
// [{ start: '2026-03-19', end: '2026-03-23', days: 5, leaveDays: [], holidays: [...] },   Eid-ul-Fitr
//  { start: '2026-05-26', end: '2026-05-31', days: 6, leaveDays: [], holidays: [...] }]   Eid-ul-Azha

findBreaks('2026-12-01', '2026-12-31', { maxLeave: 1 });
// [{ start: '2026-12-16', end: '2026-12-19', days: 4, leaveDays: ['2026-12-17'], ... }]  Victory Day + 1 day leave
```

A break is a run of consecutive days off (weekly holidays, holidays, `extraHolidays`) of at least
`minDays` (default 3). With `maxLeave` (default 0), runs separated by at most that many working
days are joined and the working days in between are listed in `leaveDays`. Every
`BusinessCalendar` option applies, so a shop with only Friday off gets its own answer. Breaks that
overlap the range are returned whole, natural breaks first when two start on the same day.

### Sources

```js
import { getYearInfo } from 'bd-holidays';

getYearInfo(2026).source;
// {
//   title: 'Ministry of Public Administration notice on holidays in 2026 (...)',
//   memo: '05.00.0000.000.175.08.0008.25-17',
//   issued: '2025-11-09',
//   gazetted: '2025-11-12',
//   url: 'https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/59216',
//   pdf: 'https://www.dpp.gov.bd/upload_file/gazettes/59216_19984.pdf',
//   retrieved: '2026-11-15'
// }
getYearInfo(2026).totals.general;      // { days: 14, weeklyIncluded: 7 }
```

### Exports

```js
import { getHolidays, toICS, toCSV, toJSON, ALL_TYPES } from 'bd-holidays';

const list = getHolidays(2027, { types: [...ALL_TYPES] });
toICS(list, { calendarName: 'BD Holidays 2027', bangla: true });
toCSV(list, { bom: true });   // the BOM makes Excel read Bangla correctly
toJSON(list);                 // includes the source document of each year
```

The iCalendar output uses all-day events, merges consecutive days of one observance into a
single event, marks tentative dates with `STATUS:TENTATIVE`, and folds lines at 75 octets
without splitting Bangla characters.

## CLI

```text
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
```

| Option | Meaning |
|--------|---------|
| `--all` | include the optional holidays of every religion |
| `--type LIST` | `general,executive,optional` (default `general,executive`) |
| `--religion LIST` | `muslim,hindu,christian,buddhist,ethnic-minority` |
| `--region DISTRICT` | include region-limited holidays for this district |
| `--no-tentative` | leave out unconfirmed moon-dependent dates |
| `--weekend LIST` | weekly holidays, default `fri,sat` |
| `--extra DATES` | extra closures, comma separated |
| `--working DATES` | declared working days, comma separated |
| `--unknown-year MODE` | `throw` (default) or `weekends-only` |
| `--min-days N` | `breaks`: shortest break to list, leave included (default 3) |
| `--max-leave N` | `breaks`: working days of leave that may join days off (default 0) |
| `--lang en\|bn` | English or Bangla names |
| `--format FORMAT` | `table`, `json`, `csv` or `ics` |
| `--out FILE` | write to a file |
| `--bom` | UTF-8 BOM for CSV |

Examples:

```bash
bd-holidays list 2027 --month 3
bd-holidays list 2026 --religion hindu --lang bn
bd-holidays export 2027 --all --region Rangamati --out bd-holidays-2027.ics
bd-holidays export 2026-12-01..2027-01-31 --format csv --bom --out holidays.csv
bd-holidays check 2027-05-20          # exit code 0 = business day, 3 = not
bd-holidays add 2026-12-14 10 --weekend fri
bd-holidays between 2026-03-01 2026-03-31
bd-holidays breaks 2026 --max-leave 1     # long weekends, and where one day of leave helps
bd-holidays sources
```

Exit codes: `0` success, `1` runtime error (for example a year without data), `2` usage error,
`3` from `check` when the date is not a business day.

## Configuration

| Option (`HolidayFilter`) | Default | Notes |
|--------------------------|---------|-------|
| `types` | `['general', 'executive']` | what counts as a holiday |
| `religions` | none | adds those religions' optional holidays |
| `region` | none | district for region-limited holidays; English or Bangla spelling |
| `includeTentative` | `true` | count unconfirmed moon-dependent dates |

`BusinessCalendar` accepts the same options plus `weekend`, `extraHolidays`, `workingDays` and
`unknownYear`.

## Data and sources

| Year | Document | Memo no. | Issued | Link |
|------|----------|----------|--------|------|
| 2025 | Bangladesh Gazette Extraordinary, 23 Oct 2024, pp. 27737-27740 | 05.00.0000.173.08.013.23-166 | 21 Oct 2024 | [gazette](https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/56081) |
| 2025 amendment | Cabinet Division gazette adding 5 August (July Mass Uprising Day), as reported by The Financial Express | n/a | 2 Jul 2025 | [report](https://today.thefinancialexpress.com.bd/last-page/govt-declares-aug-5-public-holiday-1751479640) |
| 2026 | Bangladesh Gazette Extraordinary, 12 Nov 2025, pp. 11835-11838 | 05.00.0000.000.175.08.0008.25-17 | 9 Nov 2025 | [gazette](https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/59216) |
| 2027 | Ministry of Public Administration notice on mopa.gov.bd | 05.00.0000.175.08.0008.25-105 | 5 Nov 2026 | [notice](https://mopa.gov.bd/pages/go-ultimates/6aec1a0f47e3ef92265ec740) |

All three yearly lists were transcribed from the official documents on 2026-11-15. The tests
check every entry's weekday against the weekday printed in the notice, and every section's
day count and weekly-holiday count against the printed totals.

Section totals (days) as printed:

| Year | General | Executive | Muslim | Hindu | Christian | Buddhist | Ethnic minority |
|------|---------|-----------|--------|-------|-----------|----------|-----------------|
| 2025 | 12 (+1 by amendment) | 14 | 5 | 9 | 8 | 7 | 2 |
| 2026 | 14 | 14 | 5 | 9 | 8 | 7 | 2 |
| 2027 | 15 | 14 | 6 | 9 | 8 | 7 | 2 |

Optional holidays: an employee may take at most three optional days a year, for their own
religion, with prior approval. The library lists them; it does not track who took which.

### Tentative dates

Dates marked `*` in the notices depend on the sighting of the moon (Eid, Shab-e-Barat,
Shab-e-Qadr, Ashura, Eid-e-Milad-un-Nabi and the Buddhist full-moon days). They carry
`moonDependent: true` and `tentative: true`. The government can move these holidays, and the
surrounding executive-order days, after the moon sighting committee meets. The library does not
know about such changes unless the data is updated, so:

- treat tentative dates as the planned dates, not the final ones;
- use `includeTentative: false` if you would rather ignore them;
- open an issue or pull request with the official announcement when a date moves. A confirmed
  date is marked with the `!` flag in the data and then has `tentative: false`.

## Testing

```bash
npm install
npm test             # builds, then: node --test dist/test/*.test.js
npm run lint
```

The suite uses the built-in `node:test` runner and covers the data integrity checks, date
handling, filters, business-day maths, exporters, the CLI (with an injected clock and file
writer) and the CommonJS build. CI runs on Node 20, 22 and 24.

## Limitations

- Only 2025, 2026 and 2027 are bundled. Dates outside that range throw `UnsupportedYearError`
  unless you choose `unknownYear: 'weekends-only'`.
- Moon-dependent dates are the dates printed in the notices. Later shifts after moon sighting
  are not included.
- Changes made after a notice was published are only included when listed under
  `amendments`. For 2025 that is the 5 August July Mass Uprising Day holiday; it is sourced
  from a newspaper report of the Cabinet Division gazette, not the gazette itself. Other
  ad-hoc changes, such as extra days announced around Eid by separate orders, are **not**
  included.
- The data covers government offices. Banks follow Bangladesh Bank's own list (which adds bank
  holidays such as 1 July and 31 December), and schools, courts and private employers can
  have their own calendars. Use `extraHolidays` and `workingDays` for those.
- Special one-off closures (elections, emergencies, compensatory working Saturdays) are not in
  the data.
- No Bangla calendar (Bangabda) conversion: the library works with Gregorian dates only.

## License

[MIT](LICENSE) © 2026 Saizul Amin
