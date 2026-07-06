"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useHabitStore } from "@/hooks/useHabitStore";
import {
  Quarter,
  GoalWithCompletion,
  SystemWithCompletion,
  HabitWithCompletion,
} from "@/types";
import { getQuarter, getYear, format } from "date-fns";

type HabitContextType = ReturnType<typeof useHabitStore> & {
  selectedQuarter: Quarter;
  selectedYear: number;
  setSelectedQuarter: (q: Quarter) => void;
  setSelectedYear: (y: number) => void;
  viewMode: "month" | "week";
  setViewMode: (m: "month" | "week") => void;
  /** Enriched goal tree with today's completion for every level. */
  goalsWithCompletion: GoalWithCompletion[];
  todayStr: string;
};

const HabitContext = createContext<HabitContextType | null>(null);

function getCurrentQuarter(): Quarter {
  const q = getQuarter(new Date());
  return `Q${q}` as Quarter;
}

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const store = useHabitStore();
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(
    getCurrentQuarter()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    getYear(new Date())
  );
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  /**
   * Enriched tree: Goal → System → Habit with today's real-time completion.
   * Recomputes whenever logs or habits change (fine-grained via useMemo deps).
   */
  const goalsWithCompletion: GoalWithCompletion[] = useMemo(() => {
    return store.goals.map((goal) => {
      const goalSystems = store.systems.filter((s) => s.goalId === goal.id);

      const enrichedSystems: SystemWithCompletion[] = goalSystems.map((sys) => {
        const sysHabits = store.habits.filter((h) => h.systemId === sys.id);

        const enrichedHabits: HabitWithCompletion[] = sysHabits.map((habit) => {
          const completion = store.getHabitCompletion(habit.id, todayStr);
          const todayValue = store.getLogValue(habit.id, todayStr);
          return { ...habit, completion, todayValue };
        });

        const sysCompletion =
          enrichedHabits.length === 0
            ? 0
            : Math.round(
                enrichedHabits.reduce((s, h) => s + h.completion, 0) /
                  enrichedHabits.length
              );

        return { ...sys, completion: sysCompletion, habits: enrichedHabits };
      });

      const goalCompletion =
        enrichedSystems.length === 0
          ? 0
          : Math.round(
              enrichedSystems.reduce((s, sys) => s + sys.completion, 0) /
                enrichedSystems.length
            );

      return { ...goal, completion: goalCompletion, systems: enrichedSystems };
    });
  }, [
    store.goals,
    store.systems,
    store.habits,
    store.logs,
    store.getHabitCompletion,
    store.getLogValue,
    todayStr,
  ]);

  return (
    <HabitContext.Provider
      value={{
        ...store,
        selectedQuarter,
        selectedYear,
        setSelectedQuarter,
        setSelectedYear,
        viewMode,
        setViewMode,
        goalsWithCompletion,
        todayStr,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabit() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabit must be used within HabitProvider");
  return ctx;
}
