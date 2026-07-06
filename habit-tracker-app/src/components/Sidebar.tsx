"use client";

import { useHabit } from "@/context/HabitContext";
import { Quarter } from "@/types";
import { GoalTree } from "./GoalTree";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ActivitySquare } from "lucide-react";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const YEARS = [2024, 2025, 2026, 2027];

export function Sidebar() {
  const {
    selectedQuarter,
    selectedYear,
    setSelectedQuarter,
    setSelectedYear,
    goals,
    systems,
    habits,
  } = useHabit();

  const filteredGoals = goals.filter(
    (g) => g.quarter === selectedQuarter && g.year === selectedYear
  );
  const goalIds = filteredGoals.map((g) => g.id);
  const filteredSystemIds = systems
    .filter((s) => goalIds.includes(s.goalId))
    .map((s) => s.id);
  const filteredHabits = habits.filter((h) =>
    filteredSystemIds.includes(h.systemId)
  );

  return (
    <aside className="w-72 flex-shrink-0 border-r border-border/50 flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border/50">
        <ActivitySquare className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-base font-bold leading-none">HabitOS</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Goal · System · Habit
          </p>
        </div>
      </div>

      {/* Quarter Selector */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => v !== null && setSelectedYear(Number(v))}
          >
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedQuarter}
            onValueChange={(v) => v !== null && setSelectedQuarter(v as Quarter)}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: "목표", value: filteredGoals.length },
            { label: "시스템", value: filteredSystemIds.length },
            { label: "습관", value: filteredHabits.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-accent/20 rounded p-1.5 text-center"
            >
              <div className="text-sm font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Tree */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <GoalTree />
      </div>
    </aside>
  );
}
