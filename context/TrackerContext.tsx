"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Goal,
  System,
  Habit,
  DailyLog,
  YearlyHabitSummary,
  GoalWithCompletion,
  SystemWithCompletion,
  HabitWithCompletion,
} from "@/lib/types";
import {
  generateId,
  today,
  habitCompletion,
  average,
} from "@/lib/utils";
import { KEYS, clearAllTrackerData, loadJson, persistTrackerData } from "@/lib/storage";

// ─── Context Shape ─────────────────────────────────────────────────────────────

interface TrackerContextValue {
  goals: Goal[];
  systems: System[];
  habits: Habit[];
  logs: DailyLog[];
  yearlySummaries: YearlyHabitSummary[];
  storageQuotaExceeded: boolean;

  // CRUD
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;

  addSystem: (s: Omit<System, "id" | "createdAt">) => void;
  updateSystem: (id: string, patch: Partial<Omit<System, "id">>) => void;
  deleteSystem: (id: string) => void;

  addHabit: (h: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id">>) => void;
  deleteHabit: (id: string) => void;

  upsertLog: (log: Omit<DailyLog, "id">) => void;

  // Selectors
  getSystemsByGoal: (goalId: string) => System[];
  getHabitsBySystem: (systemId: string) => Habit[];
  getLogByHabitDate: (habitId: string, date: string) => DailyLog | undefined;
  getHabitCompletion: (habitId: string, date: string) => number;
  getSystemCompletion: (systemId: string, date: string) => number;
  getGoalCompletion: (goalId: string, date: string) => number;

  // Derived enriched trees (for current day)
  goalsWithCompletion: GoalWithCompletion[];
  todayDate: string;

  resetAllData: () => void;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used within TrackerProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const todayDate = today();
  const isApplyingArchive = useRef(false);

  const [goals, setGoals] = useState<Goal[]>(() => loadJson(KEYS.goals, []));
  const [systems, setSystems] = useState<System[]>(() => loadJson(KEYS.systems, []));
  const [habits, setHabits] = useState<Habit[]>(() => loadJson(KEYS.habits, []));
  const [logs, setLogs] = useState<DailyLog[]>(() => loadJson(KEYS.logs, []));
  const [yearlySummaries, setYearlySummaries] = useState<YearlyHabitSummary[]>(() =>
    loadJson(KEYS.yearlySummaries, [])
  );
  const [storageQuotaExceeded, setStorageQuotaExceeded] = useState(false);

  // Persist on every change — 일별 로그는 기본적으로 전부 보관, 용량 초과 시 이전 연도만 연간 요약으로 압축
  useEffect(() => {
    if (isApplyingArchive.current) {
      isApplyingArchive.current = false;
      return;
    }

    const result = persistTrackerData({
      goals,
      systems,
      habits,
      logs,
      yearlySummaries,
    });

    setStorageQuotaExceeded(result.quotaExceeded);

    if (result.archived) {
      isApplyingArchive.current = true;
      setLogs(result.logs);
      setYearlySummaries(result.yearlySummaries);
    }
  }, [goals, systems, habits, logs, yearlySummaries]);

  const removeHabitsAndLogs = useCallback((habitIds: string[]) => {
    if (habitIds.length === 0) return;
    const idSet = new Set(habitIds);
    setHabits((prev) => prev.filter((h) => !idSet.has(h.id)));
    setLogs((prev) => prev.filter((l) => !idSet.has(l.habitId)));
    setYearlySummaries((prev) => prev.filter((s) => !idSet.has(s.habitId)));
  }, []);

  // ── Goal CRUD ──────────────────────────────────────────────────────────────
  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt">) => {
    setGoals((prev) => [
      ...prev,
      { ...g, id: generateId(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, "id">>) => {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
      );
    },
    []
  );

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSystems((prevSystems) => {
      const systemIds = prevSystems
        .filter((s) => s.goalId === id)
        .map((s) => s.id);
      setHabits((prevHabits) => {
        const habitIds = prevHabits
          .filter((h) => systemIds.includes(h.systemId))
          .map((h) => h.id);
        const habitIdSet = new Set(habitIds);
        setLogs((prevLogs) => prevLogs.filter((l) => !habitIdSet.has(l.habitId)));
        setYearlySummaries((prev) =>
          prev.filter((s) => !habitIdSet.has(s.habitId))
        );
        return prevHabits.filter((h) => !systemIds.includes(h.systemId));
      });
      return prevSystems.filter((s) => s.goalId !== id);
    });
  }, []);

