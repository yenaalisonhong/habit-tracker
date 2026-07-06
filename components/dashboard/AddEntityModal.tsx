"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTracker } from "@/context/TrackerContext";
import { currentQuarter, currentYear } from "@/lib/utils";

export type EntityType = "goal" | "system" | "habit";
export type EntityModalMode = "create" | "edit";

interface AddEntityModalProps {
  type: EntityType;
  open: boolean;
  onClose: () => void;
  mode?: EntityModalMode;
  entityId?: string;
  goalId?: string;
  systemId?: string;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export function AddEntityModal({
  type,
  open,
  onClose,
  mode = "create",
  entityId,
  goalId,
  systemId,
}: AddEntityModalProps) {
  const { addGoal, addSystem, addHabit, updateGoal, updateSystem, updateHabit, goals, systems, habits } = useTracker();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState("");
  const [quarter, setQuarter] = useState<(typeof QUARTERS)[number]>(currentQuarter());
  const [year, setYear] = useState(currentYear());
  const [selectedGoalId, setSelectedGoalId] = useState(goalId ?? "");
  const [selectedSystemId, setSelectedSystemId] = useState(systemId ?? "");

  useEffect(() => {
    if (!open) return;

    if (isEdit && entityId) {
      if (type === "goal") {
        const goal = goals.find((g) => g.id === entityId);
        if (goal) {
          setTitle(goal.title);
          setQuarter(goal.quarter);
          setYear(goal.year);
        }
      } else if (type === "system") {
        const system = systems.find((s) => s.id === entityId);
        if (system) {
          setTitle(system.title);
          setSelectedGoalId(system.goalId);
        }
      } else {
        const habit = habits.find((h) => h.id === entityId);
        if (habit) {
          setTitle(habit.title);
          setSelectedSystemId(habit.systemId);
        }
      }
      return;
    }

    setTitle("");
    setQuarter(currentQuarter());
    setYear(currentYear());
    setSelectedGoalId(goalId ?? goals[0]?.id ?? "");
    setSelectedSystemId(systemId ?? systems[0]?.id ?? "");
  }, [open, isEdit, entityId, type, goalId, systemId, goals, systems, habits]);

  const config = {
    goal: {
      title: isEdit ? "목표 수정" : "새 목표 추가",
      description: isEdit
        ? "목표 이름, 분기, 연도를 수정하세요."
        : "분기 목표를 입력하세요. 아래에 시스템과 습관을 연결할 수 있습니다.",
    },
    system: {
      title: isEdit ? "시스템 수정" : "새 시스템 추가",
      description: isEdit
        ? "시스템 이름이나 소속 목표를 수정하세요."
        : "목표를 달성하기 위한 실행 시스템을 입력하세요.",
    },
    habit: {
      title: isEdit ? "습관 수정" : "새 습관 추가",
      description: isEdit
        ? "습관 이름이나 소속 시스템을 수정하세요."
        : "매일 추적할 습관을 입력하세요.",
    },
  }[type];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (type === "goal") {
      if (isEdit && entityId) {
        updateGoal(entityId, { title: trimmed, quarter, year });
      } else {
        addGoal({ title: trimmed, quarter, year });
      }
    } else if (type === "system") {
      const parentGoalId = isEdit ? selectedGoalId : goalId ?? selectedGoalId;
      if (!parentGoalId) return;
      if (isEdit && entityId) {
        updateSystem(entityId, { title: trimmed, goalId: parentGoalId });
      } else {
        addSystem({ title: trimmed, goalId: parentGoalId });
      }
    } else {
      const parentSystemId = isEdit ? selectedSystemId : systemId ?? selectedSystemId;
      if (!parentSystemId) return;
      if (isEdit && entityId) {
        updateHabit(entityId, {
          title: trimmed,
          systemId: parentSystemId,
        });
      } else {
        addHabit({
          title: trimmed,
          systemId: parentSystemId,
          unit: "회",
          target: 1,
        });
      }
    }

    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-zinc-700 dark:bg-zinc-800";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">이름</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "goal"
                  ? "예: 건강한 몸 만들기"
                  : type === "system"
                  ? "예: 운동 루틴"
                  : "예: 유산소 운동"
              }
              className={inputClass}
            />
          </div>

          {type === "goal" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">분기</label>
                <select
                  value={quarter}
                  onChange={(e) =>
                    setQuarter(e.target.value as (typeof QUARTERS)[number])
                  }
                  className={inputClass}
                >
                  {QUARTERS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">연도</label>
                <input
                  type="number"
                  min={2020}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {type === "system" && (isEdit || !goalId) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">소속 목표</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className={inputClass}
              >
                {goals.length === 0 ? (
                  <option value="">목표를 먼저 추가하세요</option>
                ) : (
                  goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {type === "habit" && (
            <>
              {(isEdit || !systemId) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">소속 시스템</label>
                  <select
                    value={selectedSystemId}
                    onChange={(e) => setSelectedSystemId(e.target.value)}
                    className={inputClass}
                  >
                    {systems.length === 0 ? (
                      <option value="">시스템을 먼저 추가하세요</option>
                    ) : (
                      systems.map((s) => {
                        const goal = goals.find((g) => g.id === s.goalId);
                        return (
                          <option key={s.id} value={s.id}>
                            {goal ? `${goal.title} › ` : ""}
                            {s.title}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={
                !title.trim() ||
                (type === "system" && !(isEdit ? selectedGoalId : goalId ?? selectedGoalId)) ||
                (type === "habit" && !(isEdit ? selectedSystemId : systemId ?? selectedSystemId))
              }
              className="flex-1 rounded-full bg-pink-400 py-2 text-sm font-semibold text-white hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-pink-200"
            >
              {isEdit ? "저장" : "추가"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
