export type PaidTestType = 'mbti' | 'iq' | 'career';

export const TEST_NAMES: Record<PaidTestType, string> = {
  mbti: 'MBTI人格测试',
  iq: 'IQ智力测试',
  career: '职业性格测试',
};

export const DEFAULT_TEST_PRICES: Record<PaidTestType, number> = {
  mbti: 2999,
  iq: 1999,
  career: 999,
};

export const TEST_DISPLAY_PRICES: Record<PaidTestType, string> = {
  mbti: '¥29.99',
  iq: '¥19.99',
  career: '¥9.99',
};

export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}
