import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { Quarter } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse yyyy-MM-dd as local midnight (avoids UTC offset bugs). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthDates(year: number, month: number): string[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map(formatDate);
}

export function getWeekDates(date: Date): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(formatDate);
}

export function getQuarterDates(quarter: Quarter, year: number): string[] {
  const quarterMap: Record<Quarter, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 };
  const start = startOfQuarter(new Date(year, quarterMap[quarter]));
  const end = endOfQuarter(start);
  return eachDayOfInterval({ start, end }).map(formatDate);
}

export function getYearDates(year: number): string[] {
  const start = startOfYear(new Date(year, 0));
  const end = endOfYear(start);
  return eachDayOfInterval({ start, end }).map(formatDate);
}

export function getWeeklyBuckets(
  dates: string[]
): { label: string; dates: string[] }[] {
  if (dates.length === 0) return [];
  const startD = parseLocalDate(dates[0]);
  const endD = parseLocalDate(dates[dates.length - 1]);
  const weeks = eachWeekOfInterval(
    { start: startD, end: endD },
    { weekStartsOn: 1 }
  );
  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekDates = eachDayOfInterval({
      start: weekStart,
      end: weekEnd,
    })
      .map(formatDate)
      .filter((d) => dates.includes(d));
    return {
      label: format(weekStart, "MM/dd"),
      dates: weekDates,
    };
  });
}

export function getMonthlyBuckets(
  dates: string[]
): { label: string; dates: string[] }[] {
  if (dates.length === 0) return [];
  const startD = parseLocalDate(dates[0]);
  const endD = parseLocalDate(dates[dates.length - 1]);
  const months = eachMonthOfInterval({ start: startD, end: endD });
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const monthDates = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    })
      .map(formatDate)
      .filter((d) => dates.includes(d));
    return {
      label: format(monthStart, "yyyy/MM"),
      dates: monthDates,
    };
  });
}

export function getCompletionColor(rate: number, baseColor: string): string {
  if (rate === 0) return "transparent";
  const opacity = 0.15 + (rate / 100) * 0.85;
  return `${baseColor}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

export function getGreenShade(rate: number): string {
  if (rate === 0) return "hsl(0,0%,15%)";
  if (rate < 25) return "hsl(120,60%,20%)";
  if (rate < 50) return "hsl(120,60%,30%)";
  if (rate < 75) return "hsl(120,60%,40%)";
  return "hsl(120,60%,50%)";
}
