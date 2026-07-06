import { DailyLog, FrictionType, Habit, YearlyHabitSummary } from "@/lib/types";
import { currentYear, habitCompletion } from "@/lib/utils";

function yearFromDate(date: string): number {
  return Number(date.slice(0, 4));
}

function mergeSummaries(
  existing: YearlyHabitSummary[],
  incoming: YearlyHabitSummary[]
): YearlyHabitSummary[] {
  const map = new Map<string, YearlyHabitSummary>();
  for (const summary of existing) {
    map.set(`${summary.habitId}:${summary.year}`, summary);
  }
  for (const summary of incoming) {
    const key = `${summary.habitId}:${summary.year}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, summary);
      continue;
    }
    const frictionCounts = { ...prev.frictionCounts };
    for (const [type, count] of Object.entries(summary.frictionCounts)) {
      const friction = type as FrictionType;
      frictionCounts[friction] = (frictionCounts[friction] ?? 0) + (count ?? 0);
    }
    map.set(key, {
      ...prev,
      totalValue: prev.totalValue + summary.totalValue,
      daysRecorded: prev.daysRecorded + summary.daysRecorded,
      daysMetTarget: prev.daysMetTarget + summary.daysMetTarget,
      frictionCounts,
    });
  }
  return Array.from(map.values());
}

export function buildYearlySummaries(
  logs: DailyLog[],
  habits: Habit[],
  year: number
): YearlyHabitSummary[] {
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]));
  const grouped = new Map<string, DailyLog[]>();

  for (const log of logs) {
    if (yearFromDate(log.date) !== year) continue;
    const key = log.habitId;
    const bucket = grouped.get(key) ?? [];
    bucket.push(log);
    grouped.set(key, bucket);
  }

  const summaries: YearlyHabitSummary[] = [];
  for (const [habitId, yearLogs] of Array.from(grouped.entries())) {
    const habit = habitMap.get(habitId);
    if (!habit) continue;

    const frictionCounts: Partial<Record<FrictionType, number>> = {};
    let totalValue = 0;
    let daysMetTarget = 0;

    for (const log of yearLogs) {
      totalValue += log.value;
      if (habitCompletion(log.value, habit.target) >= 100) {
        daysMetTarget += 1;
      }
      if (log.friction) {
        const friction = log.friction;
        frictionCounts[friction] = (frictionCounts[friction] ?? 0) + 1;
      }
    }

    summaries.push({
      habitId,
      year,
      totalValue,
      daysRecorded: yearLogs.length,
      daysMetTarget,
      frictionCounts,
      targetAtArchive: habit.target,
    });
  }

  return summaries;
}

/** 완료된 연도의 일별 로그를 연간 요약으로 압축합니다. 현재 연도는 항상 일별로 유지합니다. */
export function archiveCompletedYears(
  logs: DailyLog[],
  habits: Habit[],
  existingSummaries: YearlyHabitSummary[],
  keepFromYear: number = currentYear()
): { logs: DailyLog[]; summaries: YearlyHabitSummary[] } {
  const yearsToArchive = new Set<number>();
  for (const log of logs) {
    const year = yearFromDate(log.date);
    if (year < keepFromYear) yearsToArchive.add(year);
  }

  if (yearsToArchive.size === 0) {
    return { logs, summaries: existingSummaries };
  }

  let summaries = [...existingSummaries];
  for (const year of Array.from(yearsToArchive)) {
    const yearLogs = logs.filter((log) => yearFromDate(log.date) === year);
    summaries = mergeSummaries(summaries, buildYearlySummaries(yearLogs, habits, year));
  }

  const remainingLogs = logs.filter((log) => yearFromDate(log.date) >= keepFromYear);
  return { logs: remainingLogs, summaries };
}

export function getFrictionCountsFromSummaries(
  summaries: YearlyHabitSummary[]
): Partial<Record<FrictionType, number>> {
  const counts: Partial<Record<FrictionType, number>> = {};
  for (const summary of summaries) {
    for (const [type, count] of Object.entries(summary.frictionCounts)) {
      const friction = type as FrictionType;
      counts[friction] = (counts[friction] ?? 0) + (count ?? 0);
    }
  }
  return counts;
}

export function getYearlyCompletion(summary: YearlyHabitSummary): number {
  if (summary.daysRecorded === 0) return 0;
  return Math.round((summary.daysMetTarget / summary.daysRecorded) * 100);
}
