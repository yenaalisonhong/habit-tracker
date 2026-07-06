"use client";

import { useState, useEffect, useCallback } from "react";
import { HabitStore, Goal, HabitSystem, Habit, DailyLog } from "@/types";

const STORAGE_KEY = "habit-tracker-data";

const defaultStore: HabitStore = {
  goals: [],
  systems: [],
  habits: [],
  logs: [],
};

function loadStore(): HabitStore {
  if (typeof window === "undefined") return defaultStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore;
    return JSON.parse(raw) as HabitStore;
  } catch {
    return defaultStore;
  }
}

function saveStore(store: HabitStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useHabitStore() {
  const [store, setStore] = useState<HabitStore>(defaultStore);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setInitialized(true);
  }, []);

  const update = useCallback((updater: (prev: HabitStore) => HabitStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  // Goals
  const addGoal = useCallback(
    (goal: Goal) => update((s) => ({ ...s, goals: [...s.goals, goal] })),
    [update]
  );
  const updateGoal = useCallback(
    (goal: Goal) =>
      update((s) => ({
        ...s,
        goals: s.goals.map((g) => (g.id === goal.id ? goal : g)),
      })),
    [update]
  );
  const deleteGoal = useCallback(
    (goalId: string) =>
      update((s) => {
        const systemIds = s.systems
          .filter((sys) => sys.goalId === goalId)
          .map((sys) => sys.id);
        const habitIds = s.habits
          .filter((h) => systemIds.includes(h.systemId))
          .map((h) => h.id);
        return {
          ...s,
          goals: s.goals.filter((g) => g.id !== goalId),
          systems: s.systems.filter((sys) => sys.goalId !== goalId),
          habits: s.habits.filter((h) => !systemIds.includes(h.systemId)),
          logs: s.logs.filter((l) => !habitIds.includes(l.habitId)),
        };
      }),
    [update]
  );

  // Systems
  const addSystem = useCallback(
    (system: HabitSystem) =>
      update((s) => ({ ...s, systems: [...s.systems, system] })),
    [update]
  );
  const updateSystem = useCallback(
    (system: HabitSystem) =>
      update((s) => ({
        ...s,
        systems: s.systems.map((sys) => (sys.id === system.id ? system : sys)),
      })),
    [update]
  );
  const deleteSystem = useCallback(
    (systemId: string) =>
      update((s) => {
        const habitIds = s.habits
          .filter((h) => h.systemId === systemId)
          .map((h) => h.id);
        return {
          ...s,
          systems: s.systems.filter((sys) => sys.id !== systemId),
          habits: s.habits.filter((h) => h.systemId !== systemId),
          logs: s.logs.filter((l) => !habitIds.includes(l.habitId)),
        };
      }),
    [update]
  );

  // Habits
  const addHabit = useCallback(
    (habit: Habit) =>
      update((s) => ({ ...s, habits: [...s.habits, habit] })),
    [update]
  );
  const updateHabit = useCallback(
    (habit: Habit) =>
      update((s) => ({
        ...s,
        habits: s.habits.map((h) => (h.id === habit.id ? habit : h)),
      })),
    [update]
  );
  const deleteHabit = useCallback(
    (habitId: string) =>
      update((s) => ({
        ...s,
        habits: s.habits.filter((h) => h.id !== habitId),
        logs: s.logs.filter((l) => l.habitId !== habitId),
      })),
    [update]
  );

  // Logs
  const toggleLog = useCallback(
    (habitId: string, date: string) =>
      update((s) => {
        const habit = s.habits.find((h) => h.id === habitId);
        const target = habit?.target ?? 1;
        const existing = s.logs.find(
          (l) => l.habitId === habitId && l.date === date
        );
        if (existing) {
          const newCompleted = !existing.completed;
          return {
            ...s,
            logs: s.logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, completed: newCompleted, value: newCompleted ? target : 0 }
                : l
            ),
          };
        }
        return {
          ...s,
          logs: [...s.logs, { habitId, date, completed: true, value: target }],
        };
      }),
    [update]
  );

  /**
   * Cycle through 4 intensity stages: 0% → ~30% → ~60% → 100% → 0%
   * Suitable for all habit types; maps percentages to concrete values.
   */
  const cycleStageLog = useCallback(
    (habitId: string, date: string) =>
      update((s) => {
        const habit = s.habits.find((h) => h.id === habitId);
        if (!habit) return s;
        const target = habit.target ?? 1;

        const existing = s.logs.find(
          (l) => l.habitId === habitId && l.date === date
        );
        const currentValue = existing?.value ?? 0;
        const completion = Math.min(
          Math.round((currentValue / target) * 100),
          100
        );

        // Stage cycle: none → low(30%) → medium(60%) → high(100%) → none
        let nextValue: number;
        if (completion === 0) {
          nextValue =
            target <= 1
              ? target * 0.3
              : Math.max(1, Math.round(target * 0.3));
        } else if (completion < 40) {
          nextValue =
            target <= 1 ? target * 0.6 : Math.round(target * 0.6);
        } else if (completion < 80) {
          nextValue = target;
        } else {
          nextValue = 0;
        }

        const newCompleted = nextValue >= target;

        if (existing) {
          return {
            ...s,
            logs: s.logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, value: nextValue, completed: newCompleted }
                : l
            ),
          };
        }
        if (nextValue === 0) return s;
        return {
          ...s,
          logs: [
            ...s.logs,
            { habitId, date, value: nextValue, completed: newCompleted },
          ],
        };
      }),
    [update]
  );

  /** Set a specific numeric value for a log (for quantitative habits). */
  const setLogValue = useCallback(
    (habitId: string, date: string, value: number) =>
      update((s) => {
        const habit = s.habits.find((h) => h.id === habitId);
        const target = habit?.target ?? 1;
        const completed = value >= target;
        const existing = s.logs.find(
          (l) => l.habitId === habitId && l.date === date
        );
        if (existing) {
          return {
            ...s,
            logs: s.logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, value, completed }
                : l
            ),
          };
        }
        return {
          ...s,
          logs: [...s.logs, { habitId, date, value, completed }],
        };
      }),
    [update]
  );

  const getLog = useCallback(
    (habitId: string, date: string): boolean => {
      const log = store.logs.find(
        (l) => l.habitId === habitId && l.date === date
      );
      return log?.completed ?? false;
    },
    [store.logs]
  );

  const getLogValue = useCallback(
    (habitId: string, date: string): number => {
      const log = store.logs.find(
        (l) => l.habitId === habitId && l.date === date
      );
      if (!log) return 0;
      // If value field exists, use it; otherwise derive from completed boolean
      if (log.value !== undefined) return log.value;
      const habit = store.habits.find((h) => h.id === habitId);
      return log.completed ? (habit?.target ?? 1) : 0;
    },
    [store.logs, store.habits]
  );

  /**
   * Habit completion for a single date: min(value / target * 100, 100).
   * Falls back to 100 if completed=true with no value set.
   */
  const getHabitCompletion = useCallback(
    (habitId: string, date: string): number => {
      const habit = store.habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      const target = habit.target ?? 1;
      const value = getLogValue(habitId, date);
      return Math.min(Math.round((value / target) * 100), 100);
    },
    [store.habits, getLogValue]
  );

  /**
   * System completion for a date: average of all its habits' completions.
   */
  const getSystemCompletion = useCallback(
    (systemId: string, date: string): number => {
      const sysHabits = store.habits.filter((h) => h.systemId === systemId);
      if (sysHabits.length === 0) return 0;
      const total = sysHabits.reduce(
        (sum, h) => sum + getHabitCompletion(h.id, date),
        0
      );
      return Math.round(total / sysHabits.length);
    },
    [store.habits, getHabitCompletion]
  );

  /**
   * Goal completion for a date: average of all its systems' completions.
   */
  const getGoalCompletion = useCallback(
    (goalId: string, date: string): number => {
      const goalSystems = store.systems.filter((s) => s.goalId === goalId);
      if (goalSystems.length === 0) return 0;
      const total = goalSystems.reduce(
        (sum, s) => sum + getSystemCompletion(s.id, date),
        0
      );
      return Math.round(total / goalSystems.length);
    },
    [store.systems, getSystemCompletion]
  );

  const getCompletionRate = useCallback(
    (habitId: string, dates: string[]): number => {
      if (dates.length === 0) return 0;
      const completed = dates.filter((d) => getLog(habitId, d)).length;
      return Math.round((completed / dates.length) * 100);
    },
    [getLog]
  );

  return {
    ...store,
    initialized,
    addGoal,
    updateGoal,
    deleteGoal,
    addSystem,
    updateSystem,
    deleteSystem,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleLog,
    cycleStageLog,
    setLogValue,
    getLog,
    getLogValue,
    getHabitCompletion,
    getSystemCompletion,
    getGoalCompletion,
    getCompletionRate,
  };
}
