import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Goal,
  System,
  Habit,
  DailyLog,
  FrictionType,
  TrackerData,
  YearlyHabitSummary,
  GoalWithCompletion,
  SystemWithCompletion,
  HabitWithCompletion,
} from '../types';
import { toDateStr, parseLocalDate, today, currentYear, TRACKING_START_DATE, isRecordableDate } from '../utils/dates';
import { habitCompletion, average } from '../utils/completion';
import { archiveCompletedYears } from '../utils/log-archive';

const STORAGE_KEY = 'ht_tracker_data';

interface TrackerContextValue {
  goals: Goal[];
  systems: System[];
  habits: Habit[];
  logs: DailyLog[];
  yearlySummaries: YearlyHabitSummary[];
  hydrated: boolean;
  todayDate: string;
  goalsWithCompletion: GoalWithCompletion[];

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  addSystem: (system: Omit<System, 'id' | 'createdAt'>) => void;
  updateSystem: (id: string, patch: Partial<Omit<System, 'id'>>) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id'>>) => void;
  upsertLog: (log: Omit<DailyLog, 'id'>) => void;
  updateFriction: (habitId: string, date: string, friction: FrictionType) => void;
  deleteGoal: (id: string) => void;
  deleteSystem: (id: string) => void;
  deleteHabit: (id: string) => void;

  getSystemsByGoal: (goalId: string) => System[];
  getHabitsBySystem: (systemId: string) => Habit[];
  getLogByHabitAndDate: (habitId: string, date: string) => DailyLog | undefined;
  getHabitCompletion: (habitId: string, date: string) => number;
  getSystemCompletion: (systemId: string, date: string) => number;
  getGoalCompletion: (goalId: string, date: string) => number;
  getGoalProgress: (goalId: string, dateRange: { from: string; to: string }) => number;
  getQuarterFrictionStats: (quarter: string, year: number) => Record<FrictionType, number>;
  resetAllData: () => void;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cleanSummariesForHabits(
  summaries: YearlyHabitSummary[],
  habitIds: string[]
): YearlyHabitSummary[] {
  if (habitIds.length === 0) return summaries;
  const idSet = new Set(habitIds);
  return summaries.filter((s) => !idSet.has(s.habitId));
}

function findLogForHabitDate(
  logs: DailyLog[],
  habitId: string,
  date: string
): DailyLog | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === date);
}

function findLogIndexForHabitDate(
  logs: DailyLog[],
  habitId: string,
  date: string
): number {
  return logs.findIndex((l) => l.habitId === habitId && l.date === date);
}

