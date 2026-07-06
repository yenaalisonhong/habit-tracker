// ─── Core Domain Models ──────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  createdAt: string;
}

export interface System {
  id: string;
  goalId: string;
  title: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  systemId: string;
  title: string;
  unit: string;      // e.g. "minutes", "pages", "times"
  target: number;    // Daily target value (e.g. 60 for 60 mins)
  createdAt: string;
}

export type FrictionType =
  | "Overtime"
  | "Fatigue"
  | "Sudden Appointment"
  | "Lack of Will"
  | "Other";

export interface DailyLog {
  id: string;
  habitId: string;
  date: string;           // "YYYY-MM-DD"
  value: number;          // 0 ≤ value ≤ habit.target
  friction?: FrictionType; // required when value === 0
}

/** 저장 공간 부족 시 이전 연도 일별 로그를 압축해 보존하는 연간 요약 */
export interface YearlyHabitSummary {
  habitId: string;
  year: number;
  totalValue: number;
  daysRecorded: number;
  daysMetTarget: number;
  frictionCounts: Partial<Record<FrictionType, number>>;
  targetAtArchive: number;
}

// ─── Computed / Derived Types ────────────────────────────────────────────────

export interface HabitWithCompletion extends Habit {
  todayLog: DailyLog | undefined;
  completion: number; // 0–100
}

export interface SystemWithCompletion extends System {
  habits: HabitWithCompletion[];
  completion: number; // 0–100, avg of habits
}

export interface GoalWithCompletion extends Goal {
  systems: SystemWithCompletion[];
  completion: number; // 0–100, avg of systems
}
