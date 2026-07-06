import { Habit, YearlyHabitSummary, DailyLog } from "@/lib/types";
import { archiveCompletedYears } from "@/lib/log-archive";

export const STORAGE_VERSION = 3;
export const VERSION_KEY = "ht_storage_version";
export const FRESH_START_KEY = "ht_fresh_start";
export const FRESH_START_DONE = "done-2026-07-06";

export const KEYS = {
  goals: "ht_goals",
  systems: "ht_systems",
  habits: "ht_habits",
  logs: "ht_logs",
  yearlySummaries: "ht_yearly_summaries",
} as const;

export type StoragePayload = {
  goals: unknown[];
  systems: unknown[];
  habits: Habit[];
  logs: DailyLog[];
  yearlySummaries: YearlyHabitSummary[];
};

export type PersistResult = {
  archived: boolean;
  logs: DailyLog[];
  yearlySummaries: YearlyHabitSummary[];
  quotaExceeded: boolean;
};

let storageReady = false;

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function runMigrations(fromVersion: number): void {
  if (fromVersion >= STORAGE_VERSION) return;

  // v2 → v3: 연간 요약 키 추가 (기존 일별 로그는 그대로 유지)
  if (fromVersion < 3 && !localStorage.getItem(KEYS.yearlySummaries)) {
    localStorage.setItem(KEYS.yearlySummaries, "[]");
  }
}

export function clearAllTrackerData(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

function applyFreshStartIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FRESH_START_KEY) === FRESH_START_DONE) return;
  clearAllTrackerData();
  localStorage.setItem(FRESH_START_KEY, FRESH_START_DONE);
}

export function ensureStorageReady(): void {
  if (typeof window === "undefined" || storageReady) return;
  storageReady = true;

  applyFreshStartIfNeeded();

  const rawVersion = localStorage.getItem(VERSION_KEY);
  const currentStoredVersion = rawVersion ? Number(rawVersion) : 0;

  if (currentStoredVersion !== STORAGE_VERSION) {
    runMigrations(currentStoredVersion);
    localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
  }
}

export function loadJson<T>(key: string, fallback: T): T {
  ensureStorageReady();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function trySetItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function persistTrackerData(payload: StoragePayload): PersistResult {
  ensureStorageReady();
  if (typeof window === "undefined") {
    return {
      archived: false,
      logs: payload.logs,
      yearlySummaries: payload.yearlySummaries,
      quotaExceeded: false,
    };
  }

  const serialized = {
    goals: JSON.stringify(payload.goals),
    systems: JSON.stringify(payload.systems),
    habits: JSON.stringify(payload.habits),
    logs: JSON.stringify(payload.logs),
    yearlySummaries: JSON.stringify(payload.yearlySummaries),
  };

  try {
    trySetItem(KEYS.goals, serialized.goals);
    trySetItem(KEYS.systems, serialized.systems);
    trySetItem(KEYS.habits, serialized.habits);
    trySetItem(KEYS.logs, serialized.logs);
    trySetItem(KEYS.yearlySummaries, serialized.yearlySummaries);
    return {
      archived: false,
      logs: payload.logs,
      yearlySummaries: payload.yearlySummaries,
      quotaExceeded: false,
    };
  } catch (error) {
    if (!isQuotaError(error)) throw error;
  }

  const archived = archiveCompletedYears(
    payload.logs,
    payload.habits,
    payload.yearlySummaries
  );

  const retrySerialized = {
    ...serialized,
    logs: JSON.stringify(archived.logs),
    yearlySummaries: JSON.stringify(archived.summaries),
  };

  try {
    trySetItem(KEYS.logs, retrySerialized.logs);
    trySetItem(KEYS.yearlySummaries, retrySerialized.yearlySummaries);
    trySetItem(KEYS.goals, serialized.goals);
    trySetItem(KEYS.systems, serialized.systems);
    trySetItem(KEYS.habits, serialized.habits);
    return {
      archived: archived.logs.length !== payload.logs.length,
      logs: archived.logs,
      yearlySummaries: archived.summaries,
      quotaExceeded: false,
    };
  } catch (retryError) {
    if (!isQuotaError(retryError)) throw retryError;
    return {
      archived: archived.logs.length !== payload.logs.length,
      logs: archived.logs,
      yearlySummaries: archived.summaries,
      quotaExceeded: true,
    };
  }
}
