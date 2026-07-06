"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTracker } from "@/context/TrackerContext";
import { Habit, FrictionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  HABIT_STAGES,
  HabitLogStage,
  stageFromValue,
  valueFromStage,
} from "@/lib/habitStages";

const FRICTION_OPTIONS: FrictionType[] = [
  "Overtime",
  "Fatigue",
  "Sudden Appointment",
  "Lack of Will",
  "Other",
];

const FRICTION_LABELS: Record<FrictionType, string> = {
  Overtime: "야근/초과근무",
  Fatigue: "피로",
  "Sudden Appointment": "갑작스런 약속",
  "Lack of Will": "의지 부족",
  Other: "기타",
};

interface HabitLogModalProps {
  habit: Habit | null;
  open: boolean;
  onClose: () => void;
  date?: string;
}

export function HabitLogModal({ habit, open, onClose, date }: HabitLogModalProps) {
  const { upsertLog, getLogByHabitDate, todayDate } = useTracker();
  const logDate = date ?? todayDate;
  const existingLog = habit
    ? getLogByHabitDate(habit.id, logDate)
    : undefined;

  const [selectedStage, setSelectedStage] = useState<HabitLogStage | null>(null);
  const [friction, setFriction] = useState<FrictionType | "">("");

  useEffect(() => {
    if (open && habit) {
      setSelectedStage(
        existingLog ? stageFromValue(existingLog.value ?? 0, habit.target) : null
      );
      setFriction(existingLog?.friction ?? "");
    }
  }, [open, habit, existingLog, logDate]);

  if (!habit) return null;

  const showFriction = selectedStage === "fail";

  function handleSave() {
    if (!habit || !selectedStage) return;
    const value = valueFromStage(selectedStage, habit.target);
    upsertLog({
      habitId: habit.id,
      date: logDate,
      value,
      friction: value === 0 && friction ? (friction as FrictionType) : undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{habit.title}</DialogTitle>
          <DialogDescription className="text-xs">
            목표: {habit.target} {habit.unit} · {logDate}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          오늘 달성 상태
        </p>
        <div className="grid grid-cols-3 gap-2">
          {HABIT_STAGES.map(({ key, symbol, label }) => {
            const isActive = selectedStage === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedStage(key);
                  if (key !== "fail") setFriction("");
                }}
                className={cn(
                  "flex flex-col items-center py-3 rounded-xl border-2 transition-all",
                  isActive
                    ? key === "fail"
                      ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30"
                      : key === "partial"
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                )}
              >
                <span
                  className={cn(
                    "text-2xl leading-none",
                    isActive
                      ? key === "fail"
                        ? "text-rose-500"
                        : key === "partial"
                        ? "text-amber-500"
                        : "text-pink-600"
                      : "text-zinc-400"
                  )}
                >
                  {symbol}
                </span>
                <span
                  className={cn(
                    "text-[11px] mt-1",
                    isActive
                      ? "font-semibold text-zinc-700 dark:text-zinc-200"
                      : "text-zinc-400"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {showFriction && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">
              오늘 못한 이유 (선택)
            </label>
            <Select
              value={friction}
              onValueChange={(v) => setFriction(v as FrictionType)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="방해 요인 선택..." />
              </SelectTrigger>
              <SelectContent>
                {FRICTION_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FRICTION_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStage}
            className="flex-1 rounded-full bg-pink-400 py-2 text-sm font-semibold text-white hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-pink-200"
          >
            저장
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
