import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function currentQuarter(): "Q1" | "Q2" | "Q3" | "Q4" {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function habitCompletion(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((value / target) * 100), 100);
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function completionColor(pct: number): string {
  if (pct === 0) return "text-pink-300";
  if (pct < 40) return "text-pink-300";
  if (pct < 80) return "text-pink-400";
  return "text-pink-500";
}

export function completionBg(pct: number): string {
  if (pct === 0) return "bg-pink-50 dark:bg-pink-950/30";
  if (pct < 40) return "bg-pink-200 dark:bg-pink-900/60";
  if (pct < 80) return "bg-pink-400 dark:bg-pink-500";
  return "bg-pink-500 dark:bg-pink-400";
}

export function toDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse yyyy-MM-dd as local midnight (avoids UTC offset bugs). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function generateDateRange(days: number, end: Date = new Date()): string[] {
  return Array.from({ length: days }, (_, i) =>
    toDateStr(
      new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1 - i))
    )
  );
}

export type DateBucket = { label: string; dates: string[] };

function daysInRange(start: Date, end: Date): string[] {
  return eachDayOfInterval({ start, end }).map(toDateStr);
}

export function getLastNWeekBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(today, count - 1 - i), {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return {
      label: format(weekStart, "M/d"),
      dates: daysInRange(weekStart, weekEnd),
    };
  });
}

export function getLastNMonthBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const monthStart = startOfMonth(subMonths(today, count - 1 - i));
    const monthEnd = endOfMonth(monthStart);
    return {
      label: format(monthStart, "yyyy/M"),
      dates: daysInRange(monthStart, monthEnd),
    };
  });
}

export function getLastNYearBuckets(count: number): DateBucket[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const yearStart = startOfYear(subYears(today, count - 1 - i));
    const yearEnd = endOfYear(yearStart);
    return {
      label: format(yearStart, "yyyy"),
      dates: daysInRange(yearStart, yearEnd),
    };
  });
}
