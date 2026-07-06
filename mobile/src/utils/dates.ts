/** Earliest date the app records or displays habit logs (fresh start). */
export const TRACKING_START_DATE = '2026-07-06';

/** Format a Date as local yyyy-MM-dd (never use toISOString for calendar dates). */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse yyyy-MM-dd as local midnight. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function isRecordableDate(dateStr: string, asOf: string = today()): boolean {
  return dateStr >= TRACKING_START_DATE && dateStr <= asOf;
}

export function generateDateRange(days: number, end: Date = new Date()): string[] {
  return Array.from({ length: days }, (_, i) =>
    toDateStr(
      new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1 - i))
    )
  );
}

export function formatShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getDayLabel(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[parseLocalDate(dateStr).getDay()];
}

export function today(): string {
  return toDateStr(new Date());
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function currentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}
