'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Goal, System, Habit, DailyLog, FrictionType } from '@/types';

interface TrackerContextValue {
  goals: Goal[];
  systems: System[];
  habits: Habit[];
  logs: DailyLog[];

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
  getGoalProgress: (goalId: string, dateRange: { from: string; to: string }) => number;
  getQuarterFrictionStats: (quarter: string, year: number) => Record<FrictionType, number>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEMO_DATA = {
  goals: [
    { id: 'g1', title: '건강한 생활 루틴 만들기', quarter: 'Q2' as const, year: 2026, createdAt: '2026-04-01' },
  ],
  systems: [
    { id: 's1', goalId: 'g1', title: '운동 시스템', createdAt: '2026-04-01' },
    { id: 's2', goalId: 'g1', title: '학습 시스템', createdAt: '2026-04-01' },
  ],
  habits: [
    { id: 'h1', systemId: 's1', title: '아침 조깅', unit: '분', target: 30, createdAt: '2026-04-01' },
    { id: 'h2', systemId: 's1', title: '스트레칭', unit: '분', target: 15, createdAt: '2026-04-01' },
    { id: 'h3', systemId: 's2', title: '독서', unit: '페이지', target: 20, createdAt: '2026-04-01' },
  ],
  logs: [] as DailyLog[],
};

function generateDemoLogs(): DailyLog[] {
  const logs: DailyLog[] = [];
  const habits = DEMO_DATA.habits;
  const frictions: FrictionType[] = ['야근', '피로', '갑작스런 약속', '의지 부족', '기타'];

  const today = new Date();
  for (let d = 60; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    habits.forEach((habit) => {
      const rand = Math.random();
      let value: number;
      let friction: FrictionType | undefined;

      if (rand < 0.15) {
        value = 0;
        friction = frictions[Math.floor(Math.random() * frictions.length)];
      } else if (rand < 0.35) {
        value = Math.floor(habit.target * 0.5);
      } else {
        value = habit.target;
      }

      logs.push({
        id: generateId(),
        habitId: habit.id,
        date: dateStr,
        value,
        friction,
      });
    });
  }
  return logs;
}

// localStorage에서 마이그레이션할 데이터가 있으면 반환하고, 키를 지운다
function migrateFromLocalStorage(): { goals: Goal[]; systems: System[]; habits: Habit[]; logs: DailyLog[] } | null {
  try {
    const storedGoals = localStorage.getItem('ht_goals');
    const storedSystems = localStorage.getItem('ht_systems');
    const storedHabits = localStorage.getItem('ht_habits');
    const storedLogs = localStorage.getItem('ht_logs');

    if (storedGoals && storedSystems && storedHabits) {
      const goals: Goal[] = JSON.parse(storedGoals);
      const systems: System[] = JSON.parse(storedSystems);
      const habits: Habit[] = JSON.parse(storedHabits);
      const logs: DailyLog[] = storedLogs ? JSON.parse(storedLogs) : [];

      // 데모 데이터가 아닌 실제 사용자 데이터인 경우에만 마이그레이션
      const isDemo =
        goals.length === 1 &&
        goals[0].id === 'g1' &&
        systems.every((s) => ['s1', 's2'].includes(s.id)) &&
        habits.every((h) => ['h1', 'h2', 'h3'].includes(h.id));

      if (!isDemo && goals.length > 0) {
        localStorage.removeItem('ht_goals');
        localStorage.removeItem('ht_systems');
        localStorage.removeItem('ht_habits');
        localStorage.removeItem('ht_logs');
        return { goals, systems, habits, logs };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 앱 시작 시 파일에서 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();

        if (data.goals && data.systems && data.habits) {
          setGoals(data.goals);
          setSystems(data.systems);
          setHabits(data.habits);
          setLogs(data.logs ?? []);
          setHydrated(true);
          return;
        }
      } catch {
        // 서버에 데이터 없음 - 아래로 계속
      }

      // 파일에 데이터가 없으면 localStorage 마이그레이션 시도
      const migrated = migrateFromLocalStorage();
      if (migrated) {
        setGoals(migrated.goals);
        setSystems(migrated.systems);
        setHabits(migrated.habits);
        setLogs(migrated.logs);
        setHydrated(true);
        // 마이그레이션된 데이터를 즉시 파일에 저장
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(migrated),
        });
        return;
      }

      // 데이터가 전혀 없으면 데모 데이터 사용
      const demoLogs = generateDemoLogs();
      setGoals(DEMO_DATA.goals);
      setSystems(DEMO_DATA.systems);
      setHabits(DEMO_DATA.habits);
      setLogs(demoLogs);
      setHydrated(true);
    }

