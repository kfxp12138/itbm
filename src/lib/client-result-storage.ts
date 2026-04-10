'use client';

export type PaidTestType = 'mbti' | 'iq' | 'career';

const HISTORY_KEYS: Record<PaidTestType, string> = {
  mbti: 'mbti_results',
  iq: 'iq_results',
  career: 'career_results',
};

const LATEST_KEYS: Record<PaidTestType, string> = {
  mbti: 'mbti_latest_result',
  iq: 'iq_latest_result',
  career: 'career_latest_result',
};

const PENDING_KEYS: Record<PaidTestType, string> = {
  mbti: 'mbti_pending_result',
  iq: 'iq_pending_result',
  career: 'career_pending_result',
};

interface TimestampedEntry {
  timestamp: number;
}

function readJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function readPendingResultRaw(testType: PaidTestType): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEYS[testType]);
  } catch {
    return null;
  }
}

export function savePendingResult(testType: PaidTestType, payload: unknown): void {
  const key = PENDING_KEYS[testType];
  sessionStorage.setItem(key, JSON.stringify(payload));
  localStorage.removeItem(key);
}

export function clearPendingResult(testType: PaidTestType): void {
  const key = PENDING_KEYS[testType];
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function clearAllPendingResults(): void {
  Object.values(PENDING_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function persistPaidResult<TLatest, THistory extends TimestampedEntry>(
  testType: PaidTestType,
  latestResult: TLatest,
  historyEntry: THistory
): void {
  const historyKey = HISTORY_KEYS[testType];
  const latestKey = LATEST_KEYS[testType];
  const history = readJsonArray<THistory>(historyKey);

  if (!history.some((entry) => entry.timestamp === historyEntry.timestamp)) {
    history.push(historyEntry);
    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  localStorage.setItem(latestKey, JSON.stringify(latestResult));
  clearPendingResult(testType);
}
