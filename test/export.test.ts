import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_TYPES, getHolidays, parseCSV, toCSV, toICS, toJSON } from '../src/index.js';
import { escapeText, foldLine } from '../src/export/ics.js';
import { csvField } from '../src/export/csv.js';

const NOW = new Date('2026-11-15T00:00:00Z');

describe('iCalendar export', () => {
  const ics = toICS(getHolidays(2026), { now: NOW });

  test('has calendar envelope and CRLF line endings', () => {
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Saizul Amin//bd-holidays//EN\r\n'));
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
    assert.ok(!/[^\r]\n/.test(ics), 'bare LF found');
  });

  test('uses all-day events with exclusive DTEND and merged ranges', () => {
    assert.match(ics, /DTSTART;VALUE=DATE:20261216\r\nDTEND;VALUE=DATE:20261217/);
    // Eid-ul-Fitr extended: 19-20 March merged into one event ending 21 March.
    assert.match(ics, /DTSTART;VALUE=DATE:20260319\r\nDTEND;VALUE=DATE:20260321/);
    assert.match(ics, /DTSTAMP:20261115T000000Z/);
  });

  test('marks tentative dates', () => {
    assert.match(ics, /SUMMARY:Eid-ul-Azha\r\n[\s\S]*?STATUS:TENTATIVE/);
    const victory = ics.split('BEGIN:VEVENT').find((e) => e.includes('SUMMARY:Victory Day'))!;
    assert.match(victory, /STATUS:CONFIRMED/);
  });

  test('UIDs are unique', () => {
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
    assert.equal(new Set(uids).size, uids.length);
  });

  test('no physical line exceeds 75 octets', () => {
    const big = toICS(getHolidays(2027, { types: [...ALL_TYPES], region: 'Rangamati' }), { now: NOW, bangla: true });
    for (const line of big.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
    assert.match(big, /SUMMARY:বিজয় দিবস/);
  });

  test('unmerged mode emits one event per day', () => {
    const one = toICS(getHolidays(2026, { types: ['executive'] }), { now: NOW, mergeRanges: false });
    assert.equal((one.match(/BEGIN:VEVENT/g) ?? []).length, 14);
  });

  test('text escaping and folding helpers', () => {
    assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
    assert.equal(foldLine('short'), 'short');
    const folded = foldLine('X'.repeat(200));
    assert.deepEqual(folded.split('\r\n ').map((p) => p.length), [75, 74, 51]);
    const bangla = foldLine('SUMMARY:' + 'বিজয়'.repeat(20));
    for (const part of bangla.split('\r\n')) assert.ok(Buffer.byteLength(part) <= 75);
    assert.equal(bangla.replace(/\r\n /g, ''), 'SUMMARY:' + 'বিজয়'.repeat(20));
  });
});

describe('CSV export', () => {
  test('header, rows and round trip', () => {
    const list = getHolidays(2027, { types: [...ALL_TYPES], region: 'Bandarban' });
    const csv = toCSV(list);
    const rows = parseCSV(csv);
    assert.deepEqual(rows[0], ['date', 'weekday', 'id', 'name', 'name_bn', 'type', 'religion', 'moon_dependent', 'tentative', 'regions', 'note']);
    assert.equal(rows.length, list.length + 1);
    const cht = rows.find((r) => r[2] === 'chaitra-sankranti-cht')!;
    assert.equal(cht[9], 'Rangamati;Khagrachhari;Bandarban');
    assert.ok(cht[3]!.includes(','), 'name with comma survives quoting');
  });

  test('BOM option and quoting', () => {
    assert.ok(toCSV([], { bom: true }).startsWith('﻿date,'));
    assert.equal(csvField('plain'), 'plain');
    assert.equal(csvField('a,b'), '"a,b"');
    assert.equal(csvField('say "hi"'), '"say ""hi"""');
    assert.deepEqual(parseCSV('a,"b,c","d""e"\r\n1,2,3'), [['a', 'b,c', 'd"e'], ['1', '2', '3']]);
    assert.deepEqual(parseCSV('﻿x\ny\n'), [['x'], ['y']]);
  });
});

describe('JSON export', () => {
  test('includes sources of the years used', () => {
    const parsed = JSON.parse(toJSON(getHolidays(2025), { now: NOW }));
    assert.equal(parsed.generatedAt, '2026-11-15T00:00:00.000Z');
    assert.equal(parsed.years.length, 1);
    assert.equal(parsed.years[0].source.memo, '05.00.0000.173.08.013.23-166');
    assert.equal(parsed.holidays.length, 27);
    const bare = JSON.parse(toJSON(getHolidays(2025), { withSources: false, indent: 0 }));
    assert.deepEqual(bare.years, []);
  });
});