    load();
  }, []);

  // 상태 변경 시 파일에 저장 (디바운스 500ms)
  useEffect(() => {
    if (!hydrated) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, systems, habits, logs }),
      }).catch(() => {});
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [goals, systems, habits, logs, hydrated]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals((prev) => [...prev, { ...goal, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, 'id'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const addSystem = useCallback((system: Omit<System, 'id' | 'createdAt'>) => {
    setSystems((prev) => [...prev, { ...system, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateSystem = useCallback((id: string, patch: Partial<Omit<System, 'id'>>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    setHabits((prev) => [...prev, { ...habit, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Omit<Habit, 'id'>>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);

  const upsertLog = useCallback((log: Omit<DailyLog, 'id'>) => {
    setLogs((prev) => {
      const existing = prev.findIndex((l) => l.habitId === log.habitId && l.date === log.date);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...log };
        return updated;
      }
      return [...prev, { ...log, id: generateId() }];
    });
  }, []);

  const updateFriction = useCallback((habitId: string, date: string, friction: FrictionType) => {
    setLogs((prev) => {
      const existing = prev.findIndex((l) => l.habitId === habitId && l.date === date);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], friction };
        return updated;
      }
      return [...prev, { id: generateId(), habitId, date, value: 0, friction }];
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSystems((prev) => {
      const toDelete = prev.filter((s) => s.goalId === id).map((s) => s.id);
      setHabits((ph) => {
        const habitIds = ph.filter((h) => toDelete.includes(h.systemId)).map((h) => h.id);
        setLogs((pl) => pl.filter((l) => !habitIds.includes(l.habitId)));
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
      return prev.filter((h) => h.systemId !== id);
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
  }, []);

  const getSystemsByGoal = useCallback((goalId: string) => systems.filter((s) => s.goalId === goalId), [systems]);
  const getHabitsBySystem = useCallback((systemId: string) => habits.filter((h) => h.systemId === systemId), [habits]);

  const getLogByHabitAndDate = useCallback(
    (habitId: string, date: string) => logs.find((l) => l.habitId === habitId && l.date === date),
    [logs]
  );

  const getHabitCompletion = useCallback(
    (habitId: string, date: string): number => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit || habit.target === 0) return 0;
      const log = logs.find((l) => l.habitId === habitId && l.date === date);
      if (!log) return 0;
      return Math.min((log.value / habit.target) * 100, 100);
    },
    [habits, logs]
  );

  const getSystemCompletion = useCallback(
    (systemId: string, date: string): number => {
      const systemHabits = habits.filter((h) => h.systemId === systemId);
      if (systemHabits.length === 0) return 0;
      const total = systemHabits.reduce((sum, h) => sum + getHabitCompletion(h.id, date), 0);
      return total / systemHabits.length;
    },
    [habits, getHabitCompletion]
  );

  const getGoalProgress = useCallback(
    (goalId: string, dateRange: { from: string; to: string }): number => {
      const goalSystems = systems.filter((s) => s.goalId === goalId);
      if (goalSystems.length === 0) return 0;

      const dates: string[] = [];
      const current = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
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
        if (!log.friction || log.value !== 0) return;
        const d = new Date(log.date);
        if (d.getFullYear() === year && months.includes(d.getMonth() + 1)) {
          stats[log.friction] = (stats[log.friction] ?? 0) + 1;
        }
      });

      return stats;
    },
    [logs]
  );

  return (
    <TrackerContext.Provider
      value={{
        goals, systems, habits, logs,
        addGoal, updateGoal, addSystem, updateSystem, addHabit, updateHabit, upsertLog, updateFriction,
        deleteGoal, deleteSystem, deleteHabit,
        getSystemsByGoal, getHabitsBySystem, getLogByHabitAndDate,
        getHabitCompletion, getSystemCompletion, getGoalProgress,
        getQuarterFrictionStats,
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