function filterTrackableLogs(logs: DailyLog[]): DailyLog[] {
  return logs.filter((l) => l.date >= TRACKING_START_DATE);
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const todayDate = today();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<YearlyHabitSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: TrackerData = JSON.parse(raw);
          setGoals(data.goals ?? []);
          setSystems(data.systems ?? []);
          setHabits(data.habits ?? []);
          setLogs(filterTrackableLogs(data.logs ?? []));
          setYearlySummaries(data.yearlySummaries ?? []);
        }
      } catch {
        // ignore corrupt storage
      }

      setHydrated(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const archived = archiveCompletedYears(logs, habits, yearlySummaries, currentYear());
      const data: TrackerData = {
        goals,
        systems,
        habits,
        logs: archived.logs,
        yearlySummaries: archived.summaries,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
      if (
        archived.logs.length !== logs.length ||
        archived.summaries.length !== yearlySummaries.length
      ) {
        setLogs(archived.logs);
        setYearlySummaries(archived.summaries);
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [goals, systems, habits, logs, yearlySummaries, hydrated]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals((prev) => [...prev, { ...goal, id: generateId(), createdAt: toDateStr(new Date()) }]);
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, 'id'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const addSystem = useCallback((system: Omit<System, 'id' | 'createdAt'>) => {
    setSystems((prev) => [...prev, { ...system, id: generateId(), createdAt: toDateStr(new Date()) }]);
  }, []);

  const updateSystem = useCallback((id: string, patch: Partial<Omit<System, 'id'>>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    setHabits((prev) => [...prev, { ...habit, id: generateId(), createdAt: toDateStr(new Date()) }]);
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Omit<Habit, 'id'>>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);

  const upsertLog = useCallback((log: Omit<DailyLog, 'id'>) => {
    if (!isRecordableDate(log.date, todayDate)) return;
    setLogs((prev) => {
      const existing = findLogIndexForHabitDate(prev, log.habitId, log.date);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...log, date: log.date };
        return updated;
      }
      return [...prev, { ...log, id: generateId() }];
    });
  }, [todayDate]);

  const updateFriction = useCallback((habitId: string, date: string, friction: FrictionType) => {
    if (!isRecordableDate(date, todayDate)) return;
    setLogs((prev) => {
      const existing = findLogIndexForHabitDate(prev, habitId, date);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], friction, date };
        return updated;
      }
      return [...prev, { id: generateId(), habitId, date, value: 0, friction }];
    });
  }, [todayDate]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSystems((prev) => {
      const toDelete = prev.filter((s) => s.goalId === id).map((s) => s.id);
      setHabits((ph) => {
        const habitIds = ph.filter((h) => toDelete.includes(h.systemId)).map((h) => h.id);
        setLogs((pl) => pl.filter((l) => !habitIds.includes(l.habitId)));
        setYearlySummaries((ps) => cleanSummariesForHabits(ps, habitIds));
        return ph.filter((h) => !toDelete.includes(h.systemId));
      });
      return prev.filter((s) => s.goalId !== id);
    });
  }, []);

  const deleteSystem = useCallback((id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
    setHabits((prev) => {
      const habitIds = prev.filter((h) => h.systemId === id).map((h) => h.id);
      setLogs((pl) => pl.filter((l) => !habitIds.includes(l.habitId)));
      setYearlySummaries((ps) => cleanSummariesForHabits(ps, habitIds));
      return prev.filter((h) => h.systemId !== id);
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
    setYearlySummaries((prev) => cleanSummariesForHabits(prev, [id]));
  }, []);

  const getSystemsByGoal = useCallback((goalId: string) => systems.filter((s) => s.goalId === goalId), [systems]);
  const getHabitsBySystem = useCallback((systemId: string) => habits.filter((h) => h.systemId === systemId), [habits]);

  const getLogByHabitAndDate = useCallback(
    (habitId: string, date: string) => findLogForHabitDate(logs, habitId, date),
    [logs]
  );

  const getHabitCompletion = useCallback(
    (habitId: string, date: string): number => {
      if (date < TRACKING_START_DATE) return 0;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      const log = findLogForHabitDate(logs, habitId, date);
      if (log) return habitCompletion(log.value, habit.target);

      const year = Number(date.slice(0, 4));
      if (year >= currentYear()) return 0;

      const summary = yearlySummaries.find((s) => s.habitId === habitId && s.year === year);
      if (!summary) return 0;
      return summary.daysRecorded === 0
        ? 0
        : Math.round((summary.daysMetTarget / summary.daysRecorded) * 100);
    },
    [habits, logs, yearlySummaries]
  );

  const getSystemCompletion = useCallback(
    (systemId: string, date: string): number => {
      const systemHabits = habits.filter((h) => h.systemId === systemId);
      if (systemHabits.length === 0) return 0;
      return average(systemHabits.map((h) => getHabitCompletion(h.id, date)));
    },
    [habits, getHabitCompletion]
  );

  const getGoalCompletion = useCallback(
    (goalId: string, date: string): number => {
      const goalSystems = systems.filter((s) => s.goalId === goalId);
      if (goalSystems.length === 0) return 0;
      return average(goalSystems.map((s) => getSystemCompletion(s.id, date)));
    },
    [systems, getSystemCompletion]
  );

  const getGoalProgress = useCallback(
    (goalId: string, dateRange: { from: string; to: string }): number => {
      const goalSystems = systems.filter((s) => s.goalId === goalId);
      if (goalSystems.length === 0) return 0;

      const dates: string[] = [];
      const current = parseLocalDate(dateRange.from);
      const end = parseLocalDate(dateRange.to);
      while (current <= end) {
        const dateStr = toDateStr(current);
        if (dateStr >= TRACKING_START_DATE) {
          dates.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }
      if (dates.length === 0) return 0;

      const total = goalSystems.reduce((sSum, s) => {
        const dateAvg = dates.reduce((dSum, d) => dSum + getSystemCompletion(s.id, d), 0) / dates.length;
        return sSum + dateAvg;
      }, 0);
      return total / goalSystems.length;
    },
    [systems, getSystemCompletion]
  );

  const getQuarterFrictionStats = useCallback(
    (quarter: string, year: number): Record<FrictionType, number> => {
      const stats: Record<FrictionType, number> = {
        '야근': 0, '피로': 0, '갑작스런 약속': 0, '의지 부족': 0, '기타': 0,
      };
      const quarterMonths: Record<string, number[]> = {
        Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12],
      };
      const months = quarterMonths[quarter] ?? [];

      logs.forEach((log) => {
        if (log.date < TRACKING_START_DATE || !log.friction || log.value !== 0) return;
        const d = parseLocalDate(log.date);
        if (d.getFullYear() === year && months.includes(d.getMonth() + 1)) {
          stats[log.friction] = (stats[log.friction] ?? 0) + 1;
        }
      });
      return stats;
    },
    [logs]
  );

  const goalsWithCompletion: GoalWithCompletion[] = useMemo(() => {
    return goals.map((goal) => {
      const goalSystems = systems.filter((s) => s.goalId === goal.id);
      const enrichedSystems: SystemWithCompletion[] = goalSystems.map((sys) => {
        const sysHabits = habits.filter((h) => h.systemId === sys.id);
        const enrichedHabits: HabitWithCompletion[] = sysHabits.map((habit) => {
          const todayLog = findLogForHabitDate(logs, habit.id, todayDate);
          const completion = habitCompletion(todayLog?.value ?? 0, habit.target);
          return { ...habit, todayLog, completion };
        });
        const completion = average(enrichedHabits.map((h) => h.completion));
        return { ...sys, habits: enrichedHabits, completion };
      });
      const completion = average(enrichedSystems.map((s) => s.completion));
      return { ...goal, systems: enrichedSystems, completion };
    });
  }, [goals, systems, habits, logs, todayDate]);

  const resetAllData = useCallback(async () => {
    setGoals([]);
    setSystems([]);
    setHabits([]);
    setLogs([]);
    setYearlySummaries([]);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ goals: [], systems: [], habits: [], logs: [], yearlySummaries: [] })
    );
    try {
      const keys = await AsyncStorage.getAllKeys();
      const wrappedKeys = keys.filter((k) => k.startsWith('ht_year_wrapped_'));
      if (wrappedKeys.length > 0) {
        await AsyncStorage.multiRemove(wrappedKeys);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <TrackerContext.Provider
      value={{
        goals, systems, habits, logs, yearlySummaries, hydrated, todayDate, goalsWithCompletion,
        addGoal, updateGoal, addSystem, updateSystem, addHabit, updateHabit,
        upsertLog, updateFriction,
        deleteGoal, deleteSystem, deleteHabit,
        getSystemsByGoal, getHabitsBySystem, getLogByHabitAndDate,
        getHabitCompletion, getSystemCompletion, getGoalCompletion,
        getGoalProgress,
        getQuarterFrictionStats,
        resetAllData,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used within TrackerProvider');
  return ctx;
}
