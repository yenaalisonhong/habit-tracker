"use client";

import { useMemo, useState } from "react";
import { useHabit } from "@/context/HabitContext";
import { getMonthDates, getWeekDates, cn } from "@/lib/utils";
import { format, getDay, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Habit } from "@/types";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// ─── 4-tier intensity system ───────────────────────────────────────────────────

/** Maps completion % → intensity level 0-3 */
function getIntensityLevel(completion: number): 0 | 1 | 2 | 3 {
  if (completion === 0) return 0;
  if (completion < 40) return 1;
  if (completion < 80) return 2;
  return 3;
}

/**
 * Stable Tailwind class strings for each intensity level.
 * Using full class names so Tailwind's purge doesn't strip them.
 */
const INTENSITY_CELL: Record<
  0 | 1 | 2 | 3,
  { bg: string; border: string; shadow: string; label: string; dot: string }
> = {
  0: {
    bg: "bg-zinc-800/30 dark:bg-zinc-700/20",
    border: "border-zinc-600/20",
    shadow: "",
    label: "없음",
    dot: "bg-zinc-500",
  },
  1: {
    bg: "bg-green-200 dark:bg-green-900",
    border: "border-green-300/40 dark:border-green-800/40",
    shadow: "shadow-[0_0_6px_0_rgba(134,239,172,0.35)]",
    label: "30%",
    dot: "bg-green-200",
  },
  2: {
    bg: "bg-green-400 dark:bg-green-700",
    border: "border-green-500/40 dark:border-green-600/40",
    shadow: "shadow-[0_0_8px_0_rgba(74,222,128,0.45)]",
    label: "60%",
    dot: "bg-green-400",
  },
  3: {
    bg: "bg-green-600 dark:bg-green-500",
    border: "border-green-700/50 dark:border-green-400/50",
    shadow: "shadow-[0_0_10px_0_rgba(22,163,74,0.55)]",
    label: "100%",
    dot: "bg-green-600",
  },
};

// ─── Intensity Legend ──────────────────────────────────────────────────────────

function IntensityLegend() {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <span className="text-[10px] text-muted-foreground/60">없음</span>
      {([0, 1, 2, 3] as const).map((level) => (
        <div
          key={level}
          className={cn(
            "w-[14px] h-[14px] rounded-sm border",
            INTENSITY_CELL[level].bg,
            INTENSITY_CELL[level].border
          )}
        />
      ))}
      <span className="text-[10px] text-muted-foreground/60">완료</span>
      <span className="ml-2 text-[10px] text-muted-foreground/40">
        · 클릭으로 단계 변경
      </span>
    </div>
  );
}

// ─── Value Input Modal (quantitative habits) ───────────────────────────────────

const STAGE_PRESETS = [
  { pct: 0, label: "없음", level: 0 as const },
  { pct: 30, label: "30%", level: 1 as const },
  { pct: 60, label: "60%", level: 2 as const },
  { pct: 100, label: "완료", level: 3 as const },
];

function ValueInputModal({
  habit,
  date,
  currentValue,
  onSave,
  onClose,
}: {
  habit: Habit;
  date: string;
  currentValue: number;
  onSave: (value: number) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState(String(currentValue));
  const target = habit.target ?? 1;
  const numericValue = Math.max(0, Number(input) || 0);
  const preview = Math.min(Math.round((numericValue / target) * 100), 100);
  const previewLevel = getIntensityLevel(preview);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-5 shadow-xl w-full max-w-xs mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: habit.color }}
            />
            <p className="font-semibold text-sm">{habit.name}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 pl-4">
            목표: {target} {habit.unit} · {date}
          </p>
        </div>

        {/* Intensity progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">달성률</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                previewLevel === 3
                  ? "text-green-400"
                  : previewLevel === 2
                  ? "text-green-300"
                  : previewLevel === 1
                  ? "text-green-200/80"
                  : "text-muted-foreground"
              )}
            >
              {preview}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                previewLevel === 3
                  ? "bg-green-600"
                  : previewLevel === 2
                  ? "bg-green-400"
                  : previewLevel === 1
                  ? "bg-green-200"
                  : "bg-transparent"
              )}
              style={{ width: `${preview}%` }}
            />
          </div>
        </div>

        {/* 4-stage quick-select buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {STAGE_PRESETS.map(({ pct, label, level }) => {
            const v =
              pct === 0
                ? 0
                : pct === 100
                ? target
                : target <= 1
                ? target * (pct / 100)
                : Math.round(target * (pct / 100));
            const isActive =
              Math.abs(numericValue - v) < 0.01 ||
              (pct === 100 && numericValue >= target);

            return (
              <button
                key={pct}
                onClick={() => setInput(String(v))}
                className={cn(
                  "rounded-lg py-2 px-1 text-xs font-medium border transition-all flex flex-col items-center gap-1",
                  isActive
                    ? "border-green-500/60 bg-green-500/10 text-green-400"
                    : "border-border text-muted-foreground hover:border-green-500/30"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-sm border",
                    INTENSITY_CELL[level].bg,
                    INTENSITY_CELL[level].border
                  )}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Numeric input */}
        <div className="relative">
          <input
            type="number"
            min={0}
            max={target}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`0 ~ ${target}`}
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {habit.unit}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-accent/30 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              onSave(Math.max(0, Number(input) || 0));
              onClose();
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors",
              previewLevel >= 1 ? "bg-green-600 hover:bg-green-700" : "bg-zinc-600 hover:bg-zinc-700"
            )}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main HabitGrid ────────────────────────────────────────────────────────────

