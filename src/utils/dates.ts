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
