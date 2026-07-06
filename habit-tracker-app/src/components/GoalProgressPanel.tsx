"use client";

import React, { useEffect, useState } from "react";
import { useHabit } from "@/context/HabitContext";
import { GoalWithCompletion, SystemWithCompletion } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

// ─── Circular Gauge ────────────────────────────────────────────────────────────

interface CircularGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  sublabel?: string;
}

function CircularGauge({
  value,
  size = 100,
  strokeWidth = 9,
  color,
  sublabel,
}: CircularGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 80);
    return () => clearTimeout(t);
  }, [value]);

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`${Math.round(animated)}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums leading-none">
          {Math.round(animated)}
          <span className="text-xs font-normal">%</span>
        </span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight text-center">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Animated Linear Progress ──────────────────────────────────────────────────

function LinearProgress({
  value,
  color,
  className,
}: {
  value: number;
  color: string;
  className?: string;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40",
        className
      )}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: `${animated}%`,
          backgroundColor: color,
          transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

// ─── System Row ────────────────────────────────────────────────────────────────

function SystemRow({
  sys,
  goalColor,
}: {
  sys: SystemWithCompletion;
  goalColor: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">{sys.name}</span>
        <span
          className="text-xs font-semibold tabular-nums flex-shrink-0"
          style={{ color: goalColor, opacity: sys.completion === 0 ? 0.4 : 1 }}
        >
          {sys.completion}%
        </span>
      </div>
      <LinearProgress value={sys.completion} color={goalColor} />
    </div>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: GoalWithCompletion }) {
  return (
    <div className="flex gap-4 items-start min-w-0 flex-1">
      <CircularGauge
        value={goal.completion}
        size={84}
        strokeWidth={8}
        color={goal.color}
      />
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <div>
          <p className="font-semibold text-sm truncate">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            {goal.quarter} {goal.year}
          </p>
        </div>
        {goal.systems.length > 0 ? (
          <div className="space-y-2">
            {goal.systems.map((sys) => (
              <SystemRow key={sys.id} sys={sys} goalColor={goal.color} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60">시스템 없음</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function GoalProgressPanel() {
  const { goalsWithCompletion, selectedQuarter, selectedYear } = useHabit();

  const filtered = goalsWithCompletion.filter(
    (g) => g.quarter === selectedQuarter && g.year === selectedYear
  );

  if (filtered.length === 0) return null;

  const overall =
    filtered.length === 0
      ? 0
      : Math.round(
          filtered.reduce((s, g) => s + g.completion, 0) / filtered.length
        );

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          오늘의 달성률{" "}
          <span className="text-muted-foreground font-normal">
            — {selectedQuarter} {selectedYear}
          </span>
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-wrap gap-px divide-x divide-border/30">
        {/* Overall gauge */}
        <div className="flex flex-col items-center justify-center gap-1 px-5 py-4 min-w-[110px]">
          <CircularGauge
            value={overall}
            size={90}
            strokeWidth={8}
            color="#10b981"
            sublabel="전체"
          />
          <span className="text-[11px] text-muted-foreground">전체 평균</span>
        </div>

        {/* Per-goal cards */}
        <div className="flex flex-wrap flex-1 gap-px divide-x divide-border/30">
          {filtered.map((goal) => (
            <div key={goal.id} className="px-5 py-4 flex-1 min-w-[220px]">
              <GoalCard goal={goal} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
