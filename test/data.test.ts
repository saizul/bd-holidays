import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_KEYS, rawYears } from '../src/data/index.js';
import { NAMES } from '../src/data/names.js';
import { isValidISODate, weekdayName, weekdayIndex } from '../src/date.js';
import { getYearInfo, listAll, supportedYears } from '../src/index.js';

describe('bundled data integrity', () => {
  test('covers 2025, 2026 and 2027', () => {
    assert.deepEqual(supportedYears(), [2025, 2026, 2027]);
  });

  for (const raw of rawYears()) {
    describe(String(raw.year), () => {
      test('every date is valid, in the right year, and its weekday matches the notice', () => {
        for (const section of SECTION_KEYS) {
          for (const [date, weekday] of raw.sections[section]) {
            assert.ok(isValidISODate(date), `${date} is not a valid date`);
            assert.equal(date.slice(0, 4), String(raw.year), `${date} is outside ${raw.year}`);
            assert.equal(weekdayName(date), weekday, `${date} is a ${weekdayName(date)}, notice says ${weekday}`);
          }
        }
        for (const a of raw.amendments) {
          for (const [date, weekday] of a.entries) assert.equal(weekdayName(date), weekday);
        }
      });

      test('section day counts match the totals printed in the notice', () => {
        for (const section of SECTION_KEYS) {
          assert.equal(
            raw.sections[section].length,
            raw.totals[section].days,
            `${raw.year} ${section}: ${raw.sections[section].length} entries, notice total ${raw.totals[section].days}`,
          );
        }
      });

      test('weekly-holiday counts (Fri/Sat) match the notice', () => {
        for (const section of SECTION_KEYS) {
          const expected = raw.totals[section].weeklyIncluded;
          if (expected === null) continue;
          const actual = raw.sections[section].filter(([d]) => [5, 6].includes(weekdayIndex(d))).length;
          assert.equal(actual, expected, `${raw.year} ${section}`);
        }
      });

      test('entries are in date order and not duplicated within a section', () => {
        for (const section of SECTION_KEYS) {
          const keys = raw.sections[section].map(([d, , k]) => `${d}|${k}`);
          assert.equal(new Set(keys).size, keys.length, `${raw.year} ${section} has duplicates`);
          const dates = raw.sections[section].map(([d]) => d);
          assert.deepEqual(dates, [...dates].sort(), `${raw.year} ${section} is not sorted`);
        }
      });

      test('source is recorded with URL, issue date and retrieval date', () => {
        const info = getYearInfo(raw.year);
        assert.match(info.source.url, /^https:\/\/(www\.)?(dpp|mopa)\.gov\.bd\//);
        assert.ok(isValidISODate(info.source.issued));
        assert.ok(isValidISODate(info.source.retrieved));
        assert.ok(info.source.issued < `${raw.year}-01-01`, 'notice is issued before the year starts');
        assert.ok(info.source.memo && /^05\.00\.0000\./.test(info.source.memo));
        if (info.source.pdf) assert.match(info.source.pdf, /^https:\/\/.+\.pdf$/);
        assert.equal(info.confirmed, true);
      });
    });
  }

  test('every observance key has English and Bangla names', () => {
    for (const [key, name] of Object.entries(NAMES)) {
      assert.ok(name.en.length > 2, key);
      assert.match(name.bn, /[ঀ-৿]/, `${key} Bangla name has no Bangla script`);
    }
  });

  test('fixed national days are present every year', () => {
    for (const year of supportedYears()) {
      const all = listAll(year);
      const has = (date: string, id: string) =>
        assert.ok(all.some((h) => h.date === date && h.id === id), `${year}: missing ${id} on ${date}`);
      has(`${year}-02-21`, 'shaheed-day');
      has(`${year}-03-26`, 'independence-day');
      has(`${year}-04-14`, 'pohela-boishakh');
      has(`${year}-05-01`, 'may-day');
      has(`${year}-08-05`, 'july-uprising-day');
      has(`${year}-12-16`, 'victory-day');
      has(`${year}-12-25`, 'christmas');
    }
  });

  test('moon-dependent entries are tentative unless confirmed, others never are', () => {
    for (const year of supportedYears()) {
      for (const h of listAll(year)) {
        if (!h.moonDependent) assert.equal(h.tentative, false, `${h.date} ${h.id}`);
        else assert.equal(h.tentative, true, `${h.date} ${h.id}`);
      }
    }
  });

  test('Eid days are marked moon-dependent; fixed festivals are not', () => {
    for (const year of supportedYears()) {
      for (const h of listAll(year)) {
        if (h.id.startsWith('eid-ul-') || h.id === 'ashura' || h.id.startsWith('shab-e-')) {
          assert.equal(h.moonDependent, true, `${h.date} ${h.id}`);
        }
        if (['victory-day', 'shaheed-day', 'independence-day', 'christmas', 'may-day'].includes(h.id)) {
          assert.equal(h.moonDependent, false, `${h.date} ${h.id}`);
        }
      }
    }
  });

  test('2025 records the July Mass Uprising Day amendment with its own source', () => {
    const info = getYearInfo(2025);
    assert.equal(info.amendments.length, 1);
    assert.equal(info.amendments[0]!.issued, '2025-07-02');
    const day = listAll(2025).find((h) => h.id === 'july-uprising-day');
    assert.ok(day?.note?.includes('Cabinet Division'));
    assert.equal(day?.type, 'general');
  });

  test('Chaitra Sankranti general holiday is limited to the three hill districts (2026, 2027)', () => {
    for (const year of [2026, 2027]) {
      const h = listAll(year).find((x) => x.id === 'chaitra-sankranti-cht');
      assert.ok(h);
      assert.equal(h.type, 'general');
      assert.deepEqual(h.regions, ['Rangamati', 'Khagrachhari', 'Bandarban']);
    }
    assert.equal(
      listAll(2025).some((x) => x.id === 'chaitra-sankranti-cht'),
      false,
    );
  });

  test('section totals per year', () => {
    const general = supportedYears().map((y) => getYearInfo(y).totals.general.days);
    assert.deepEqual(general, [12, 14, 15]);
    const executive = supportedYears().map((y) => getYearInfo(y).totals.executive.days);
    assert.deepEqual(executive, [14, 14, 14]);
  });

  test('listAll returns copies, so callers cannot corrupt the bundled data', () => {
    const first = listAll(2026);
    first[0]!.name = 'changed';
    first[0]!.regions = ['x'];
    assert.notEqual(listAll(2026)[0]!.name, 'changed');
    const info = getYearInfo(2026);
    info.totals.general.days = 0;
    assert.equal(getYearInfo(2026).totals.general.days, 14);
  });
});
