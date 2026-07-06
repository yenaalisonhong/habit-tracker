'use client';

import React, { useState } from 'react';
import { useTracker } from '@/context/TrackerContext';
import { Goal, System, Habit } from '@/types';

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 ${className}`}>
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${
          pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-rose-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface EntityFormProps {
  type: 'goal' | 'system' | 'habit';
  mode?: 'create' | 'edit';
  initialValues?: {
    title?: string;
    unit?: string;
    target?: string;
    quarter?: Goal['quarter'];
    year?: string;
  };
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}

function EntityForm({ type, mode = 'create', initialValues, onSubmit, onCancel }: EntityFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [unit, setUnit] = useState(initialValues?.unit ?? '분');
  const [target, setTarget] = useState(initialValues?.target ?? '30');
  const [quarter, setQuarter] = useState<Goal['quarter']>(initialValues?.quarter ?? 'Q2');
  const [year, setYear] = useState(initialValues?.year ?? '2026');
  const isEdit = mode === 'edit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), unit, target, quarter, year });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={type === 'goal' ? '목표 이름' : type === 'system' ? '시스템 이름' : '습관 이름'}
        className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
        autoFocus
      />
      {type === 'goal' && (
        <div className="flex gap-2">
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4')}
            className="text-sm px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex-1"
          >
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => <option key={q}>{q}</option>)}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-20"
          />
        </div>
      )}
      {type === 'habit' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="단위 (예: 분)"
            className="text-sm px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex-1"
          />
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="목표값"
            className="text-sm px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-24"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">{isEdit ? '저장' : '추가'}</button>
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors">취소</button>
      </div>
    </form>
  );
}

function HabitRow({ habit, today }: { habit: Habit; today: string }) {
  const { getHabitCompletion, getLogByHabitAndDate, deleteHabit, updateHabit } = useTracker();
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const completion = getHabitCompletion(habit.id, today);
  const log = getLogByHabitAndDate(habit.id, today);

  if (editing) {
    return (
      <div className="px-3">
        <EntityForm
          type="habit"
          mode="edit"
          initialValues={{ title: habit.title, unit: habit.unit, target: String(habit.target) }}
          onSubmit={(data) => {
            updateHabit(habit.id, { title: data.title, unit: data.unit, target: Number(data.target) });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${completion >= 80 ? 'bg-emerald-500' : completion >= 40 ? 'bg-yellow-400' : completion > 0 ? 'bg-orange-400' : 'bg-zinc-200'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{habit.title}</span>
          <span className="text-xs text-zinc-400 flex-shrink-0">
            {log ? `${log.value}/${habit.target}${habit.unit}` : `—/${habit.target}${habit.unit}`}
          </span>
        </div>
        <ProgressBar value={completion} className="mt-1" />
      </div>
      {showActions && (
        <>
          <button
            onClick={() => setEditing(true)}
            className="text-zinc-300 hover:text-emerald-500 transition-colors text-xs"
            title="수정"
          >
            ✎
          </button>
          <button
            onClick={() => deleteHabit(habit.id)}
            className="text-zinc-300 hover:text-rose-500 transition-colors text-xs"
            title="삭제"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

function SystemCard({ system, today }: { system: System; today: string }) {
  const { getHabitsBySystem, getSystemCompletion, addHabit, deleteSystem, updateSystem } = useTracker();
  const [addingHabit, setAddingHabit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const habits = getHabitsBySystem(system.id);
  const completion = getSystemCompletion(system.id, today);

  return (
    <div className="ml-4 mb-2">
      {editing ? (
        <div className="ml-4">
          <EntityForm
            type="system"
            mode="edit"
            initialValues={{ title: system.title }}
            onSubmit={(data) => {
              updateSystem(system.id, { title: data.title });
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
      <div className="flex items-center gap-2 group">
        <button onClick={() => setExpanded(!expanded)} className="text-zinc-300 hover:text-zinc-600 text-xs w-4">
          {expanded ? '▾' : '▸'}
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{system.title}</span>
          <span className="text-xs text-zinc-400">{Math.round(completion)}%</span>
        </div>
        <button
          onClick={() => setAddingHabit(true)}
          className="hidden group-hover:inline text-xs text-emerald-500 hover:text-emerald-700 px-1"
          title="습관 추가"
        >
          + 습관
        </button>
        <button
          onClick={() => setEditing(true)}
          className="hidden group-hover:inline text-xs text-zinc-300 hover:text-emerald-500 transition-colors px-1"
          title="시스템 수정"
        >
          ✎
        </button>
        <button
          onClick={() => deleteSystem(system.id)}
          className="hidden group-hover:inline text-xs text-zinc-300 hover:text-rose-500 transition-colors px-1"
          title="시스템 삭제"
        >
          ✕
        </button>
      </div>
      )}

      {expanded && (
        <div className="mt-1">
          {habits.map((h) => <HabitRow key={h.id} habit={h} today={today} />)}
          {addingHabit && (
            <div className="ml-4">
              <EntityForm
                type="habit"
                onSubmit={(data) => {
                  addHabit({ systemId: system.id, title: data.title, unit: data.unit, target: Number(data.target) });
                  setAddingHabit(false);
                }}
                onCancel={() => setAddingHabit(false)}
              />
            </div>
          )}
          {!addingHabit && (
            <button
              onClick={() => setAddingHabit(true)}
              className="ml-3 mt-1 text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
            >
              + 습관 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { getSystemsByGoal, getGoalProgress, addSystem, deleteGoal, updateGoal } = useTracker();
  const [addingSystem, setAddingSystem] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const systems = getSystemsByGoal(goal.id);
  const today = new Date().toISOString().split('T')[0];
  const quarterStart = getQuarterStart(goal.quarter, goal.year);
  const quarterEnd = getQuarterEnd(goal.quarter, goal.year);
  const progress = getGoalProgress(goal.id, { from: quarterStart, to: today });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm mb-4">
      {editing ? (
        <EntityForm
          type="goal"
          mode="edit"
          initialValues={{ title: goal.title, quarter: goal.quarter, year: String(goal.year) }}
          onSubmit={(data) => {
            updateGoal(goal.id, { title: data.title, quarter: data.quarter as Goal['quarter'], year: Number(data.year) });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
      <>
      <div className="flex items-start gap-3">
        <button onClick={() => setExpanded(!expanded)} className="mt-1 text-zinc-300 hover:text-zinc-600 text-sm w-4">
          {expanded ? '▾' : '▸'}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{goal.title}</h3>
              <span className="text-xs text-zinc-400">{goal.quarter} {goal.year} · {quarterStart} ~ {quarterEnd}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${progress >= 80 ? 'text-emerald-600' : progress >= 40 ? 'text-yellow-500' : 'text-rose-500'}`}>
                {Math.round(progress)}%
              </span>
              <button onClick={() => setEditing(true)} className="text-zinc-300 hover:text-emerald-500 text-xs transition-colors" title="목표 수정">✎</button>
              <button onClick={() => deleteGoal(goal.id)} className="text-zinc-300 hover:text-rose-500 text-xs transition-colors" title="목표 삭제">✕</button>
            </div>
          </div>
          <ProgressBar value={progress} className="mt-2" />
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {systems.map((s) => <SystemCard key={s.id} system={s} today={today} />)}
          {addingSystem && (
            <div className="ml-4">
              <EntityForm
                type="system"
                onSubmit={(data) => {
                  addSystem({ goalId: goal.id, title: data.title });
                  setAddingSystem(false);
                }}
                onCancel={() => setAddingSystem(false)}
              />
            </div>
          )}
          {!addingSystem && (
            <button
              onClick={() => setAddingSystem(true)}
              className="ml-4 mt-2 text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
            >
              + 시스템 추가
            </button>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}

export default function GoalHierarchy() {
  const { goals, addGoal } = useTracker();
  const [addingGoal, setAddingGoal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">목표 · 시스템 · 습관</h2>
        <button
          onClick={() => setAddingGoal(true)}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          + 목표 추가
        </button>
      </div>

      {goals.map((g) => <GoalCard key={g.id} goal={g} />)}

      {goals.length === 0 && !addingGoal && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm">아직 목표가 없습니다.</p>
          <button onClick={() => setAddingGoal(true)} className="mt-3 text-sm text-emerald-600 hover:underline">
            첫 번째 목표를 추가해보세요
          </button>
        </div>
      )}

      {addingGoal && (
        <EntityForm
          type="goal"
          onSubmit={(data) => {
            addGoal({ title: data.title, quarter: data.quarter as Goal['quarter'], year: Number(data.year) });
            setAddingGoal(false);
          }}
          onCancel={() => setAddingGoal(false)}
        />
      )}
    </div>
  );
}

function getQuarterStart(quarter: string, year: number): string {
  const months: Record<string, string> = { Q1: '01-01', Q2: '04-01', Q3: '07-01', Q4: '10-01' };
  return `${year}-${months[quarter]}`;
}

function getQuarterEnd(quarter: string, year: number): string {
  const months: Record<string, string> = { Q1: '03-31', Q2: '06-30', Q3: '09-30', Q4: '12-31' };
  return `${year}-${months[quarter]}`;
}
