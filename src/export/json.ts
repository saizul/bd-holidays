import { getYearInfo } from '../holidays.js';
import type { Holiday, YearInfo } from '../types.js';

export interface JsonExport {
  generatedAt: string;
  years: YearInfo[];
  holidays: Holiday[];
}

export interface JsonOptions {
  /** Include source documents for every year in the export. Default `true`. */
  withSources?: boolean;
  /** Indentation. Default 2. */
  indent?: number;
  now?: Date;
}

/** Render holidays as JSON, with the source document of each year they come from. */
export function toJSON(holidays: readonly Holiday[], options: JsonOptions = {}): string {
  const years = [...new Set(holidays.map((h) => h.sourceYear))].sort();
  const payload: JsonExport = {
    generatedAt: (options.now ?? new Date()).toISOString(),
    years: options.withSources === false ? [] : years.map(getYearInfo),
    holidays: [...holidays],
  };
  return JSON.stringify(payload, null, options.indent ?? 2) + '\n';
}
