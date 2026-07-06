"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTracker } from "@/context/TrackerContext";
import { format, subDays } from "date-fns";
import { habitCompletion, average } from "@/lib/utils";

const COLORS = [
  "#FF6B9D", "#FF85A2", "#FFB7C5", "#FFC8D6",
  "#E84A7F", "#A8D8F0", "#FFD6E0",
];

export function CompletionCharts() {
  const { goals, systems, habits, logs } = useTracker();

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), 13 - i), "M/d");

      const point: Record<string, number | string> = { date: label };

      goals.forEach((goal) => {
        const goalSystems = systems.filter((s) => s.goalId === goal.id);
        const sysCompletions = goalSystems.map((sys) => {
          const sysHabits = habits.filter((h) => h.systemId === sys.id);
          const habitCompletions = sysHabits.map((habit) => {
            const log = logs.find(
              (l) => l.habitId === habit.id && l.date === date
            );
            return habitCompletion(log?.value ?? 0, habit.target);
          });
          return average(habitCompletions);
        });
        point[goal.title] = average(sysCompletions);
      });

      return point;
    });
  }, [goals, systems, habits, logs]);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        14일 Goal 달성률 추이
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
          <Tooltip
            formatter={(val: number) => `${val}%`}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {goals.map((goal, i) => (
            <Line
              key={goal.id}
              type="monotone"
              dataKey={goal.title}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
