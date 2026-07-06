"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTracker } from "@/context/TrackerContext";
import { computeYearWrappedStats } from "@/lib/year-wrapped";
import { cn, completionColor } from "@/lib/utils";
import { Sparkles, Target, Layers, Repeat, Trophy } from "lucide-react";

interface YearWrappedModalProps {
  year: number;
  open: boolean;
  onClose: () => void;
}

function StatCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center",
        className
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-white/80 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-white/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function CompletionRow({
  title,
  subtitle,
  completion,
  achieved,
  extra,
}: {
  title: string;
  subtitle?: string;
  completion: number;
  achieved: boolean;
  extra?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
        {extra && (
          <p className="text-xs text-zinc-400 mt-0.5">{extra}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {achieved && (
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
            달성
          </span>
        )}
        <span className={cn("text-sm font-bold tabular-nums", completionColor(completion))}>
          {completion}%
        </span>
      </div>
    </div>
  );
}

export function YearWrappedModal({ year, open, onClose }: YearWrappedModalProps) {
  const {
    goals,
    systems,
    habits,
    logs,
    yearlySummaries,
    getGoalCompletion,
    getSystemCompletion,
  } = useTracker();

  const stats = useMemo(
    () =>
      computeYearWrappedStats(
        year,
        goals,
        systems,
        habits,
        logs,
        yearlySummaries,
        getGoalCompletion,
        getSystemCompletion
      ),
    [
      year,
      goals,
      systems,
      habits,
      logs,
      yearlySummaries,
      getGoalCompletion,
      getSystemCompletion,
    ]
  );

  const hasData =
    stats.totalGoals > 0 || stats.totalDaysLogged > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 border-0">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-pink-600 via-pink-500 to-teal-400 px-6 pt-8 pb-6 text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/10" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Year in Review
              </span>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight text-white">
              YEAR {year} WRAPPED
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80">
              올해의 목표 · 시스템 · 습관을 돌아봅니다
            </DialogDescription>
          </DialogHeader>

          {hasData && (
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <StatCard
                label="목표 달성"
                value={`${stats.achievedGoals}/${stats.totalGoals}`}
                sub={`평균 ${stats.overallGoalCompletion}%`}
              />
              <StatCard
                label="시스템"
                value={`${stats.achievedSystems}/${stats.totalSystems}`}
                sub="80% 이상"
              />
              <StatCard
                label="습관"
                value={`${stats.achievedHabits}/${stats.totalHabits}`}
                sub={`${stats.totalDaysLogged}일 기록`}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {!hasData ? (
            <p className="text-center text-sm text-zinc-500 py-4">
              {year}년 기록이 아직 없습니다.
              <br />
              내년에는 멋진 한 해를 만들어보세요!
            </p>
          ) : (
            <>
              {(stats.bestGoal || stats.bestHabit) && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    올해의 하이라이트
                  </div>
                  <div className="space-y-2">
                    {stats.bestGoal && stats.bestGoal.completion > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          최고 목표
                        </p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {stats.bestGoal.goal.title}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {stats.bestGoal.goal.quarter} · {stats.bestGoal.completion}% 달성
                        </p>
                      </div>
                    )}
                    {stats.bestHabit && stats.bestHabit.completion > 0 && (
                      <div className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2.5 dark:border-pink-900/50 dark:bg-pink-950/30">
                        <p className="text-xs text-pink-700 dark:text-pink-400 font-medium">
                          최고 습관
                        </p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {stats.bestHabit.habit.title}
                        </p>
                        <p className="text-xs text-pink-600 dark:text-pink-400">
                          목표 달성 {stats.bestHabit.daysMetTarget}일 / 기록{" "}
                          {stats.bestHabit.daysRecorded}일 ({stats.bestHabit.completion}%)
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {stats.goals.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Target className="h-3.5 w-3.5" />
                    목표 ({stats.achievedGoals}개 달성)
                  </div>
                  <div className="space-y-1.5">
                    {stats.goals.map(({ goal, completion, achieved }) => (
                      <CompletionRow
                        key={goal.id}
                        title={goal.title}
                        subtitle={`${goal.quarter} · ${goal.year}`}
                        completion={completion}
                        achieved={achieved}
                      />
                    ))}
                  </div>
                </section>
              )}

              {stats.systems.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Layers className="h-3.5 w-3.5" />
                    시스템 ({stats.achievedSystems}개 달성)
                  </div>
                  <div className="space-y-1.5">
                    {stats.systems.map(({ system, goalTitle, completion, achieved }) => (
                      <CompletionRow
                        key={system.id}
                        title={system.title}
                        subtitle={goalTitle}
                        completion={completion}
                        achieved={achieved}
                      />
                    ))}
                  </div>
                </section>
              )}

              {stats.habits.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Repeat className="h-3.5 w-3.5" />
                    습관 ({stats.achievedHabits}개 달성)
                  </div>
                  <div className="space-y-1.5">
                    {stats.habits.map(
                      ({
                        habit,
                        systemTitle,
                        completion,
                        achieved,
                        daysMetTarget,
                        daysRecorded,
                        totalValue,
                      }) => (
                        <CompletionRow
                          key={habit.id}
                          title={habit.title}
                          subtitle={systemTitle}
                          completion={completion}
                          achieved={achieved}
                          extra={
                            daysRecorded > 0
                              ? `목표 달성 ${daysMetTarget}일 · 총 ${totalValue} ${habit.unit}`
                              : "기록 없음"
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 transition-colors"
          >
            {hasData ? "멋진 한 해였어요! 🎉" : "확인"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
