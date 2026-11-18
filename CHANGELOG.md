# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `findBreaks(from, to, options)`: long weekends and holiday breaks of at least `minDays`
  consecutive days off, for leave planning. With `maxLeave`, runs of days off separated by up to
  that many working days are joined and the working days are listed as `leaveDays`. Accepts every
  `BusinessCalendar` option, reports breaks that cross the range edges whole and stops cleanly at
  the end of the bundled data.
- `bd-holidays breaks [year|from..to] [--min-days N] [--max-leave N]` with table (English or
  Bangla names) and JSON output.
- Contributor community files: `CODE_OF_CONDUCT.md`, issue templates and a pull request
  template.

## [0.1.0] - 2026-11-15

### Added

- Bundled government holiday data for 2025, 2026 and 2027, transcribed from the Ministry of
  Public Administration notices (gazette and mopa.gov.bd), with memo number, issue date,
  gazette date, page URL, PDF URL and retrieval date per year.
- General, executive-order and optional holidays (Muslim, Hindu, Christian, Buddhist and
  ethnic minority communities), each with English and Bangla names.
- Moon-dependent dates flagged (`moonDependent`, `tentative`) and region-limited holidays
  (Chaitra Sankranti in Rangamati, Khagrachhari and Bandarban) modelled with `regions`.
- 2025 amendment: 5 August, July Mass Uprising Day, added as a general holiday.
- API: `isHoliday`, `getHolidays`, `getHolidaysInMonth`, `getHolidaysOn`, `getHolidaysBetween`,
  `nextHoliday`, `previousHoliday`, `findHolidays`, `groupIntoRanges`, `getYearInfo`.
- Business days: `isBusinessDay`, `addBusinessDays`, `subtractBusinessDays`,
  `businessDaysBetween`, `nextBusinessDay`, `previousBusinessDay`, `businessDaysInMonth`, and a
  configurable `BusinessCalendar` (weekend, extra holidays, working-day overrides, region,
  tentative handling, unknown-year policy, roll conventions).
- iCalendar, CSV and JSON exporters.
- `bd-holidays` CLI: `list`, `export`, `check`, `next`, `add`, `between`, `business-days`,
  `sources`, `years`.
- ESM and CommonJS builds with type declarations; zero runtime dependencies.

[0.1.0]: https://github.com/saizul/bd-holidays/releases/tag/v0.1.0
