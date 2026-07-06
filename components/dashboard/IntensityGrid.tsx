"use client";

import React, { useState, useMemo } from "react";
import { useTracker } from "@/context/TrackerContext";
import { HabitLogModal } from "./HabitLogModal";
import { Habit } from "@/lib/types";
import { cn, completionBg, habitCompletion, formatDate } from "@/lib/utils";
import { format, subDays } from "date-fns";

const DAYS_TO_SHOW = 14;

export function IntensityGrid() {
  const { goalsWithCompletion, getLogByHabitDate, todayDate } = useTracker();
  const [modal, setModal] = useState<{ habit: Habit; date: string } | null>(null);

  // Generate last N dates
  const dates = useMemo(() => {
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
      format(subDays(new Date(), DAYS_TO_SHOW - 1 - i), "yyyy-MM-dd")
    );
  }, []);

  const allHabitsGrouped = useMemo(() => {
    return goalsWithCompletion.flatMap((goal) =>
      goal.systems.map((sys) => ({
        systemId: sys.id,
        systemTitle: sys.title,
        goalTitle: goal.title,
        habits: sys.habits,
      }))
    );
  }, [goalsWithCompletion]);

  if (allHabitsGrouped.length === 0) return null;

  return (
    <>
      <div className="rounded-3xl border-2 border-pink-200 dark:border-pink-800/50 bg-white/90 dark:bg-pink-950/30 shadow-md shadow-pink-100/60 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h2 className="font-bold text-pink-700 dark:text-pink-200 flex items-center gap-1.5">
            <span>☁️</span> 습관 강도 그리드
          </h2>
          <p className="text-xs text-pink-400 mt-0.5">
            최근 {DAYS_TO_SHOW}일 · 클릭하여 값 입력
          </p>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                {/* Habit name column */}
                <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 w-36 min-w-36 px-5 py-2 text-left">
                  <span className="sr-only">습관</span>
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    className={cn(
                      "px-0.5 py-1 text-center",
                      d === todayDate && "font-semibold"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] text-zinc-400 whitespace-nowrap",
                        d === todayDate && "text-pink-500 font-bold"
                      )}
                    >
                      {formatDate(d)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allHabitsGrouped.map((group) => (
                <React.Fragment key={group.systemId}>
                  {/* System group header */}
                  <tr>
                    <td
                      colSpan={dates.length + 1}
                      className="sticky left-0 bg-zinc-50 dark:bg-zinc-800/50 px-5 py-1.5"
                    >
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {group.goalTitle} · {group.systemTitle}
                      </span>
                    </td>
                  </tr>

                  {group.habits.map((habit) => (
                    <tr key={habit.id} className="group">
                      {/* Habit title */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50 px-5 py-1.5 transition-colors">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate block max-w-[120px]">
                          {habit.title}
                        </span>
                      </td>

                      {/* Day cells */}
                      {dates.map((d) => {
                        const log = getLogByHabitDate(habit.id, d);
                        const completion = habitCompletion(
                          log?.value ?? 0,
                          habit.target
                        );
                        const hasFriction = log?.friction != null;
                        const isToday = d === todayDate;

                        return (
                          <td key={d} className="px-0.5 py-1.5 text-center">
                            <button
                              title={`${habit.title}: ${log?.value ?? 0}/${habit.target} ${habit.unit} (${completion}%)`}
                              onClick={() => setModal({ habit, date: d })}
                              className={cn(
                                "relative h-7 w-7 rounded-md transition-all duration-300 hover:scale-110 hover:shadow-sm",
                                completionBg(completion),
                                isToday &&
                                  "ring-2 ring-offset-1 ring-pink-400 dark:ring-offset-zinc-900"
                              )}
                            >
                              {hasFriction && completion === 0 && (
                                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-5 pb-4 flex-wrap">
          <span className="text-[11px] text-zinc-400">강도:</span>
          {[
            { label: "없음", bg: "bg-zinc-100 dark:bg-zinc-800" },
            { label: "낮음 (1–39%)", bg: "bg-pink-200 dark:bg-pink-900/60" },
            { label: "중간 (40–79%)", bg: "bg-pink-400 dark:bg-pink-500" },
            { label: "높음 (80%+)", bg: "bg-pink-500 dark:bg-pink-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn("h-3 w-3 rounded-sm", item.bg)} />
              <span className="text-[11px] text-zinc-400">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="relative h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800">
              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] text-zinc-400">방해 요인 기록</span>
          </div>
        </div>
      </div>

      <HabitLogModal
        habit={modal?.habit ?? null}
        date={modal?.date}
        open={!!modal}
        onClose={() => setModal(null)}
      />
    </>
  );
}
