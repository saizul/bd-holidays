import type { RawYear } from './raw.js';

/**
 * 2025 holiday list.
 *
 * Source: Ministry of Public Administration notice no. 05.00.0000.173.08.013.23-166,
 * dated 21 October 2024 (05 Kartik 1431), Bangladesh Gazette Extraordinary of
 * 23 October 2024, pages 27737-27740.
 */
export const Y2025: RawYear = {
  year: 2025,
  source: {
    title:
      'Ministry of Public Administration notice on holidays in 2025 (Bangladesh Gazette Extraordinary, 23 Oct 2024, pp. 27737-27740)',
    memo: '05.00.0000.173.08.013.23-166',
    issued: '2024-10-21',
    gazetted: '2024-10-23',
    url: 'https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/56081',
    pdf: 'https://www.dpp.gov.bd/upload_file/gazettes/56081_74888.pdf',
    retrieved: '2026-11-15',
  },
  amendments: [
    {
      source: {
        title:
          'Cabinet Division gazette declaring 5 August "July Mass Uprising Day" a general holiday (as reported by The Financial Express, 3 Jul 2025)',
        issued: '2025-07-02',
        url: 'https://today.thefinancialexpress.com.bd/last-page/govt-declares-aug-5-public-holiday-1751479640',
        retrieved: '2026-11-15',
      },
      section: 'general',
      entries: [
        [
          '2025-08-05',
          'Tue',
          'july-uprising-day',
          '',
          'Added after the 2025 notice by a Cabinet Division gazette of 2 July 2025.',
        ],
      ],
    },
  ],
  totals: {
    general: { days: 12, weeklyIncluded: 5 },
    executive: { days: 14, weeklyIncluded: 4 },
    muslim: { days: 5, weeklyIncluded: 1 },
    hindu: { days: 9, weeklyIncluded: 1 },
    christian: { days: 8, weeklyIncluded: 3 },
    buddhist: { days: 7, weeklyIncluded: 2 },
    'ethnic-minority': { days: 2, weeklyIncluded: 1 },
  },
  sections: {
    general: [
      ['2025-02-21', 'Fri', 'shaheed-day'],
      ['2025-03-26', 'Wed', 'independence-day'],
      ['2025-03-28', 'Fri', 'jumatul-bida'],
      ['2025-03-31', 'Mon', 'eid-ul-fitr', '*'],
      ['2025-05-01', 'Thu', 'may-day'],
      ['2025-05-11', 'Sun', 'buddha-purnima', '*'],
      ['2025-06-07', 'Sat', 'eid-ul-azha', '*'],
      ['2025-08-16', 'Sat', 'janmashtami'],
      ['2025-09-05', 'Fri', 'eid-e-milad-un-nabi', '*'],
      ['2025-10-02', 'Thu', 'durga-puja-dashami'],
      ['2025-12-16', 'Tue', 'victory-day'],
      ['2025-12-25', 'Thu', 'christmas'],
    ],
    executive: [
      ['2025-02-15', 'Sat', 'shab-e-barat', '*'],
      ['2025-03-28', 'Fri', 'shab-e-qadr', '*'],
      ['2025-03-29', 'Sat', 'eid-ul-fitr-extended', '*'],
      ['2025-03-30', 'Sun', 'eid-ul-fitr-extended', '*'],
      ['2025-04-01', 'Tue', 'eid-ul-fitr-extended', '*'],
      ['2025-04-02', 'Wed', 'eid-ul-fitr-extended', '*'],
      ['2025-04-14', 'Mon', 'pohela-boishakh'],
      ['2025-06-05', 'Thu', 'eid-ul-azha-extended', '*'],
      ['2025-06-06', 'Fri', 'eid-ul-azha-extended', '*'],
      ['2025-06-08', 'Sun', 'eid-ul-azha-extended', '*'],
      ['2025-06-09', 'Mon', 'eid-ul-azha-extended', '*'],
      ['2025-06-10', 'Tue', 'eid-ul-azha-extended', '*'],
      ['2025-07-06', 'Sun', 'ashura', '*'],
      ['2025-10-01', 'Wed', 'durga-puja-nabami'],
    ],
    muslim: [
      ['2025-01-28', 'Tue', 'shab-e-miraj', '*'],
      ['2025-04-03', 'Thu', 'eid-ul-fitr-third-day', '*'],
      ['2025-06-11', 'Wed', 'eid-ul-azha-fourth-day', '*'],
      ['2025-08-20', 'Wed', 'akheri-chahar-shomba', '*'],
      ['2025-10-04', 'Sat', 'fateha-e-yazdaham', '*'],
    ],
    hindu: [
      ['2025-02-03', 'Mon', 'saraswati-puja'],
      ['2025-02-26', 'Wed', 'shivaratri'],
      ['2025-03-14', 'Fri', 'dol-jatra'],
      ['2025-03-27', 'Thu', 'harichand-thakur'],
      ['2025-09-21', 'Sun', 'mahalaya'],
      ['2025-09-29', 'Mon', 'durga-puja-saptami-ashtami'],
      ['2025-09-30', 'Tue', 'durga-puja-saptami-ashtami'],
      ['2025-10-06', 'Mon', 'lakshmi-puja'],
      ['2025-10-20', 'Mon', 'shyama-puja'],
    ],
    christian: [
      ['2025-01-01', 'Wed', 'english-new-year'],
      ['2025-03-05', 'Wed', 'ash-wednesday'],
      ['2025-04-17', 'Thu', 'maundy-thursday'],
      ['2025-04-18', 'Fri', 'good-friday'],
      ['2025-04-19', 'Sat', 'holy-saturday'],
      ['2025-04-20', 'Sun', 'easter-sunday'],
      ['2025-12-24', 'Wed', 'christmas-festival'],
      ['2025-12-26', 'Fri', 'christmas-festival'],
    ],
    buddhist: [
      ['2025-02-11', 'Tue', 'maghi-purnima', '*'],
      ['2025-04-13', 'Sun', 'chaitra-sankranti'],
      ['2025-05-10', 'Sat', 'buddha-purnima-adjacent'],
      ['2025-05-12', 'Mon', 'buddha-purnima-adjacent'],
      ['2025-07-09', 'Wed', 'ashari-purnima', '*'],
      ['2025-09-06', 'Sat', 'madhu-purnima', '*'],
      ['2025-10-05', 'Sun', 'probarona-purnima', '*'],
    ],
    'ethnic-minority': [
      ['2025-04-12', 'Sat', 'baisabi'],
      ['2025-04-15', 'Tue', 'baisabi'],
    ],
  },
};
