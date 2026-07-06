'use client';

import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTracker } from '@/context/TrackerContext';
import { FrictionType, FRICTION_OPTIONS, FRICTION_COLORS, FRICTION_INSIGHTS } from '@/types';

interface FrictionInsightCardProps {
  topFriction: FrictionType | null;
  totalCount: number;
  topCount: number;
}

function FrictionInsightCard({ topFriction, totalCount, topCount }: FrictionInsightCardProps) {
  if (!topFriction || totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-6 text-center">
        <span className="text-4xl mb-3">🎉</span>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">이번 분기에 기록된 실패 원인이 없어요!</p>
        <p className="text-xs text-emerald-500 mt-1">계속 이 페이스로 유지해보세요.</p>
      </div>
    );
  }

  const percentage = totalCount > 0 ? Math.round((topCount / totalCount) * 100) : 0;
  const frictionEmojis: Record<FrictionType, string> = {
    '야근': '🌙',
    '피로': '😴',
    '갑작스런 약속': '📅',
    '의지 부족': '😔',
    '기타': '❓',
  };

  const color = FRICTION_COLORS[topFriction];

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 h-full min-h-[160px]"
      style={{
        background: `${color}15`,
        borderColor: `${color}40`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{frictionEmojis[topFriction]}</span>
        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">
            이번 분기 주요 실패 원인
          </p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {topFriction}
          </p>
          <p className="text-xs mt-0.5" style={{ color }}>
            전체 실패의 {percentage}% ({topCount}회)
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/60 dark:bg-black/20 px-4 py-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">💡 다음 분기 개선 제안</p>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
          당신의 가장 큰 실패 원인은{' '}
          <span className="font-semibold" style={{ color }}>[{topFriction}]</span>
          입니다.{' '}
          {FRICTION_INSIGHTS[topFriction]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="rounded-lg bg-white/50 dark:bg-black/10 px-3 py-2 text-center">
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalCount}</p>
          <p className="text-xs text-zinc-400">총 실패 기록</p>
        </div>
        <div className="rounded-lg bg-white/50 dark:bg-black/10 px-3 py-2 text-center">
          <p className="text-lg font-bold" style={{ color }}>{percentage}%</p>
          <p className="text-xs text-zinc-400">최다 원인 비율</p>
        </div>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; value: number; percent: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg px-4 py-2.5">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{item.value}회 · {Math.round(item.payload.percent * 100)}%</p>
      </div>
    );
  }
  return null;
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {payload?.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

export default function FrictionAnalysis() {
  const { getQuarterFrictionStats } = useTracker();

  const currentYear = new Date().getFullYear();
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';

  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const stats = getQuarterFrictionStats(selectedQuarter, selectedYear);

  const chartData = useMemo(() => {
    return FRICTION_OPTIONS
      .map((f) => ({ name: f, value: stats[f] ?? 0 }))
      .filter((d) => d.value > 0);
  }, [stats]);

  const totalCount = useMemo(() => Object.values(stats).reduce((a, b) => a + b, 0), [stats]);

  const topFriction = useMemo((): FrictionType | null => {
    if (totalCount === 0) return null;
    return FRICTION_OPTIONS.reduce((best, f) => (stats[f] > stats[best] ? f : best));
  }, [stats, totalCount]);

  const topCount = topFriction ? (stats[topFriction] ?? 0) : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            이번 분기 실패 원인 분석
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            0% 달성 날에 기록된 실패 원인 통계
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4')}
            className="text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
          <span className="text-5xl mb-3">✨</span>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {selectedQuarter} {selectedYear} — 기록된 실패 원인이 없습니다!
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            0% 달성 셀을 우클릭하여 실패 원인을 기록해보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
              원인별 분포
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={FRICTION_COLORS[entry.name as FrictionType]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Bar breakdown */}
            <div className="mt-4 flex flex-col gap-2">
              {FRICTION_OPTIONS.filter((f) => stats[f] > 0).map((f) => {
                const pct = totalCount > 0 ? (stats[f] / totalCount) * 100 : 0;
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-20 text-right flex-shrink-0">{f}</span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: FRICTION_COLORS[f] }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-8 flex-shrink-0">{stats[f]}회</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight Card */}
          <FrictionInsightCard
            topFriction={topFriction}
            totalCount={totalCount}
            topCount={topCount}
          />
        </div>
      )}
    </section>
  );
}
