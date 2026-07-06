'use client';

import React, { useMemo, useState } from 'react';
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
} from 'recharts';
import { useTracker } from '@/context/TrackerContext';

type Period = 'weekly' | 'monthly';

function formatDateLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === 'weekly') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getMonth() + 1}월`;
}

interface ChartDataPoint {
  label: string;
  [key: string]: string | number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function CompletionCharts() {
  const { goals, getSystemsByGoal, getHabitsBySystem, getHabitCompletion } = useTracker();
  const [period, setPeriod] = useState<Period>('weekly');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const allHabits = useMemo(() => {
    return goals.flatMap((g) =>
      getSystemsByGoal(g.id).flatMap((s) => getHabitsBySystem(s.id))
    );
  }, [goals, getSystemsByGoal, getHabitsBySystem]);

  const chartData = useMemo((): ChartDataPoint[] => {
    if (allHabits.length === 0) return [];

    const today = new Date();
    const points: ChartDataPoint[] = [];

    if (period === 'weekly') {
      for (let w = 11; w >= 0; w--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() - w * 7);
        const weekDates: string[] = [];
        for (let d = 0; d < 7; d++) {
          const dd = new Date(weekStart);
          dd.setDate(weekStart.getDate() + d);
          weekDates.push(dd.toISOString().split('T')[0]);
        }
        const point: ChartDataPoint = { label: formatDateLabel(weekDates[0], 'weekly') };
        allHabits.slice(0, 5).forEach((h) => {
          const avg =
            weekDates.reduce((sum, date) => sum + getHabitCompletion(h.id, date), 0) / weekDates.length;
          point[h.title] = Math.round(avg);
        });
        points.push(point);
      }
    } else {
      for (let m = 5; m >= 0; m--) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthDates: string[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          monthDates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        }
        const label = `${month + 1}월`;
        const point: ChartDataPoint = { label };
        allHabits.slice(0, 5).forEach((h) => {
          const avg =
            monthDates.reduce((sum, date) => sum + getHabitCompletion(h.id, date), 0) / monthDates.length;
          point[h.title] = Math.round(avg);
        });
        points.push(point);
      }
    }

    return points;
  }, [allHabits, period, getHabitCompletion]);

  const habitKeys = allHabits.slice(0, 5).map((h) => h.title);

  if (allHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-400">
        <span className="text-4xl mb-3">📊</span>
        <p className="text-sm">아직 습관이 없습니다.</p>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">달성률 트렌드</h3>
          <p className="text-xs text-zinc-400 mt-0.5">습관별 달성률 추이</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {(['weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {p === 'weekly' ? '주별' : '월별'}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {(['line', 'bar'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartType === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {t === 'line' ? '꺾은선' : '막대'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {habitKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {habitKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={16} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
