'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTracker } from '@/context/TrackerContext';
import { FrictionType, FRICTION_OPTIONS } from '@/types';
import {
  HABIT_STAGES,
  HabitLogStage,
  stageFromValue,
  valueFromStage,
} from '@/utils/habitStages';
import {
  generateDateRange,
  formatShortDate,
  getDayLabel,
  today,
} from '@/utils/dates';

interface CellContextMenu {
  x: number;
  y: number;
  habitId: string;
  date: string;
  mode: 'main' | 'friction';
}

interface LogInputModal {
  habitId: string;
  habitTitle: string;
  date: string;
  unit: string;
  target: number;
  currentValue: number;
  currentFriction?: FrictionType;
}

function getCellColor(completion: number, hasFriction: boolean): string {
  if (completion === 0) {
    return hasFriction
      ? 'bg-rose-100 dark:bg-rose-950 border border-rose-300'
      : 'bg-zinc-100 dark:bg-zinc-800';
  }
  if (completion < 40) return 'bg-emerald-200 dark:bg-emerald-900';
  if (completion < 80) return 'bg-emerald-400 dark:bg-emerald-600';
  return 'bg-emerald-600 dark:bg-emerald-400';
}

export default function IntensityGrid() {
  const { goals, getSystemsByGoal, getHabitsBySystem, getHabitCompletion, getLogByHabitAndDate, upsertLog, updateFriction, habits } = useTracker();
  const [contextMenu, setContextMenu] = useState<CellContextMenu | null>(null);
  const [logModal, setLogModal] = useState<LogInputModal | null>(null);
  const [selectedStage, setSelectedStage] = useState<HabitLogStage | null>(null);
  const [selectedFriction, setSelectedFriction] = useState<FrictionType | null>(null);
  const [displayDays, setDisplayDays] = useState(21);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const dates = generateDateRange(displayDays);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openLogModal = useCallback(
    (habitId: string, date: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const log = getLogByHabitAndDate(habitId, date);
      setLogModal({
        habitId,
        habitTitle: habit.title,
        date,
        unit: habit.unit,
        target: habit.target,
        currentValue: log?.value ?? 0,
        currentFriction: log?.friction,
      });
      setSelectedStage(
        log ? stageFromValue(log.value ?? 0, habit.target) : null
      );
      setSelectedFriction(log?.friction ?? null);
      setContextMenu(null);
    },
    [habits, getLogByHabitAndDate]
  );

  const openFrictionMenu = useCallback((habitId: string, date: string, x: number, y: number) => {
    setContextMenu({ x, y, habitId, date, mode: 'friction' });
  }, []);

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, habitId: string, date: string) => {
      e.preventDefault();
      const completion = getHabitCompletion(habitId, date);
      if (completion === 0) {
        setContextMenu({ x: e.clientX, y: e.clientY, habitId, date, mode: 'main' });
      } else {
        openLogModal(habitId, date);
      }
    },
    [getHabitCompletion, openLogModal]
  );

  const handleCellClick = useCallback(
    (habitId: string, date: string) => {
      openLogModal(habitId, date);
    },
    [openLogModal]
  );

  const handleTouchStart = useCallback(
    (habitId: string, date: string, e: React.TouchEvent) => {
      const touch = e.touches[0];
      longPressTimer.current = setTimeout(() => {
        const completion = getHabitCompletion(habitId, date);
        if (completion === 0) {
          openFrictionMenu(habitId, date, touch.clientX, touch.clientY);
        }
      }, 500);
    },
    [getHabitCompletion, openFrictionMenu]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleSaveLog = useCallback(() => {
    if (!logModal || !selectedStage) return;
    const val = valueFromStage(selectedStage, logModal.target);
    const friction = val === 0 ? (selectedFriction ?? undefined) : undefined;
    upsertLog({ habitId: logModal.habitId, date: logModal.date, value: val, friction });
    setLogModal(null);
  }, [logModal, selectedStage, selectedFriction, upsertLog]);

  const handleSelectFriction = useCallback(
    (friction: FrictionType) => {
      if (!contextMenu) return;
      updateFriction(contextMenu.habitId, contextMenu.date, friction);
      setContextMenu(null);
    },
    [contextMenu, updateFriction]
  );

  const showFrictionInModal = logModal && selectedStage === 'fail';

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">습관 달성 현황</h2>
        <div className="flex gap-2">
          {[7, 14, 21, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDisplayDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                displayDays === d
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="min-w-max w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-2 text-left text-xs font-medium text-zinc-500 min-w-[140px]">
                습관
              </th>
              {dates.map((date) => {
                const isToday = date === today();
                const dayLabel = getDayLabel(date);
                const isSun = dayLabel === '일';
                const isSat = dayLabel === '토';
                return (
                  <th
                    key={date}
                    className={`px-1 py-2 text-center min-w-[40px] ${
                      isToday ? 'text-emerald-600 font-bold' : isSun ? 'text-rose-400' : isSat ? 'text-blue-400' : 'text-zinc-400'
                    }`}
                  >
                    <div className="text-[10px]">{dayLabel}</div>
                    <div className="text-[10px]">{formatShortDate(date)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const goalSystems = getSystemsByGoal(goal.id);
              return (
                <React.Fragment key={goal.id}>
                  <tr>
                    <td
                      colSpan={dates.length + 1}
                      className="sticky left-0 px-4 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 uppercase tracking-wide"
                    >
                      🎯 {goal.title}
                    </td>
                  </tr>
                  {goalSystems.map((system) => {
                    const systemHabits = getHabitsBySystem(system.id);
                    return (
                      <React.Fragment key={system.id}>
                        <tr>
                          <td
                            colSpan={dates.length + 1}
                            className="sticky left-0 px-6 py-1 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30"
                          >
                            ↳ {system.title}
                          </td>
                        </tr>
                        {systemHabits.map((habit) => (
                          <tr key={habit.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/30 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800 transition-colors">
                              <div className="font-medium truncate max-w-[130px]">{habit.title}</div>
                              <div className="text-[10px] text-zinc-400">{habit.unit} / {habit.target}</div>
                            </td>
                            {dates.map((date) => {
                              const completion = getHabitCompletion(habit.id, date);
                              const log = getLogByHabitAndDate(habit.id, date);
                              const hasFriction = completion === 0 && !!log?.friction;
                              const colorClass = getCellColor(completion, hasFriction);
                              const tooltipText =
                                completion === 0
                                  ? hasFriction
                                    ? `실패 원인: ${log?.friction}`
                                    : '미기록'
                                  : `${Math.round(completion)}% (${log?.value ?? 0}${habit.unit})`;

                              return (
                                <td key={date} className="px-1 py-1.5">
                                  <div
                                    className={`relative w-8 h-8 rounded-md cursor-pointer flex items-center justify-center transition-all hover:scale-110 hover:shadow-sm ${colorClass}`}
                                    title={tooltipText}
                                    onClick={() => handleCellClick(habit.id, date)}
                                    onContextMenu={(e) => handleCellRightClick(e, habit.id, date)}
                                    onTouchStart={(e) => handleTouchStart(habit.id, date, e)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchMove={handleTouchEnd}
                                  >
                                    {hasFriction && (
                                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    )}
                                    {completion > 0 && (
                                      <span className="text-[9px] font-bold text-white drop-shadow">
                                        {Math.round(completion)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-rose-500">×</span>미달성</div>
        <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-amber-500">△</span>저강도-중강도</div>
        <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-emerald-600">○</span>고강도</div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.mode === 'main' ? (
            <>
              <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 font-medium">
                0% 달성일 — 옵션 선택
              </div>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                onClick={() => openLogModal(contextMenu.habitId, contextMenu.date)}
              >
                <span>✏️</span> 실적 입력
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                onClick={() => setContextMenu({ ...contextMenu, mode: 'friction' })}
              >
                <span>📌</span> 실패 원인 기록
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 font-medium">
                실패 원인 선택
              </div>
              {FRICTION_OPTIONS.map((f) => (
                <button
                  key={f}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                  onClick={() => handleSelectFriction(f)}
                >
                  <span>{getFrictionEmoji(f)}</span> {f}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Log Input Modal */}
      {logModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setLogModal(null); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {logModal.habitTitle}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {logModal.date} · 목표: {logModal.target} {logModal.unit}
            </p>

            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              오늘 달성 상태
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {HABIT_STAGES.map(({ key, symbol, label }) => {
                const isActive = selectedStage === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedStage(key);
                      if (key !== 'fail') setSelectedFriction(null);
                    }}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                      isActive
                        ? key === 'fail'
                          ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30'
                          : key === 'partial'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <span
                      className={`text-2xl leading-none ${
                        isActive
                          ? key === 'fail'
                            ? 'text-rose-500'
                            : key === 'partial'
                            ? 'text-amber-500'
                            : 'text-emerald-600'
                          : 'text-zinc-400'
                      }`}
                    >
                      {symbol}
                    </span>
                    <span
                      className={`text-[11px] mt-1 ${
                        isActive ? 'font-semibold text-zinc-700 dark:text-zinc-200' : 'text-zinc-400'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {showFrictionInModal && (
              <div className="mt-3 mb-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                  <span className="text-rose-500">📌</span> 실패 원인 (선택)
                </p>
                <div className="flex flex-wrap gap-2">
                  {FRICTION_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFriction(selectedFriction === f ? null : f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedFriction === f
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-rose-300'
                      }`}
                    >
                      {getFrictionEmoji(f)} {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setLogModal(null)}
                className="flex-1 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveLog}
                disabled={!selectedStage}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFrictionEmoji(f: FrictionType): string {
  const map: Record<FrictionType, string> = {
    '야근': '🌙',
    '피로': '😴',
    '갑작스런 약속': '📅',
    '의지 부족': '😔',
    '기타': '❓',
  };
  return map[f];
}
