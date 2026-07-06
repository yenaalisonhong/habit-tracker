export interface Goal {
  id: string;
  title: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  createdAt: string;
}

export interface System {
  id: string;
  goalId: string;
  title: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  systemId: string;
  title: string;
  unit: string;
  target: number;
  createdAt: string;
}

export type FrictionType = '야근' | '피로' | '갑작스런 약속' | '의지 부족' | '기타';

export const FRICTION_OPTIONS: FrictionType[] = [
  '야근',
  '피로',
  '갑작스런 약속',
  '의지 부족',
  '기타',
];

export const FRICTION_INSIGHTS: Record<FrictionType, string> = {
  '야근': '다음 분기에는 습관 실천 시간을 아침으로 앞당겨 보세요!',
  '피로': '일일 목표치를 조금 낮춰 저항감을 줄여보세요.',
  '갑작스런 약속': '유연한 습관 시간대를 설정하거나 버퍼 시간을 만들어보세요.',
  '의지 부족': '습관 스택킹이나 최소 실천 기준을 낮춰 꾸준함을 쌓아보세요.',
  '기타': '실패 원인을 더 구체적으로 기록해 패턴을 파악해보세요.',
};

export const FRICTION_COLORS: Record<FrictionType, string> = {
  '야근': '#f97316',
  '피로': '#8b5cf6',
  '갑작스런 약속': '#3b82f6',
  '의지 부족': '#ec4899',
  '기타': '#6b7280',
};

export const FRICTION_EMOJIS: Record<FrictionType, string> = {
  '야근': '🌙',
  '피로': '😴',
  '갑작스런 약속': '📅',
  '의지 부족': '😔',
  '기타': '❓',
};

export interface DailyLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
  friction?: FrictionType;
}

export interface YearlyHabitSummary {
  habitId: string;
  year: number;
  totalValue: number;
  daysRecorded: number;
  daysMetTarget: number;
  frictionCounts: Partial<Record<FrictionType, number>>;
  targetAtArchive: number;
}

export interface HabitWithCompletion extends Habit {
  todayLog: DailyLog | undefined;
  completion: number;
}

export interface SystemWithCompletion extends System {
  habits: HabitWithCompletion[];
  completion: number;
}

export interface GoalWithCompletion extends Goal {
  systems: SystemWithCompletion[];
  completion: number;
}

export interface TrackerData {
  goals: Goal[];
  systems: System[];
  habits: Habit[];
  logs: DailyLog[];
  yearlySummaries?: YearlyHabitSummary[];
}
