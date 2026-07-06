import { colors } from '../theme/colors';

export function completionColor(pct: number): string {
  if (pct >= 80) return colors.primary;
  if (pct >= 40) return colors.babyBlue;
  return colors.lavender;
}

export function habitCompletion(value: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((value / target) * 100, 100);
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
