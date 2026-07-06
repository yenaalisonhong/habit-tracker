import { toDateStr, parseLocalDate } from './dates';

export type DateBucket = { label: string; dates: string[] };

function eachDayInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeekSunday(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

function subWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function subYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
}

export function getLastNWeekBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const weekStart = startOfWeekMonday(subWeeks(today, count - 1 - i));
    const weekEnd = endOfWeekSunday(weekStart);
    return {
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      dates: eachDayInRange(weekStart, weekEnd),
    };
  });
}

export function getLastNMonthBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const monthStart = startOfMonth(subMonths(today, count - 1 - i));
    const monthEnd = endOfMonth(monthStart);
    return {
      label: `${monthStart.getFullYear()}/${monthStart.getMonth() + 1}`,
      dates: eachDayInRange(monthStart, monthEnd),
    };
  });
}

export function getLastNYearBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const yearStart = startOfYear(subYears(today, count - 1 - i));
    const yearEnd = endOfYear(yearStart);
    return {
      label: String(yearStart.getFullYear()),
      dates: eachDayInRange(yearStart, yearEnd),
    };
  });
}

export function bucketCompletion(
  dates: string[],
  getCompletion: (date: string) => number
): number {
  if (dates.length === 0) return 0;
  const sum = dates.reduce((acc, date) => acc + getCompletion(date), 0);
  return Math.round(sum / dates.length);
}
