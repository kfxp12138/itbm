'use client';

export type PaidTestType = 'mbti' | 'iq' | 'career';

export type StoredPaymentMethod = 'wechat' | 'alipay';

export interface ActivePaymentSession {
  amountDisplay: string;
  expiresAt?: string;
  h5Url?: string;
  orderId: string;
  paymentMethod: StoredPaymentMethod;
  wechatInAppUrl?: string;
}

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

const ACTIVE_PAYMENT_KEYS: Record<PaidTestType, string> = {
  mbti: 'mbti_active_payment',
  iq: 'iq_active_payment',
  career: 'career_active_payment',
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

export function readActivePaymentSession(testType: PaidTestType): ActivePaymentSession | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_PAYMENT_KEYS[testType]);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActivePaymentSession>;
    const legacyCodeUrl = typeof (parsed as { codeUrl?: unknown }).codeUrl === 'string'
      ? (parsed as { codeUrl: string }).codeUrl
      : undefined;
    if (
      typeof parsed !== 'object' ||
      typeof parsed?.amountDisplay !== 'string' ||
      typeof parsed.orderId !== 'string' ||
      (parsed.paymentMethod !== 'wechat' && parsed.paymentMethod !== 'alipay')
    ) {
      return null;
    }

    return {
      amountDisplay: parsed.amountDisplay,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : undefined,
      h5Url: typeof parsed.h5Url === 'string'
        ? parsed.h5Url
        : legacyCodeUrl,
      orderId: parsed.orderId,
      paymentMethod: parsed.paymentMethod,
      wechatInAppUrl: typeof parsed.wechatInAppUrl === 'string' ? parsed.wechatInAppUrl : undefined,
    };
  } catch {
    return null;
  }
}

export function saveActivePaymentSession(testType: PaidTestType, payload: ActivePaymentSession): void {
  sessionStorage.setItem(ACTIVE_PAYMENT_KEYS[testType], JSON.stringify(payload));
}

export function clearActivePaymentSession(testType: PaidTestType): void {
  sessionStorage.removeItem(ACTIVE_PAYMENT_KEYS[testType]);
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
  clearActivePaymentSession(testType);
}
