export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface Goal {
  id: string;
  name: string;
  quarter: Quarter;
  year: number;
  color: string;
  createdAt: string;
}

export interface HabitSystem {
  id: string;
  goalId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  systemId: string;
  name: string;
  reminderTime?: string;
  color: string;
  createdAt: string;
  /** Daily target quantity (e.g. 60 for 60 minutes). Defaults to 1 for boolean habits. */
  target: number;
  /** Unit label for the target value (e.g. "분", "페이지", "회"). */
  unit: string;
}

export interface DailyLog {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  /** Actual value achieved today (0 ≤ value ≤ target). Defaults to target when completed=true. */
  value?: number;
}

// ─── Computed / Derived Types ─────────────────────────────────────────────────

export interface HabitWithCompletion extends Habit {
  completion: number; // 0–100 for today
  todayValue: number;
}

export interface SystemWithCompletion extends HabitSystem {
  completion: number; // average of habits today
  habits: HabitWithCompletion[];
}

export interface GoalWithCompletion extends Goal {
  completion: number; // average of systems today
  systems: SystemWithCompletion[];
}

export interface HabitStore {
  goals: Goal[];
  systems: HabitSystem[];
  habits: Habit[];
  logs: DailyLog[];
}

export const GOAL_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

export const HABIT_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
];
