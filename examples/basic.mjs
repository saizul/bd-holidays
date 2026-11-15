// Run after `npm run build`:  node examples/basic.mjs
// In your own project, import from 'bd-holidays' instead of the dist path.
import {
  addBusinessDays,
  businessDaysBetween,
  getHolidaysInMonth,
  getYearInfo,
  isBusinessDay,
  isHoliday,
  nextBusinessDay,
} from '../dist/src/index.js';

console.log('Is 16 Dec 2026 a holiday?', isHoliday('2026-12-16'));
console.log('Is 1 Jan 2026 a business day?', isBusinessDay('2026-01-01'));
console.log('Next business day after 4 Mar 2027:', nextBusinessDay('2027-03-04'));
console.log('10 business days after 1 Mar 2026:', addBusinessDays('2026-03-01', 10));
console.log('Business days in (1 Mar, 31 Mar 2026]:', businessDaysBetween('2026-03-01', '2026-03-31'));

console.log('\nOctober 2026, Hindu optional days included:');
for (const h of getHolidaysInMonth(2026, 10, { religions: ['hindu'] })) {
  console.log(` ${h.date} ${h.weekday}  ${h.nameBn}  (${h.name}, ${h.type})`);
}

const info = getYearInfo(2027);
console.log(`\n2027 data source: ${info.source.title}\n  ${info.source.url}`);
