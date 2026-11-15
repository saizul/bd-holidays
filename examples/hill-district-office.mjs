// An office in Rangamati also closes for Chaitra Sankranti (general holiday in the three hill districts).
// Run after `npm run build`:  node examples/hill-district-office.mjs
import { BusinessCalendar, isBusinessDay } from '../dist/src/index.js';

const rangamati = new BusinessCalendar({ region: 'Rangamati' });
console.log('13 Apr 2026, Dhaka office open?    ', isBusinessDay('2026-04-13'));
console.log('13 Apr 2026, Rangamati office open?', rangamati.isBusinessDay('2026-04-13'));
console.log(rangamati.status('2026-04-13'));
