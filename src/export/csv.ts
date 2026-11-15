import type { Holiday } from '../types.js';

export const CSV_COLUMNS = [
  'date',
  'weekday',
  'id',
  'name',
  'name_bn',
  'type',
  'religion',
  'moon_dependent',
  'tentative',
  'regions',
  'note',
] as const;

/** Quote a field per RFC 4180 when it contains a comma, quote or line break. */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export interface CsvOptions {
  /** Prepend a UTF-8 byte order mark so Excel shows Bangla text correctly. Default `false`. */
  bom?: boolean;
}

/** Render holidays as CSV with a header row and CRLF line endings. */
export function toCSV(holidays: readonly Holiday[], options: CsvOptions = {}): string {
  const rows = [CSV_COLUMNS.join(',')];
  for (const h of holidays) {
    rows.push(
      [
        h.date,
        h.weekday,
        h.id,
        h.name,
        h.nameBn,
        h.type,
        h.religion ?? '',
        String(h.moonDependent),
        String(h.tentative),
        (h.regions ?? []).join(';'),
        h.note ?? '',
      ]
        .map(csvField)
        .join(','),
    );
  }
  return (options.bom ? '﻿' : '') + rows.join('\r\n') + '\r\n';
}

/** Parse CSV produced by `toCSV` (or any RFC 4180 CSV) into rows of fields. */
export function parseCSV(text: string): string[][] {
  const src = text.startsWith('﻿') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
