/** An ISO calendar date, `YYYY-MM-DD`. */
export type ISODate = string;

/** Anything the library accepts as a date. `Date` objects are read in Asia/Dhaka time (UTC+6). */
export type DateInput = ISODate | Date;

/**
 * Holiday category as printed in the Ministry of Public Administration notice.
 *
 * - `general`   (ক) সাধারণ ছুটি: general (public) holidays
 * - `executive` (খ) নির্বাহী আদেশে সরকারি ছুটি: government holidays by executive order
 * - `optional`  (গ-ছ) ঐচ্ছিক ছুটি: optional holidays, chosen per religion (up to 3 days a year)
 */
export type HolidayType = 'general' | 'executive' | 'optional';

/** Religion or community an optional holiday belongs to. */
export type Religion = 'muslim' | 'hindu' | 'christian' | 'buddhist' | 'ethnic-minority';

/** Short English weekday name. */
export type Weekday = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface Holiday {
  /** Calendar date of the holiday (one entry per day). */
  date: ISODate;
  /** Weekday as printed in the official notice. */
  weekday: Weekday;
  /** Stable identifier of the observance, e.g. `eid-ul-fitr`. Multi-day observances repeat it. */
  id: string;
  /** English name. */
  name: string;
  /** Bangla name as printed in the notice. */
  nameBn: string;
  type: HolidayType;
  /** Set for optional holidays only. */
  religion?: Religion;
  /** Marked with `*` in the notice: depends on the sighting of the moon (or a lunar date). */
  moonDependent: boolean;
  /**
   * The date may still move. True for moon-dependent dates whose actual observance has not
   * been confirmed in the bundled data.
   */
  tentative: boolean;
  /** Only observed in these districts. `undefined` means nationwide. */
  regions?: string[];
  /** Extra remarks, e.g. an amendment reference. */
  note?: string;
  /** Year whose source document lists this entry. */
  sourceYear: number;
}

export interface SourceDocument {
  /** Short description of the document. */
  title: string;
  /** Memo number (স্মারক নং) of the notice. */
  memo?: string;
  /** Date the notice was signed. */
  issued: ISODate;
  /** Date it appeared in the Bangladesh Gazette, if known. */
  gazetted?: ISODate;
  /** Page or listing URL. */
  url: string;
  /** Direct link to the PDF, if any. */
  pdf?: string;
  /** When the data was transcribed from the document. */
  retrieved: ISODate;
}

export interface SectionTotal {
  /** Total days in the section as printed in the notice (মোট). */
  days: number;
  /** Number of those days that fall on the weekly holiday, as printed. `null` if not printed. */
  weeklyIncluded: number | null;
}

export interface YearInfo {
  year: number;
  source: SourceDocument;
  /** Additional documents that changed the list after it was published. */
  amendments: SourceDocument[];
  /** Section totals printed in the notice, keyed by section. */
  totals: Record<SectionKey, SectionTotal>;
  /** True when the whole list comes from an official document. */
  confirmed: boolean;
}

export type SectionKey =
  | 'general'
  | 'executive'
  | 'muslim'
  | 'hindu'
  | 'christian'
  | 'buddhist'
  | 'ethnic-minority';

/** Options that decide which holidays count. */
export interface HolidayFilter {
  /** Holiday types to include. Default `['general', 'executive']`. */
  types?: HolidayType[];
  /** Include optional holidays for these religions (adds `optional` to `types` implicitly). */
  religions?: Religion[];
  /**
   * District the office is in. Region-restricted holidays (Chaitra Sankranti in the three
   * hill districts) only count when this matches. Default: none, so they do not count.
   */
  region?: string;
  /** Count tentative (moon-dependent, unconfirmed) dates. Default `true`. */
  includeTentative?: boolean;
}

/** What to do when a date falls in a year with no bundled data. */
export type UnknownYearPolicy = 'throw' | 'weekends-only';

export interface CalendarOptions extends HolidayFilter {
  /**
   * Weekly holidays as weekday numbers (0 = Sunday ... 6 = Saturday) or short names.
   * Default Friday and Saturday, the weekly holidays of government offices.
   */
  weekend?: Array<number | Weekday>;
  /** Extra non-working dates (company holidays, emergency closures). */
  extraHolidays?: DateInput[];
  /** Dates that are working days even if they fall on a weekend or holiday (e.g. compensatory working Saturdays). */
  workingDays?: DateInput[];
  /** Default `'throw'`. */
  unknownYear?: UnknownYearPolicy;
}
