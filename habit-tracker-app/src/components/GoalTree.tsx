"use client";

import { useState } from "react";
import { useHabit } from "@/context/HabitContext";
import { Goal, HabitSystem, Habit, GOAL_COLORS, HABIT_COLORS } from "@/types";
import { generateId, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Target,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ModalType =
  | { type: "goal" }
  | { type: "system"; goalId: string }
  | { type: "habit"; systemId: string }
  | null;

export function GoalTree() {
  const {
    goals,
    systems,
    habits,
    selectedQuarter,
    selectedYear,
    addGoal,
    deleteGoal,
    addSystem,
    deleteSystem,
    addHabit,
    deleteHabit,
  } = useHabit();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const filteredGoals = goals.filter(
    (g) => g.quarter === selectedQuarter && g.year === selectedYear
  );

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const openModal = (m: ModalType) => {
    setModal(m);
    setForm({});
  };

  const handleSubmit = () => {
    if (!modal) return;
    if (modal.type === "goal") {
      if (!form.name?.trim()) return;
      addGoal({
        id: generateId(),
        name: form.name.trim(),
        quarter: selectedQuarter,
        year: selectedYear,
        color: form.color || GOAL_COLORS[0],
        createdAt: formatDate(new Date()),
      });
    } else if (modal.type === "system") {
      if (!form.name?.trim()) return;
      addSystem({
        id: generateId(),
        goalId: modal.goalId,
        name: form.name.trim(),
        description: form.description?.trim() || "",
        createdAt: formatDate(new Date()),
      });
    } else if (modal.type === "habit") {
      if (!form.name?.trim()) return;
      addHabit({
        id: generateId(),
        systemId: modal.systemId,
        name: form.name.trim(),
        reminderTime: form.reminderTime || undefined,
        color: form.color || HABIT_COLORS[0],
        createdAt: formatDate(new Date()),
        target: form.target ? Math.max(1, Number(form.target)) : 1,
        unit: form.unit?.trim() || "회",
      });
    }
    setModal(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Goal Tree
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => openModal({ type: "goal" })}
        >
          <Plus className="w-3 h-3" /> 목표 추가
        </Button>
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          이 분기에 설정된 목표가 없습니다
        </div>
      )}

      {filteredGoals.map((goal) => {
        const goalSystems = systems.filter((s) => s.goalId === goal.id);
        const isExpanded = expanded[goal.id] !== false;

        return (
          <div
            key={goal.id}
            className="rounded-lg border border-border/50 overflow-hidden"
          >
            {/* Goal Row */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent/30 transition-colors"
              style={{ borderLeft: `3px solid ${goal.color}` }}
              onClick={() => toggle(goal.id)}
            >
              <span className="text-muted-foreground">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
              <Target className="w-4 h-4" style={{ color: goal.color }} />
              <span className="font-medium text-sm flex-1">{goal.name}</span>
              <Badge variant="secondary" className="text-xs">
                {goalSystems.length} 시스템
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGoal(goal.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Systems */}
            {isExpanded && (
              <div className="bg-background/30">
                {goalSystems.map((system) => {
                  const systemHabits = habits.filter(
                    (h) => h.systemId === system.id
                  );
                  const isSysExpanded = expanded[system.id] !== false;

                  return (
                    <div key={system.id}>
                      <div
                        className="flex items-center gap-2 px-3 py-2 pl-7 cursor-pointer hover:bg-accent/20 transition-colors"
                        onClick={() => toggle(system.id)}
                      >
                        <span className="text-muted-foreground">
                          {isSysExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm flex-1">{system.name}</span>
                        <Badge variant="outline" className="text-xs h-4">
                          {systemHabits.length} 습관
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSystem(system.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Habits */}
                      {isSysExpanded && (
                        <div className="pl-12 pb-1">
                          {systemHabits.map((habit) => (
                            <div
                              key={habit.id}
                              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/10 group"
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: habit.color }}
                              />
                              <Zap className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground flex-1">
                                {habit.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                                {habit.target ?? 1}{habit.unit ?? "회"}
                              </span>
                              {habit.reminderTime && (
                                <span className="text-xs text-muted-foreground/60">
                                  {habit.reminderTime}
                                </span>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-destructive"
                                onClick={() => deleteHabit(habit.id)}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs gap-1 text-muted-foreground mt-1"
                            onClick={() =>
                              openModal({
                                type: "habit",
                                systemId: system.id,
                              })
                            }
                          >
                            <Plus className="w-3 h-3" /> 습관 추가
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="px-3 py-2 pl-7">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs gap-1 text-muted-foreground"
                    onClick={() =>
                      openModal({ type: "system", goalId: goal.id })
                    }
                  >
                    <Plus className="w-3 h-3" /> 시스템 추가
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modal?.type === "goal" && "새 목표 추가"}
              {modal?.type === "system" && "새 시스템 추가"}
              {modal?.type === "habit" && "새 습관 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input
                placeholder={
                  modal?.type === "goal"
                    ? "예: 체중 5kg 감량"
                    : modal?.type === "system"
                    ? "예: 주 3회 러닝"
                    : "예: 30분 달리기"
                }
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            {modal?.type === "system" && (
              <div className="space-y-1.5">
                <Label>설명 (선택)</Label>
                <Input
                  placeholder="시스템 설명..."
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            )}
            {modal?.type === "habit" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>일일 목표값</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="예: 60"
                      value={form.target || ""}
                      onChange={(e) =>
                        setForm({ ...form, target: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>단위</Label>
                    <Input
                      placeholder="분, 페이지, 회…"
                      value={form.unit || ""}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>알림 시간 (선택)</Label>
                  <Input
                    type="time"
                    value={form.reminderTime || ""}
                    onChange={(e) =>
                      setForm({ ...form, reminderTime: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            {(modal?.type === "goal" || modal?.type === "habit") && (
              <div className="space-y-1.5">
                <Label>색상</Label>
                <div className="flex gap-2 flex-wrap">
                  {(modal?.type === "goal" ? GOAL_COLORS : HABIT_COLORS).map(
                    (c) => (
                      <button
                        key={c}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          form.color === c
                            ? "border-white scale-110"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setForm({ ...form, color: c })}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
