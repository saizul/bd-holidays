import { addDays } from '../date.js';
import { groupIntoRanges } from '../holidays.js';
import type { Holiday } from '../types.js';

export interface IcsOptions {
  /** Calendar name (X-WR-CALNAME). */
  calendarName?: string;
  /** Use Bangla names for SUMMARY. Default `false` (English, with Bangla in DESCRIPTION). */
  bangla?: boolean;
  /** Merge consecutive days of one observance into a single multi-day event. Default `true`. */
  mergeRanges?: boolean;
  /** Timestamp for DTSTAMP. Default: now. Pass a fixed date for reproducible output. */
  now?: Date;
  /** Domain used in UIDs. Default `bd-holidays.saizul.github.io`. */
  uidDomain?: string;
}

const PRODID = '-//Saizul Amin//bd-holidays//EN';

/** Escape a TEXT value (RFC 5545 section 3.3.11). */
export function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/**
 * Fold a content line to at most 75 octets per physical line (RFC 5545 section 3.1),
 * never splitting a multi-byte UTF-8 character.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const bytes = encoder.encode(ch).length;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    currentBytes += bytes;
  }
  if (current) parts.push(current);
  return parts.join('\r\n ');
}

function compact(iso: string): string {
  return iso.replace(/-/g, '');
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function typeLabel(h: { type: string; religion?: string }): string {
  if (h.type === 'general') return 'General holiday';
  if (h.type === 'executive') return 'Executive order holiday';
  return `Optional holiday (${h.religion})`;
}

/** Render holidays as an iCalendar (.ics) document with all-day events. */
export function toICS(holidays: readonly Holiday[], options: IcsOptions = {}): string {
  const now = options.now ?? new Date();
  const domain = options.uidDomain ?? 'bd-holidays.saizul.github.io';
  const merge = options.mergeRanges ?? true;
  const events = merge
    ? groupIntoRanges(holidays)
    : holidays.map((h) => ({ ...h, start: h.date, end: h.date, days: 1 }));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName ?? 'Bangladesh Government Holidays')}`,
    'X-WR-TIMEZONE:Asia/Dhaka',
  ];
  for (const e of events) {
    const summary = options.bangla ? e.nameBn : e.name;
    const description = [
      options.bangla ? e.name : e.nameBn,
      typeLabel(e),
      e.days > 1 ? `${e.days} days` : '',
      e.moonDependent ? 'Depends on the sighting of the moon' : '',
      e.tentative ? 'Tentative date' : '',
      e.regions ? `Only in: ${e.regions.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const categories = [e.type, e.religion].filter(Boolean).join(',');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${compact(e.start)}-${e.id}-${e.type}${e.religion ? `-${e.religion}` : ''}@${domain}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.end, 1))}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `CATEGORIES:${categories}`,
      `STATUS:${e.tentative ? 'TENTATIVE' : 'CONFIRMED'}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
