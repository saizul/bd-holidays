import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { HELP, VERSION, parseArgs, runCli, type CliIO } from '../src/cli.js';

function run(argv: string[], now = '2026-11-15T06:00:00Z') {
  let stdout = '';
  let stderr = '';
  const files = new Map<string, string>();
  const io: CliIO = {
    stdout: (t) => (stdout += t),
    stderr: (t) => (stderr += t),
    writeFile: (p, c) => files.set(p, c),
    now: () => new Date(now),
  };
  const code = runCli(argv, io);
  return { code, stdout, stderr, files };
}

describe('CLI', () => {
  test('help and version', () => {
    assert.equal(run(['--help']).stdout, HELP);
    assert.equal(run(['--help']).code, 0);
    assert.equal(run([]).code, 1);
    assert.equal(run(['-v']).stdout, `${VERSION}\n`);
  });

  test('version matches package.json', () => {
    const require = createRequire(import.meta.url);
    const pkg = require('../../package.json') as { version: string };
    assert.equal(VERSION, pkg.version);
  });

  test('list prints a table for the current year by default', () => {
    const r = run(['list']);
    assert.equal(r.code, 0);
    assert.match(r.stdout, /^Date\s+Day\s+Type\s+Name/);
    assert.match(r.stdout, /2026-12-16\s+Wed\s+general\s+Victory Day/);
    assert.match(r.stdout, /\* tentative/);
  });

  test('list with month, religion and Bangla names', () => {
    const r = run(['list', '2026', '--month', '10', '--religion', 'hindu', '--lang', 'bn']);
    assert.match(r.stdout, /শ্রীশ্রী লক্ষ্মী পূজা/);
    assert.match(r.stdout, /optional\/hindu/);
    assert.doesNotMatch(r.stdout, /2026-12/);
  });

  test('list --format json / csv', () => {
    const json = JSON.parse(run(['list', '2027', '--format', 'json']).stdout);
    assert.equal(json.holidays.length, 28);
    const csv = run(['list', '2027', '--all', '--format=csv']).stdout;
    assert.ok(csv.startsWith('date,weekday,'));
  });

  test('export writes an ics file', () => {
    const r = run(['export', '2027', '--all', '--out', 'bd-2027.ics']);
    assert.equal(r.code, 0);
    assert.match(r.files.get('bd-2027.ics')!, /BEGIN:VCALENDAR/);
    assert.match(r.stderr, /Wrote bd-2027.ics/);
  });

  test('export accepts a date range', () => {
    const r = run(['export', '2026-12-01..2027-01-31', '--format', 'csv']);
    const lines = r.stdout.trim().split('\r\n');
    assert.deepEqual(lines.slice(1).map((l) => l.slice(0, 10)), ['2026-12-16', '2026-12-25', '2027-01-24']);
  });

  test('export without a year is a usage error', () => {
    const r = run(['export']);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /needs a year/);
  });

  test('check reports business days with exit codes', () => {
    const ok = run(['check', '2026-12-15']);
    assert.equal(ok.code, 0);
    assert.match(ok.stdout, /2026-12-15 \(Tue\): business day/);
    const off = run(['check', '2026-12-16']);
    assert.equal(off.code, 3);
    assert.match(off.stdout, /not a business day: Victory Day \(general\)/);
    const weekend = run(['check', '2026-12-25']);
    assert.match(weekend.stdout, /weekly holiday; Christmas Day/);
    const json = JSON.parse(run(['check', '2027-03-10', '--format', 'json']).stdout);
    assert.equal(json.holidays[0].tentative, true);
    // "today" comes from the injected clock (Dhaka time).
    assert.match(run(['check'], '2026-12-15T19:30:00Z').stdout, /^2026-12-16/);
  });

  test('check with custom weekend and working day', () => {
    assert.equal(run(['check', '2026-01-03', '--weekend', 'fri']).code, 0);
    assert.equal(run(['check', '2026-01-03', '--working', '2026-01-03']).code, 0);
    assert.equal(run(['check', '2026-01-04', '--extra', '2026-01-04']).code, 3);
  });

  test('next, add, between, business-days', () => {
    assert.match(run(['next', '2026-12-16']).stdout, /Christmas Day/);
    assert.equal(run(['next', '2027-12-25']).code, 1);
    assert.equal(run(['add', '2026-12-14', '2']).stdout, '2026-12-17\n');
    assert.equal(run(['add', '2026-12-17', '-2']).stdout, '2026-12-14\n');
    assert.equal(run(['between', '2026-12-14', '2026-12-17']).stdout, '2\n');
    const bd = run(['business-days', '2026', '12']);
    assert.match(bd.stdout, /^22 business days/);
    assert.deepEqual(JSON.parse(run(['business-days', '2026', '12', '--format', 'json']).stdout).length, 22);
  });

  test('sources and years', () => {
    const s = run(['sources']);
    assert.match(s.stdout, /2025: Ministry of Public Administration/);
    assert.match(s.stdout, /memo:\s+05\.00\.0000\.175\.08\.0008\.25-105/);
    assert.match(s.stdout, /amendment: Cabinet Division/);
    assert.equal(JSON.parse(run(['sources', '2026', '--format', 'json']).stdout)[0].year, 2026);
    assert.equal(run(['years']).stdout, '2025\n2026\n2027\n');
  });

  test('errors', () => {
    assert.equal(run(['frobnicate']).code, 2);
    assert.equal(run(['list', '20x6']).code, 2);
    assert.equal(run(['list', '2030']).code, 1);
    assert.match(run(['list', '2030']).stderr, /No holiday data for 2030/);
    assert.equal(run(['list', '--format']).code, 2);
    assert.equal(run(['list', '--format', 'xml']).code, 2);
    assert.equal(run(['list', '--lang', 'fr']).code, 2);
    assert.equal(run(['list', '--month', '13']).code, 2);
    assert.equal(run(['add', '2026-01-01', 'x']).code, 2);
    assert.equal(run(['add', '2026-01-01']).code, 2);
    assert.equal(run(['between', '2026-01-01']).code, 2);
    assert.equal(run(['check', '2026-02-30']).code, 1);
    assert.equal(run(['check', '2028-01-01']).code, 1);
    assert.equal(run(['check', '2028-01-02', '--unknown-year', 'weekends-only']).code, 0);
    assert.equal(run(['check', '2028-01-02', '--unknown-year', 'sometimes']).code, 2);
  });

  test('parseArgs', () => {
    const a = parseArgs(['list', '2026', '--all', '--type=general', '--region', 'Bandarban']);
    assert.deepEqual(a.positional, ['list', '2026']);
    assert.equal(a.flags.get('all'), true);
    assert.equal(a.flags.get('type'), 'general');
    assert.equal(a.flags.get('region'), 'Bandarban');
  });
});
