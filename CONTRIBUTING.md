# Contributing

Thanks for helping. Bug reports, data corrections and pull requests are all welcome.

## Development setup

```bash
git clone https://github.com/saizul/bd-holidays.git
cd bd-holidays
npm install
npm test        # builds, then runs node:test on dist/test/*.test.js
npm run lint    # type-check only
```

Node 20 or newer is required. The library has no runtime dependencies; please keep it that way.

## Data corrections

Holiday data lives in `src/data/<year>.ts`. Every change must be traceable to an official
document:

1. Link the notice, gazette or amendment (Ministry of Public Administration, Cabinet Division,
   Bangladesh Government Press) in the pull request.
2. Keep entries in date order, one entry per day, with the weekday exactly as printed.
3. Keep the `totals` block in sync with the totals printed in the notice. The data tests check
   that counts and weekly-holiday counts match.
4. Changes made after a notice was published go in `amendments` with their own source.
5. If a moon-dependent date has been confirmed as observed, mark it with the `!` flag and cite
   the announcement (for example the National Moon Sighting Committee decision).

## Adding a new year

Copy the latest year file, replace the source block and the entries, register it in
`src/data/index.ts`, and extend the tests that list supported years.

## Code style

- TypeScript, strict mode, ES modules.
- Small pure functions; dates are handled as `YYYY-MM-DD` strings with UTC arithmetic.
- Add or update tests for every behaviour change.

## Commit messages

Short imperative summary line (for example `Add 2028 holiday notice`), with detail in the body
when needed.
