"use client";

import { useMemo, useState } from "react";
import { useHabit } from "@/context/HabitContext";
import {
  getMonthDates,
  getQuarterDates,
  getYearDates,
  getWeeklyBuckets,
  getMonthlyBuckets,
  formatDate,
} from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";
type ChartType = "line" | "bar";

function getDateRange(period: PeriodType, quarter: string, year: number): string[] {
  const today = new Date();
  if (period === "weekly") {
    return getMonthDates(today.getFullYear(), today.getMonth() + 1);
  }
  if (period === "monthly") {
    return getQuarterDates(quarter as "Q1" | "Q2" | "Q3" | "Q4", year);
  }
  if (period === "quarterly") {
    return getYearDates(year);
  }
  return getYearDates(year);
}

function getBuckets(
  period: PeriodType,
  dates: string[],
  year: number
): { label: string; dates: string[] }[] {
  if (period === "weekly") return getWeeklyBuckets(dates);
  if (period === "monthly") return getMonthlyBuckets(dates);
  if (period === "quarterly") {
    return ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
      label: q,
      dates: getQuarterDates(q as "Q1" | "Q2" | "Q3" | "Q4", year),
    }));
  }
  return getMonthlyBuckets(dates);
}

export function StatsChart() {
  const { goals, systems, habits, selectedQuarter, selectedYear, getLog } =
    useHabit();

  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");

  const filteredGoals = goals.filter(
    (g) => g.quarter === selectedQuarter && g.year === selectedYear
  );

  const targetHabits = useMemo(() => {
    if (selectedGoalId === "all") {
      const goalIds = filteredGoals.map((g) => g.id);
      const systemIds = systems
        .filter((s) => goalIds.includes(s.goalId))
        .map((s) => s.id);
      return habits.filter((h) => systemIds.includes(h.systemId));
    }
    const systemIds = systems
      .filter((s) => s.goalId === selectedGoalId)
      .map((s) => s.id);
    return habits.filter((h) => systemIds.includes(h.systemId));
  }, [selectedGoalId, filteredGoals, systems, habits]);

  const chartData = useMemo(() => {
    const allDates = getDateRange(period, selectedQuarter, selectedYear);
    const buckets = getBuckets(period, allDates, selectedYear);

    return buckets.map(({ label, dates }) => {
      const entry: Record<string, string | number> = { label };
      targetHabits.forEach((habit) => {
        if (dates.length === 0) {
          entry[habit.name] = 0;
          return;
        }
        const completed = dates.filter((d) => getLog(habit.id, d)).length;
        entry[habit.name] = Math.round((completed / dates.length) * 100);
      });
      if (targetHabits.length > 0) {
        const total = targetHabits.reduce(
          (sum, h) => sum + (Number(entry[h.name]) || 0),
          0
        );
        entry["평균"] = Math.round(total / targetHabits.length);
      }
      return entry;
    });
  }, [period, selectedQuarter, selectedYear, targetHabits, getLog]);

  const COLORS = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ec4899",
    "#3b82f6",
    "#14b8a6",
    "#ef4444",
    "#8b5cf6",
  ];

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">습관 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={selectedGoalId}
          onValueChange={(v) => v !== null && setSelectedGoalId(v)}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 목표</SelectItem>
            {filteredGoals.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={period}
          onValueChange={(v) => v !== null && setPeriod(v as PeriodType)}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">주별</SelectItem>
            <SelectItem value="monthly">월별</SelectItem>
            <SelectItem value="quarterly">분기별</SelectItem>
            <SelectItem value="yearly">연별</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-md border border-border overflow-hidden">
          {(["bar", "line"] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={chartType === type ? "default" : "ghost"}
              className="h-8 px-3 text-xs rounded-none"
              onClick={() => setChartType(type)}
            >
              {type === "bar" ? "막대" : "꺾은선"}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                formatter={(value: unknown) => [`${value}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {targetHabits.slice(0, 8).map((habit, i) => (
                <Bar
                  key={habit.id}
                  dataKey={habit.name}
                  fill={habit.color || COLORS[i % COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={30}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                formatter={(value: unknown) => [`${value}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {targetHabits.slice(0, 8).map((habit, i) => (
                <Line
                  key={habit.id}
                  type="monotone"
                  dataKey={habit.name}
                  stroke={habit.color || COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {targetHabits.slice(0, 4).map((habit) => {
          const today = new Date();
          const monthDates = getMonthDates(
            today.getFullYear(),
            today.getMonth() + 1
          );
          const pastDates = monthDates.filter((d) => d <= formatDate(today));
          const completed = pastDates.filter((d) =>
            getLog(habit.id, d)
          ).length;
          const rate =
            pastDates.length > 0
              ? Math.round((completed / pastDates.length) * 100)
              : 0;

          return (
            <div
              key={habit.id}
              className="rounded-lg border border-border/50 p-3"
              style={{ borderLeftColor: habit.color, borderLeftWidth: 3 }}
            >
              <p className="text-xs text-muted-foreground truncate">{habit.name}</p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: habit.color }}
              >
                {rate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                이번 달 달성률
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
