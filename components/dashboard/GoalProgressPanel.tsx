"use client";

import React from "react";
import { useTracker } from "@/context/TrackerContext";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function gaugeColor(pct: number): string {
  if (pct < 40) return "#FFB7C5";
  if (pct < 70) return "#FF85A2";
  return "#FF6B9D";
}

export function GoalProgressPanel() {
  const { goalsWithCompletion } = useTracker();

  if (goalsWithCompletion.length === 0) return null;

  // Overall average across all goals today
  const overallAvg = Math.round(
    goalsWithCompletion.reduce((sum, g) => sum + g.completion, 0) /
      goalsWithCompletion.length
  );

  return (
    <section className="rounded-3xl border-2 border-pink-200 bg-white/90 dark:bg-pink-950/30 dark:border-pink-800/50 p-6 shadow-md shadow-pink-100/60">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">💖</span>
        <h2 className="font-bold text-pink-700 dark:text-pink-200">
          오늘의 달성률
        </h2>
        <span className="ml-auto text-sm text-pink-400">
          {new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {/* Goal gauges row */}
      <div className="flex flex-wrap gap-6 items-start justify-start">
        {/* Overall gauge */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <CircularGauge
            value={overallAvg}
            size={110}
            strokeWidth={9}
            color={gaugeColor(overallAvg)}
            sublabel="전체"
          />
          <span className="text-xs font-medium text-pink-500/80 dark:text-pink-300/70">
            전체 평균
          </span>
        </div>

        {/* Divider */}
        <div className="self-stretch w-px bg-pink-100 dark:bg-pink-900/40 hidden sm:block" />

        {/* Per-goal gauges */}
        <div className="flex flex-1 flex-wrap gap-5">
          {goalsWithCompletion.map((goal) => (
            <div key={goal.id} className="flex flex-col gap-3 min-w-[160px] flex-1">
              {/* Goal header */}
              <div className="flex items-center gap-2">
                <CircularGauge
                  value={goal.completion}
                  size={72}
                  strokeWidth={7}
                  color={gaugeColor(goal.completion)}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-pink-800 dark:text-pink-100 truncate">
                    {goal.title}
                  </p>
                  <p className="text-xs text-pink-400">
                    {goal.quarter} {goal.year}
                  </p>
                </div>
              </div>

              {/* System progress bars */}
              <div className="flex flex-col gap-2 pl-1">
                {goal.systems.map((sys) => (
                  <div key={sys.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-pink-500/80 dark:text-pink-300/70 truncate max-w-[140px]">
                        {sys.title}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums ml-2",
                          sys.completion >= 80
                            ? "text-pink-600"
                            : sys.completion >= 40
                            ? "text-pink-500"
                            : "text-pink-300"
                        )}
                      >
                        {sys.completion}%
                      </span>
                    </div>
                    <Progress
                      value={sys.completion}
                      className="h-1.5"
                    />
                  </div>
                ))}
                {goal.systems.length === 0 && (
                  <p className="text-xs text-pink-300">시스템 없음</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