export function HabitGrid() {
  const {
    goals,
    systems,
    habits,
    viewMode,
    cycleStageLog,
    setLogValue,
    getLogValue,
    getHabitCompletion,
  } = useHabit();

  const [valueModal, setValueModal] = useState<{
    habit: Habit;
    date: string;
    currentValue: number;
  } | null>(null);

  const today = new Date();
  const dates = useMemo(() => {
    if (viewMode === "week") return getWeekDates(today);
    return getMonthDates(today.getFullYear(), today.getMonth() + 1);
  }, [viewMode, today.getFullYear(), today.getMonth()]);

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm">습관을 추가하면 여기에 그리드가 표시됩니다</p>
        <p className="text-xs mt-1 opacity-60">
          왼쪽 Goal Tree에서 Goal → System → Habit 순서로 추가하세요
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header: dates */}
        <div
          className="grid gap-px mb-1"
          style={{ gridTemplateColumns: `200px repeat(${dates.length}, 28px)` }}
        >
          <div className="text-xs text-muted-foreground font-medium px-2">
            습관
          </div>
          {dates.map((date) => {
            const d = parseISO(date);
            const dayOfWeek = (getDay(d) + 6) % 7;
            const isTodayDate = isToday(d);
            return (
              <div
                key={date}
                className={cn(
                  "flex flex-col items-center justify-end h-10 pb-1",
                  isTodayDate && "relative"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    dayOfWeek === 5 && "text-blue-400",
                    dayOfWeek === 6 && "text-red-400",
                    isTodayDate && "font-bold text-primary"
                  )}
                >
                  {format(d, "d")}
                </span>
                <span
                  className={cn(
                    "text-[9px] leading-none text-muted-foreground/60 mt-0.5",
                    dayOfWeek === 5 && "text-blue-400/70",
                    dayOfWeek === 6 && "text-red-400/70"
                  )}
                >
                  {DAY_LABELS[dayOfWeek]}
                </span>
                {isTodayDate && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        {/* Rows: habits grouped by goal/system */}
        <div className="space-y-px">
          {goals.map((goal) => {
            const goalSystems = systems.filter((s) => s.goalId === goal.id);
            const goalHabits = habits.filter((h) =>
              goalSystems.some((s) => s.id === h.systemId)
            );
            if (goalHabits.length === 0) return null;

            return (
              <div key={goal.id}>
                {/* Goal header */}
                <div
                  className="grid gap-px items-center"
                  style={{
                    gridTemplateColumns: `200px repeat(${dates.length}, 28px)`,
                  }}
                >
                  <div
                    className="text-xs font-semibold px-2 py-1.5 rounded-sm"
                    style={{ color: goal.color }}
                  >
                    🎯 {goal.name}
                  </div>
                  {dates.map((date) => (
                    <div key={date} className="h-2" />
                  ))}
                </div>

                {/* System groups */}
                {goalSystems.map((system) => {
                  const systemHabits = habits.filter(
                    (h) => h.systemId === system.id
                  );
                  if (systemHabits.length === 0) return null;

                  return (
                    <div key={system.id}>
                      <div
                        className="grid gap-px items-center"
                        style={{
                          gridTemplateColumns: `200px repeat(${dates.length}, 28px)`,
                        }}
                      >
                        <div className="text-xs text-muted-foreground/70 px-4 py-1">
                          ↳ {system.name}
                        </div>
                        {dates.map((date) => (
                          <div key={date} />
                        ))}
                      </div>

                      {systemHabits.map((habit) => (
                        <HabitRow
                          key={habit.id}
                          habit={habit}
                          dates={dates}
                          getLogValue={getLogValue}
                          getHabitCompletion={getHabitCompletion}
                          cycleStageLog={cycleStageLog}
                          onOpenValueModal={(h, date, val) =>
                            setValueModal({ habit: h, date, currentValue: val })
                          }
                        />
                      ))}
                    </div>
                  );
                })}

                <div className="h-2" />
              </div>
            );
          })}

          {/* Orphan habits */}
          {habits
            .filter(
              (h) =>
                !systems.some((s) => s.id === h.systemId) ||
                !goals.some((g) =>
                  systems
                    .filter((s) => s.goalId === g.id)
                    .some((s) => s.id === h.systemId)
                )
            )
            .map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                dates={dates}
                getLogValue={getLogValue}
                getHabitCompletion={getHabitCompletion}
                cycleStageLog={cycleStageLog}
                onOpenValueModal={(h, date, val) =>
                  setValueModal({ habit: h, date, currentValue: val })
                }
              />
            ))}
        </div>

        {/* Intensity legend */}
        <IntensityLegend />
      </div>

      {/* Value input modal (quantitative habits only) */}
      {valueModal && (
        <ValueInputModal
          habit={valueModal.habit}
          date={valueModal.date}
          currentValue={valueModal.currentValue}
          onSave={(value) =>
            setLogValue(valueModal.habit.id, valueModal.date, value)
          }
          onClose={() => setValueModal(null)}
        />
      )}
    </div>
  );
}

// ─── HabitRow ──────────────────────────────────────────────────────────────────

function HabitRow({
  habit,
  dates,
  getLogValue,
  getHabitCompletion,
  cycleStageLog,
  onOpenValueModal,
}: {
  habit: Habit;
  dates: string[];
  getLogValue: (habitId: string, date: string) => number;
  getHabitCompletion: (habitId: string, date: string) => number;
  cycleStageLog: (habitId: string, date: string) => void;
  onOpenValueModal: (habit: Habit, date: string, currentValue: number) => void;
}) {
  const isQuantitative = (habit.target ?? 1) > 1;

  return (
    <div
      className="grid gap-px items-center group"
      style={{ gridTemplateColumns: `200px repeat(${dates.length}, 28px)` }}
    >
      {/* Habit label */}
      <div className="flex items-center gap-2 px-5 py-0.5">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: habit.color }}
        />
        <span className="text-xs truncate max-w-[130px]">{habit.name}</span>
        {isQuantitative && (
          <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
            /{habit.target}
            {habit.unit}
          </span>
        )}
      </div>

      {/* Date cells */}
      {dates.map((date) => {
        const value = getLogValue(habit.id, date);
        const completion = getHabitCompletion(habit.id, date);
        const level = getIntensityLevel(completion);
        const d = parseISO(date);
        const isTodayDate = isToday(d);
        const isFuture = d > new Date() && !isToday(d);
        const cell = INTENSITY_CELL[level];

        const handleClick = () => {
          if (isFuture) return;
          if (isQuantitative) {
            onOpenValueModal(habit, date, value);
          } else {
            cycleStageLog(habit.id, date);
          }
        };

        return (
          <Tooltip key={date}>
            <TooltipTrigger
              onClick={handleClick}
              disabled={isFuture}
              className={cn(
                "w-[18px] h-[18px] mx-auto rounded transition-all duration-200 border",
                "hover:scale-125 active:scale-95 focus:outline-none",
                cell.bg,
                cell.border,
                level > 0 && cell.shadow,
                isTodayDate &&
                  level === 0 &&
                  "ring-1 ring-primary/50 ring-offset-1 ring-offset-background",
                isFuture && "opacity-20 cursor-default pointer-events-none"
              )}
              aria-label={`${habit.name} ${date} — ${cell.label}`}
            />
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">
                {format(d, "M월 d일 (eee)", { locale: ko })}
              </p>
              {isQuantitative ? (
                <p
                  className={cn(
                    "mt-0.5",
                    level === 3
                      ? "text-green-400"
                      : level === 2
                      ? "text-green-300"
                      : level === 1
                      ? "text-green-200/80"
                      : "text-muted-foreground"
                  )}
                >
                  {value} / {habit.target} {habit.unit} ({completion}%)
                </p>
              ) : (
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-1",
                    level > 0 ? "text-green-400" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-sm border",
                      cell.bg,
                      cell.border
                    )}
                  />
                  {cell.label}
                  {level > 0 && ` (${completion}%)`}
                </p>
              )}
              {!isFuture && (
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {isQuantitative ? "클릭하여 값 입력" : "클릭하여 단계 변경"}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