  // ── System CRUD ────────────────────────────────────────────────────────────
  const addSystem = useCallback((s: Omit<System, "id" | "createdAt">) => {
    setSystems((prev) => [
      ...prev,
      { ...s, id: generateId(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateSystem = useCallback(
    (id: string, patch: Partial<Omit<System, "id">>) => {
      setSystems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const deleteSystem = useCallback((id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
    setHabits((prevHabits) => {
      const habitIds = prevHabits.filter((h) => h.systemId === id).map((h) => h.id);
      const habitIdSet = new Set(habitIds);
      setLogs((prevLogs) => prevLogs.filter((l) => !habitIdSet.has(l.habitId)));
      setYearlySummaries((prev) =>
        prev.filter((s) => !habitIdSet.has(s.habitId))
      );
      return prevHabits.filter((h) => h.systemId !== id);
    });
  }, []);

  // ── Habit CRUD ─────────────────────────────────────────────────────────────
  const addHabit = useCallback((h: Omit<Habit, "id" | "createdAt">) => {
    setHabits((prev) => [
      ...prev,
      { ...h, id: generateId(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateHabit = useCallback(
    (id: string, patch: Partial<Omit<Habit, "id">>) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h))
      );
    },
    []
  );

  const deleteHabit = useCallback(
    (id: string) => {
      removeHabitsAndLogs([id]);
    },
    [removeHabitsAndLogs]
  );

  // ── Log CRUD ───────────────────────────────────────────────────────────────
  const upsertLog = useCallback((log: Omit<DailyLog, "id">) => {
    setLogs((prev) => {
      const existing = prev.find(
        (l) => l.habitId === log.habitId && l.date === log.date
      );
      if (existing) {
        return prev.map((l) =>
          l.id === existing.id ? { ...l, ...log } : l
        );
      }
      return [...prev, { ...log, id: generateId() }];
    });
  }, []);

  // ── Selectors ──────────────────────────────────────────────────────────────
  const getSystemsByGoal = useCallback(
    (goalId: string) => systems.filter((s) => s.goalId === goalId),
    [systems]
  );

  const getHabitsBySystem = useCallback(
    (systemId: string) => habits.filter((h) => h.systemId === systemId),
    [habits]
  );

  const getLogByHabitDate = useCallback(
    (habitId: string, date: string) =>
      logs.find((l) => l.habitId === habitId && l.date === date),
    [logs]
  );

  const getHabitCompletion = useCallback(
    (habitId: string, date: string): number => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      const log = logs.find((l) => l.habitId === habitId && l.date === date);
      if (log) return habitCompletion(log.value, habit.target);

      const year = Number(date.slice(0, 4));
      const summary = yearlySummaries.find(
        (s) => s.habitId === habitId && s.year === year
      );
      if (!summary) return 0;
      return summary.daysRecorded === 0
        ? 0
        : Math.round((summary.daysMetTarget / summary.daysRecorded) * 100);
    },
    [habits, logs, yearlySummaries]
  );

  const getSystemCompletion = useCallback(
    (systemId: string, date: string): number => {
      const sysHabits = habits.filter((h) => h.systemId === systemId);
      if (sysHabits.length === 0) return 0;
      return average(
        sysHabits.map((h) => getHabitCompletion(h.id, date))
      );
    },
    [habits, getHabitCompletion]
  );

  const getGoalCompletion = useCallback(
    (goalId: string, date: string): number => {
      const goalSystems = systems.filter((s) => s.goalId === goalId);
      if (goalSystems.length === 0) return 0;
      return average(
        goalSystems.map((s) => getSystemCompletion(s.id, date))
      );
    },
    [systems, getSystemCompletion]
  );

  // ── Enriched Tree (memoized, recomputes when logs/habits/systems/goals change)
  const goalsWithCompletion: GoalWithCompletion[] = useMemo(() => {
    return goals.map((goal) => {
      const goalSystems = systems.filter((s) => s.goalId === goal.id);
      const enrichedSystems: SystemWithCompletion[] = goalSystems.map((sys) => {
        const sysHabits = habits.filter((h) => h.systemId === sys.id);
        const enrichedHabits: HabitWithCompletion[] = sysHabits.map((habit) => {
          const todayLog = logs.find(
            (l) => l.habitId === habit.id && l.date === todayDate
          );
          const completion = habitCompletion(
            todayLog?.value ?? 0,
            habit.target
          );
          return { ...habit, todayLog, completion };
        });
        const completion = average(enrichedHabits.map((h) => h.completion));
        return { ...sys, habits: enrichedHabits, completion };
      });
      const completion = average(enrichedSystems.map((s) => s.completion));
      return { ...goal, systems: enrichedSystems, completion };
    });
  }, [goals, systems, habits, logs, todayDate]);

  const resetAllData = useCallback(() => {
    setGoals([]);
    setSystems([]);
    setHabits([]);
    setLogs([]);
    setYearlySummaries([]);
    setStorageQuotaExceeded(false);
    clearAllTrackerData();
  }, []);

  const value: TrackerContextValue = {
    goals,
    systems,
    habits,
    logs,
    yearlySummaries,
    storageQuotaExceeded,
    addGoal,
    updateGoal,
    deleteGoal,
    addSystem,
    updateSystem,
    deleteSystem,
    addHabit,
    updateHabit,
    deleteHabit,
    upsertLog,
    getSystemsByGoal,
    getHabitsBySystem,
    getLogByHabitDate,
    getHabitCompletion,
    getSystemCompletion,
    getGoalCompletion,
    goalsWithCompletion,
    todayDate,
    resetAllData,
  };

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}
