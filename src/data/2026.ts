import type { RawYear } from './raw.js';

/**
 * 2026 holiday list.
 *
 * Source: Ministry of Public Administration notice no. 05.00.0000.000.175.08.0008.25-17,
 * dated 9 November 2025 (24 Kartik 1432), Bangladesh Gazette Extraordinary of
 * 12 November 2025, pages 11835-11838.
 */
export const Y2026: RawYear = {
  year: 2026,
  source: {
    title:
      'Ministry of Public Administration notice on holidays in 2026 (Bangladesh Gazette Extraordinary, 12 Nov 2025, pp. 11835-11838)',
    memo: '05.00.0000.000.175.08.0008.25-17',
    issued: '2025-11-09',
    gazetted: '2025-11-12',
    url: 'https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/59216',
    pdf: 'https://www.dpp.gov.bd/upload_file/gazettes/59216_19984.pdf',
    retrieved: '2026-11-15',
  },
  amendments: [],
  totals: {
    general: { days: 14, weeklyIncluded: 7 },
    executive: { days: 14, weeklyIncluded: 4 },
    muslim: { days: 5, weeklyIncluded: 1 },
    hindu: { days: 9, weeklyIncluded: 2 },
    christian: { days: 8, weeklyIncluded: 3 },
    buddhist: { days: 7, weeklyIncluded: 2 },
    'ethnic-minority': { days: 2, weeklyIncluded: null },
  },
  sections: {
    general: [
      ['2026-02-21', 'Sat', 'shaheed-day'],
      ['2026-03-20', 'Fri', 'jumatul-bida'],
      ['2026-03-21', 'Sat', 'eid-ul-fitr', '*'],
      ['2026-03-26', 'Thu', 'independence-day'],
      ['2026-04-13', 'Mon', 'chaitra-sankranti-cht'],
      ['2026-05-01', 'Fri', 'may-day'],
      ['2026-05-01', 'Fri', 'buddha-purnima', '*'],
      ['2026-05-28', 'Thu', 'eid-ul-azha', '*'],
      ['2026-08-05', 'Wed', 'july-uprising-day'],
      ['2026-08-26', 'Wed', 'eid-e-milad-un-nabi', '*'],
      ['2026-09-04', 'Fri', 'janmashtami'],
      ['2026-10-21', 'Wed', 'durga-puja-dashami'],
      ['2026-12-16', 'Wed', 'victory-day'],
      ['2026-12-25', 'Fri', 'christmas'],
    ],
    executive: [
      ['2026-02-04', 'Wed', 'shab-e-barat', '*'],
      ['2026-03-17', 'Tue', 'shab-e-qadr', '*'],
      ['2026-03-19', 'Thu', 'eid-ul-fitr-extended', '*'],
      ['2026-03-20', 'Fri', 'eid-ul-fitr-extended', '*'],
      ['2026-03-22', 'Sun', 'eid-ul-fitr-extended', '*'],
      ['2026-03-23', 'Mon', 'eid-ul-fitr-extended', '*'],
      ['2026-04-14', 'Tue', 'pohela-boishakh'],
      ['2026-05-26', 'Tue', 'eid-ul-azha-extended', '*'],
      ['2026-05-27', 'Wed', 'eid-ul-azha-extended', '*'],
      ['2026-05-29', 'Fri', 'eid-ul-azha-extended', '*'],
      ['2026-05-30', 'Sat', 'eid-ul-azha-extended', '*'],
      ['2026-05-31', 'Sun', 'eid-ul-azha-extended', '*'],
      ['2026-06-26', 'Fri', 'ashura', '*'],
      ['2026-10-20', 'Tue', 'durga-puja-nabami'],
    ],
    muslim: [
      ['2026-01-17', 'Sat', 'shab-e-miraj', '*'],
      ['2026-03-24', 'Tue', 'eid-ul-fitr-third-day', '*'],
      ['2026-06-01', 'Mon', 'eid-ul-azha-fourth-day', '*'],
      ['2026-08-12', 'Wed', 'akheri-chahar-shomba', '*'],
      ['2026-09-24', 'Thu', 'fateha-e-yazdaham', '*'],
    ],
    hindu: [
      ['2026-01-23', 'Fri', 'saraswati-puja'],
      ['2026-02-15', 'Sun', 'shivaratri'],
      ['2026-03-03', 'Tue', 'dol-jatra'],
      ['2026-03-17', 'Tue', 'harichand-thakur'],
      ['2026-10-10', 'Sat', 'mahalaya'],
      ['2026-10-18', 'Sun', 'durga-puja-saptami-ashtami'],
      ['2026-10-19', 'Mon', 'durga-puja-saptami-ashtami'],
      ['2026-10-25', 'Sun', 'lakshmi-puja'],
      ['2026-11-08', 'Sun', 'shyama-puja'],
    ],
    christian: [
      ['2026-01-01', 'Thu', 'english-new-year'],
      ['2026-02-18', 'Wed', 'ash-wednesday'],
      ['2026-04-02', 'Thu', 'maundy-thursday'],
      ['2026-04-03', 'Fri', 'good-friday'],
      ['2026-04-04', 'Sat', 'holy-saturday'],
      ['2026-04-05', 'Sun', 'easter-sunday'],
      ['2026-12-24', 'Thu', 'christmas-festival'],
      ['2026-12-26', 'Sat', 'christmas-festival'],
    ],
    buddhist: [
      ['2026-02-01', 'Sun', 'maghi-purnima', '*'],
      [
        '2026-04-13',
        'Mon',
        'chaitra-sankranti',
        '',
        'For employees outside the three hill districts (where it is a general holiday).',
      ],
      ['2026-04-30', 'Thu', 'buddha-purnima-adjacent'],
      ['2026-05-02', 'Sat', 'buddha-purnima-adjacent'],
      ['2026-07-29', 'Wed', 'ashari-purnima', '*'],
      ['2026-09-26', 'Sat', 'madhu-purnima', '*'],
      ['2026-10-25', 'Sun', 'probarona-purnima', '*'],
    ],
    'ethnic-minority': [
      ['2026-04-12', 'Sun', 'baisabi'],
      ['2026-04-15', 'Wed', 'baisabi'],
    ],
  },
};
