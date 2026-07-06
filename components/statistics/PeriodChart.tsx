"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTracker } from "@/context/TrackerContext";
import {
  getLastNWeekBuckets,
  getLastNMonthBuckets,
  getLastNYearBuckets,
  type DateBucket,
} from "@/lib/utils";

export type ChartPeriod = "weekly" | "monthly" | "yearly";

const PERIOD_CONFIG: Record<
  ChartPeriod,
  { title: string; subtitle: string; bucketCount: number }
> = {
  weekly: {
    title: "주별 Goal 달성률 추이",
    subtitle: "최근 12주 · 주간 평균 달성률",
    bucketCount: 12,
  },
  monthly: {
    title: "월별 Goal 달성률 추이",
    subtitle: "최근 12개월 · 월간 평균 달성률",
    bucketCount: 12,
  },
  yearly: {
    title: "연별 Goal 달성률 추이",
    subtitle: "최근 5년 · 연간 평균 달성률",
    bucketCount: 5,
  },
};

const COLORS = [
  "#FF6B9D",
  "#FF85A2",
  "#FFB7C5",
  "#E84A7F",
  "#FFC8D6",
  "#A8D8F0",
  "#FFD6E0",
];

function getBuckets(period: ChartPeriod): DateBucket[] {
  const count = PERIOD_CONFIG[period].bucketCount;
  if (period === "weekly") return getLastNWeekBuckets(count);
  if (period === "monthly") return getLastNMonthBuckets(count);
  return getLastNYearBuckets(count);
}

function bucketCompletion(
  dates: string[],
  getCompletion: (date: string) => number
): number {
  if (dates.length === 0) return 0;
  const sum = dates.reduce((acc, date) => acc + getCompletion(date), 0);
  return Math.round(sum / dates.length);
}

interface PeriodChartProps {
  period: ChartPeriod;
}

export function PeriodChart({ period }: PeriodChartProps) {
  const { goals, getGoalCompletion } = useTracker();
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const config = PERIOD_CONFIG[period];

  const chartData = useMemo(() => {
    const buckets = getBuckets(period);
    return buckets.map(({ label, dates }) => {
      const point: Record<string, number | string> = { label };
      goals.forEach((goal) => {
        point[goal.title] = bucketCompletion(dates, (date) =>
          getGoalCompletion(goal.id, date)
        );
      });
      if (goals.length > 0) {
        const total = goals.reduce(
          (sum, goal) => sum + (Number(point[goal.title]) || 0),
          0
        );
        point["전체 평균"] = Math.round(total / goals.length);
      }
      return point;
    });
  }, [period, goals, getGoalCompletion]);

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-sm">
        <span className="text-4xl mb-3 block">📊</span>
        <p className="text-sm text-zinc-500">아직 목표가 없습니다.</p>
      </div>
    );
  }

  const seriesKeys = [...goals.map((g) => g.title), "전체 평균"];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {config.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">{config.subtitle}</p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
          {(["line", "bar"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                chartType === type
                  ? "bg-pink-600 text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {type === "line" ? "꺾은선" : "막대"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === "line" ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#a1a1aa"
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(val: number) => `${val}%`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={
                  key === "전체 평균"
                    ? "#71717a"
                    : COLORS[i % COLORS.length]
                }
                strokeWidth={key === "전체 평균" ? 2 : 2}
                strokeDasharray={key === "전체 평균" ? "5 5" : undefined}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#a1a1aa"
              tickFormatter={(v) => `${v}%`}
            />
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
              <Bar
                key={goal.id}
                dataKey={goal.title}
                fill={COLORS[i % COLORS.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
