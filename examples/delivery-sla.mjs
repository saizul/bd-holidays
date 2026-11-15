// Delivery promise for an online shop that works Saturday to Thursday (Friday off),
// closes for the government holidays, and also shuts on its own anniversary.
// Run after `npm run build`:  node examples/delivery-sla.mjs
import { BusinessCalendar } from '../dist/src/index.js';

const shop = new BusinessCalendar({
  weekend: ['Fri'],
  extraHolidays: ['2026-06-10'],
  // Compensatory working day declared by the shop.
  workingDays: ['2026-05-29'],
});

for (const ordered of ['2026-03-18', '2026-05-25', '2026-06-08', '2026-12-15']) {
  const due = shop.addBusinessDays(ordered, 3);
  console.log(`Ordered ${ordered} -> delivered by ${due} (${shop.businessDaysBetween(ordered, due)} business days)`);
}

// Settlement dates usually roll with "modified following": 30 Apr 2027 is a Friday and 1 May is
// May Day, so rolling forward would leave April; the date rolls back to Thursday 29 April.
console.log('\nSettlement for 30 Apr 2027:', shop.roll('2027-04-30', 'modified-following'));
