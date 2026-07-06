import {
  Goal,
  System,
  Habit,
  DailyLog,
  YearlyHabitSummary,
} from "@/lib/types";
import { buildYearlySummaries, getYearlyCompletion } from "@/lib/log-archive";
import { eachDayOfInterval, startOfYear, endOfYear } from "date-fns";
import { toDateStr } from "@/lib/utils";

export const YEAR_WRAPPED_KEY = (year: number) => `ht_year_wrapped_${year}`;

export const ACHIEVEMENT_THRESHOLD = 80;

export function isYearEndDay(dateStr: string): boolean {
  return dateStr.endsWith("-12-31");
}

export function getYearDates(year: number): string[] {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(start);
  return eachDayOfInterval({ start, end }).map(toDateStr);
}

function bucketCompletion(
  dates: string[],
  getCompletion: (date: string) => number
): number {
  if (dates.length === 0) return 0;
  const sum = dates.reduce((acc, date) => acc + getCompletion(date), 0);
  return Math.round(sum / dates.length);
}

function mergeHabitSummaries(
  fromLogs: YearlyHabitSummary[],
  fromArchive: YearlyHabitSummary[]
): YearlyHabitSummary[] {
  const map = new Map<string, YearlyHabitSummary>();
  for (const summary of fromArchive) {
    map.set(summary.habitId, summary);
  }
  for (const summary of fromLogs) {
    map.set(summary.habitId, summary);
  }
  return Array.from(map.values());
}

export interface YearWrappedGoalStat {
  goal: Goal;
  completion: number;
  achieved: boolean;
}

export interface YearWrappedSystemStat {
  system: System;
  goalTitle: string;
  completion: number;
  achieved: boolean;
}

export interface YearWrappedHabitStat {
  habit: Habit;
  systemTitle: string;
  daysRecorded: number;
  daysMetTarget: number;
  totalValue: number;
  completion: number;
  achieved: boolean;
}

export interface YearWrappedStats {
  year: number;
  yearDates: string[];
  overallGoalCompletion: number;
  totalGoals: number;
  achievedGoals: number;
  totalSystems: number;
  achievedSystems: number;
  totalHabits: number;
  achievedHabits: number;
  totalDaysLogged: number;
  goals: YearWrappedGoalStat[];
  systems: YearWrappedSystemStat[];
  habits: YearWrappedHabitStat[];
  bestGoal: YearWrappedGoalStat | null;
  bestHabit: YearWrappedHabitStat | null;
}

export function computeYearWrappedStats(
  year: number,
  goals: Goal[],
  systems: System[],
  habits: Habit[],
  logs: DailyLog[],
  yearlySummaries: YearlyHabitSummary[],
  getGoalCompletion: (goalId: string, date: string) => number,
  getSystemCompletion: (systemId: string, date: string) => number
): YearWrappedStats {
  const yearDates = getYearDates(year);
  const yearGoals = goals.filter((g) => g.year === year);
  const yearGoalIds = new Set(yearGoals.map((g) => g.id));
  const yearSystems = systems.filter((s) => yearGoalIds.has(s.goalId));
  const yearSystemIds = new Set(yearSystems.map((s) => s.id));
  const yearHabits = habits.filter((h) => yearSystemIds.has(h.systemId));

  const goalStats: YearWrappedGoalStat[] = yearGoals.map((goal) => {
    const completion = bucketCompletion(yearDates, (date) =>
      getGoalCompletion(goal.id, date)
    );
    return {
      goal,
      completion,
      achieved: completion >= ACHIEVEMENT_THRESHOLD,
    };
  });

  const systemStats: YearWrappedSystemStat[] = yearSystems.map((system) => {
    const goal = yearGoals.find((g) => g.id === system.goalId);
    const completion = bucketCompletion(yearDates, (date) =>
      getSystemCompletion(system.id, date)
    );
    return {
      system,
      goalTitle: goal?.title ?? "",
      completion,
      achieved: completion >= ACHIEVEMENT_THRESHOLD,
    };
  });

  const habitSummaries = mergeHabitSummaries(
    buildYearlySummaries(logs, habits, year),
    yearlySummaries.filter((s) => s.year === year)
  );

  const habitStats: YearWrappedHabitStat[] = yearHabits.map((habit) => {
    const summary = habitSummaries.find((s) => s.habitId === habit.id);
    const system = yearSystems.find((s) => s.id === habit.systemId);
    const daysRecorded = summary?.daysRecorded ?? 0;
    const daysMetTarget = summary?.daysMetTarget ?? 0;
    const totalValue = summary?.totalValue ?? 0;
    const completion = summary ? getYearlyCompletion(summary) : 0;
    return {
      habit,
      systemTitle: system?.title ?? "",
      daysRecorded,
      daysMetTarget,
      totalValue,
      completion,
      achieved: completion >= ACHIEVEMENT_THRESHOLD,
    };
  });

  const achievedGoals = goalStats.filter((g) => g.achieved).length;
  const achievedSystems = systemStats.filter((s) => s.achieved).length;
  const achievedHabits = habitStats.filter((h) => h.achieved).length;
  const totalDaysLogged = habitStats.reduce((sum, h) => sum + h.daysRecorded, 0);

  const overallGoalCompletion =
    goalStats.length === 0
      ? 0
      : Math.round(
          goalStats.reduce((sum, g) => sum + g.completion, 0) / goalStats.length
        );

  const bestGoal =
    goalStats.length === 0
      ? null
      : goalStats.reduce((best, current) =>
          current.completion > best.completion ? current : best
        );

  const loggedHabits = habitStats.filter((h) => h.daysRecorded > 0);
  const bestHabit =
    loggedHabits.length === 0
      ? null
      : loggedHabits.reduce((best, current) =>
          current.completion > best.completion ? current : best
        );

  return {
    year,
    yearDates,
    overallGoalCompletion,
    totalGoals: goalStats.length,
    achievedGoals,
    totalSystems: systemStats.length,
    achievedSystems,
    totalHabits: habitStats.length,
    achievedHabits,
    totalDaysLogged,
    goals: goalStats.sort((a, b) => b.completion - a.completion),
    systems: systemStats.sort((a, b) => b.completion - a.completion),
    habits: habitStats.sort((a, b) => b.completion - a.completion),
    bestGoal,
    bestHabit,
  };
}
