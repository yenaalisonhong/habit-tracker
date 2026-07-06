"use client";

import React, { useState } from "react";
import { useTracker } from "@/context/TrackerContext";
import { Progress } from "@/components/ui/progress";
import { HabitLogModal } from "./HabitLogModal";
import { AddEntityModal, EntityType, EntityModalMode } from "./AddEntityModal";
import { Habit } from "@/lib/types";
import { cn, completionBg } from "@/lib/utils";
import { ChevronDown, ChevronRight, Pencil, AlertCircle, Plus } from "lucide-react";

interface ModalState {
  type: EntityType;
  mode: EntityModalMode;
  entityId?: string;
  goalId?: string;
  systemId?: string;
}

function HabitRow({
  habit,
  completion,
  value,
  target,
  unit,
  hasFriction,
  onLog,
  onEdit,
}: {
  habit: Habit;
  completion: number;
  value: number;
  target: number;
  unit: string;
  hasFriction: boolean;
  onLog: (h: Habit) => void;
  onEdit: (h: Habit) => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
      onClick={() => onLog(habit)}
    >
      {/* Intensity dot */}
      <span
        className={cn(
          "h-2.5 w-2.5 flex-shrink-0 rounded-full transition-colors duration-500",
          completionBg(completion)
        )}
      />

      {/* Title */}
      <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
        {habit.title}
      </span>

      {/* Value display */}
      <span className="text-xs tabular-nums text-zinc-400 mr-1">
        {value} / {target} {unit}
      </span>

      {/* Friction alert */}
      {hasFriction && value === 0 && (
        <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
      )}

      {/* Completion pct */}
      <span
        className={cn(
          "text-xs font-semibold tabular-nums w-9 text-right transition-all duration-300",
          completion >= 80
            ? "text-pink-600 dark:text-pink-400"
            : completion >= 40
            ? "text-pink-500"
            : "text-zinc-400"
        )}
      >
        {completion}%
      </span>

      {/* Edit metadata */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(habit);
        }}
        className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0 transition-colors"
        title="습관 수정"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

export function GoalHierarchy() {
  const { goalsWithCompletion } = useTracker();
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [modalHabit, setModalHabit] = useState<Habit | null>(null);
  const [entityModal, setEntityModal] = useState<ModalState | null>(null);

  function openAdd(type: EntityType, ctx?: { goalId?: string; systemId?: string }) {
    setEntityModal({ type, mode: "create", ...ctx });
    if (ctx?.goalId) {
      setExpandedGoals((prev) => ({ ...prev, [ctx.goalId!]: true }));
    }
    if (ctx?.systemId) {
      setExpandedSystems((prev) => ({ ...prev, [ctx.systemId!]: true }));
    }
  }

  function openEdit(
    type: EntityType,
    entityId: string,
    ctx?: { goalId?: string; systemId?: string }
  ) {
    setEntityModal({ type, mode: "edit", entityId, ...ctx });
  }

  function toggleGoal(id: string) {
    setExpandedGoals((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSystem(id: string) {
    setExpandedSystems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const isGoalExpanded = (id: string) => expandedGoals[id] !== false;
  const isSystemExpanded = (id: string) => expandedSystems[id] !== false;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => openAdd("goal")}
          className="inline-flex items-center gap-1.5 rounded-full bg-pink-400 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pink-500 transition-colors shadow-sm shadow-pink-200"
        >
          <Plus className="h-4 w-4" />
          목표 추가
        </button>
      </div>

      {goalsWithCompletion.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-pink-300 dark:border-pink-800/50 bg-white/90 dark:bg-pink-950/30 p-10 text-center">
          <p className="text-sm text-pink-400 mb-4">아직 목표가 없어요 🥺 첫 목표를 추가해 보세요!</p>
          <button
            type="button"
            onClick={() => openAdd("goal")}
            className="inline-flex items-center gap-1.5 rounded-full bg-pink-400 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500 transition-colors shadow-sm shadow-pink-200"
          >
            <Plus className="h-4 w-4" />
            목표 추가
          </button>
        </div>
      ) : (
      <div className="space-y-4">
        {goalsWithCompletion.map((goal) => (
          <div
            key={goal.id}
            className="rounded-3xl border-2 border-pink-200 dark:border-pink-800/50 bg-white/90 dark:bg-pink-950/30 overflow-hidden shadow-md shadow-pink-100/50"
          >
            {/* ── Goal Header ── */}
            <div className="flex w-full items-center gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <button
                type="button"
                className="flex flex-1 min-w-0 items-center gap-3 text-left"
                onClick={() => toggleGoal(goal.id)}
              >
              {isGoalExpanded(goal.id) ? (
                <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {goal.title}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-zinc-400">
                      {goal.quarter} {goal.year}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums transition-all duration-300",
                        goal.completion >= 80
                          ? "text-pink-600"
                          : goal.completion >= 40
                          ? "text-pink-500"
                          : "text-zinc-400"
                      )}
                    >
                      {goal.completion}%
                    </span>
                  </div>
                </div>
                <Progress value={goal.completion} className="h-2" />
              </div>
              </button>
              <button
                type="button"
                onClick={() => openEdit("goal", goal.id)}
                className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="목표 수정"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* ── Systems ── */}
            {isGoalExpanded(goal.id) && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {goal.systems.map((sys) => (
                  <div key={sys.id}>
                    {/* System Header */}
                    <div className="flex w-full items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <button
                        type="button"
                        className="flex flex-1 min-w-0 items-center gap-3 text-left"
                        onClick={() => toggleSystem(sys.id)}
                      >
                      {isSystemExpanded(sys.id) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {sys.title}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums transition-all duration-300",
                              sys.completion >= 80
                                ? "text-pink-600"
                                : sys.completion >= 40
                                ? "text-pink-500"
                                : "text-zinc-400"
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
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit("system", sys.id, { goalId: goal.id })}
                        className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                        title="시스템 수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Habits */}
                    {isSystemExpanded(sys.id) && sys.habits.length > 0 && (
                      <div className="px-4 pb-2 pt-1 bg-zinc-50/50 dark:bg-zinc-800/20">
                        {sys.habits.map((habit) => (
                          <HabitRow
                            key={habit.id}
                            habit={habit}
                            completion={habit.completion}
                            value={habit.todayLog?.value ?? 0}
                            target={habit.target}
                            unit={habit.unit}
                            hasFriction={!!habit.todayLog?.friction}
                            onLog={setModalHabit}
                            onEdit={(h) => openEdit("habit", h.id, { systemId: sys.id })}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => openAdd("habit", { systemId: sys.id })}
                          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          습관 추가
                        </button>
                      </div>
                    )}
                    {isSystemExpanded(sys.id) && sys.habits.length === 0 && (
                      <div className="px-4 pb-3 pt-1 bg-zinc-50/50 dark:bg-zinc-800/20">
                        <p className="px-4 py-2 text-xs text-zinc-400">습관 없음</p>
                        <button
                          type="button"
                          onClick={() => openAdd("habit", { systemId: sys.id })}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          습관 추가
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {goal.systems.length === 0 && (
                  <div className="px-6 py-3">
                    <p className="text-xs text-zinc-400 mb-2">시스템 없음</p>
                    <button
                      type="button"
                      onClick={() => openAdd("system", { goalId: goal.id })}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      시스템 추가
                    </button>
                  </div>
                )}
                {goal.systems.length > 0 && (
                  <div className="px-5 py-2">
                    <button
                      type="button"
                      onClick={() => openAdd("system", { goalId: goal.id })}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      시스템 추가
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      <AddEntityModal
        type={entityModal?.type ?? "goal"}
        mode={entityModal?.mode ?? "create"}
        entityId={entityModal?.entityId}
        open={!!entityModal}
        onClose={() => setEntityModal(null)}
        goalId={entityModal?.goalId}
        systemId={entityModal?.systemId}
      />

      <HabitLogModal
        habit={modalHabit}
        open={!!modalHabit}
        onClose={() => setModalHabit(null)}
      />
    </>
  );
}
