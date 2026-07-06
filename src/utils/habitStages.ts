export type HabitLogStage = 'fail' | 'partial' | 'complete';

export const HABIT_STAGES: {
  key: HabitLogStage;
  symbol: string;
  label: string;
}[] = [
  { key: 'fail', symbol: '×', label: '실패' },
  { key: 'partial', symbol: '△', label: '부분' },
  { key: 'complete', symbol: '○', label: '완료' },
];

export function stageFromValue(value: number, target: number): HabitLogStage {
  if (value === 0) return 'fail';
  if (value >= target) return 'complete';
  return 'partial';
}

export function valueFromStage(stage: HabitLogStage, target: number): number {
  switch (stage) {
    case 'fail':
      return 0;
    case 'partial':
      return target <= 1 ? 1 : Math.max(1, Math.round(target * 0.5));
    case 'complete':
      return target;
  }
}
