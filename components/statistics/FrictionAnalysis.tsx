"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTracker } from "@/context/TrackerContext";
import { FrictionType } from "@/lib/types";
import { getFrictionCountsFromSummaries } from "@/lib/log-archive";
import { AlertTriangle } from "lucide-react";

const FRICTION_COLORS: Record<FrictionType, string> = {
  Overtime: "#f59e0b",
  Fatigue: "#ef4444",
  "Sudden Appointment": "#8b5cf6",
  "Lack of Will": "#3b82f6",
  Other: "#a1a1aa",
};

const FRICTION_LABELS: Record<FrictionType, string> = {
  Overtime: "야근/초과근무",
  Fatigue: "피로",
  "Sudden Appointment": "갑작스런 약속",
  "Lack of Will": "의지 부족",
  Other: "기타",
};

const RECOMMENDATIONS: Record<FrictionType, string> = {
  Overtime:
    "야근/초과근무가 주요 방해 요인입니다. 습관을 이른 아침 시간대로 옮기는 것을 권장합니다.",
  Fatigue:
    "피로가 주요 방해 요인입니다. 일일 목표값을 낮춰 저항감을 줄여보세요.",
  "Sudden Appointment":
    "일정이 자주 방해됩니다. 버퍼 시간을 두거나 유연한 습관 실행 시간대를 설정해보세요.",
  "Lack of Will":
    "동기 부족이 주요 원인입니다. 습관 스태킹이나 최소 임계값 낮추기를 시도해보세요.",
  Other:
    "다양한 방해 요인이 있습니다. 각 상황에 맞는 유연한 대응 전략을 수립해보세요.",
};

export function FrictionAnalysis() {
  const { logs, yearlySummaries } = useTracker();

  const frictionCounts = useMemo(() => {
    const counts: Partial<Record<FrictionType, number>> =
      getFrictionCountsFromSummaries(yearlySummaries);

    logs
      .filter((l) => l.friction)
      .forEach((l) => {
        const f = l.friction!;
        counts[f] = (counts[f] ?? 0) + 1;
      });

    return counts;
  }, [logs, yearlySummaries]);

  const pieData = Object.entries(frictionCounts).map(([key, count]) => ({
    name: FRICTION_LABELS[key as FrictionType],
    value: count,
    key: key as FrictionType,
  }));

  const dominantFriction = pieData.sort((a, b) => b.value - a.value)[0];

  if (pieData.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          방해 요인 분석
        </h3>
        <p className="text-sm text-zinc-400">
          아직 방해 요인 기록이 없습니다. 습관 달성값이 0일 때 이유를 기록해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        방해 요인 분석
      </h3>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <ResponsiveContainer width={200} height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={FRICTION_COLORS[entry.key]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number, name: string) => [`${val}회`, name]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>

        {dominantFriction && (
          <div className="flex-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  주요 방해 요인: {dominantFriction.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {RECOMMENDATIONS[dominantFriction.key]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
