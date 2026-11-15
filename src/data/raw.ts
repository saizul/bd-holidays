import type { ISODate, SectionKey, SectionTotal, SourceDocument, Weekday } from '../types.js';
import type { ObservanceKey } from './names.js';

/**
 * One day of a holiday as transcribed from a notice:
 * `[date, weekday as printed, observance key, flags?, note?]`.
 *
 * Flags: `*` = moon-dependent (marked with an asterisk in the notice),
 * `!` = moon-dependent date confirmed as observed (not tentative).
 */
export type RawEntry =
  | readonly [ISODate, Weekday, ObservanceKey]
  | readonly [ISODate, Weekday, ObservanceKey, string]
  | readonly [ISODate, Weekday, ObservanceKey, string, string];

export interface RawYear {
  year: number;
  source: SourceDocument;
  /** Entries added or changed after the notice, with the document that made the change. */
  amendments: Array<{ source: SourceDocument; section: SectionKey; entries: RawEntry[] }>;
  totals: Record<SectionKey, SectionTotal>;
  sections: Record<SectionKey, RawEntry[]>;
}
