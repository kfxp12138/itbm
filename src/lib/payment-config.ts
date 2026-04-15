import { DEFAULT_TEST_PRICES, TEST_NAMES, formatPrice as formatTestPrice } from '@/lib/test-catalog';

export { TEST_NAMES } from '@/lib/test-catalog';

export const PAYMENT_MODE = process.env.PAYMENT_MODE || 'sandbox';

export const APP_CONFIG = {
  baseUrl: (process.env.APP_BASE_URL || '').trim().replace(/\/$/, ''),
};

export const TEST_PRICES: Record<string, number> = {
  mbti: parseInt(process.env.PRICE_MBTI || String(DEFAULT_TEST_PRICES.mbti), 10),
  iq: parseInt(process.env.PRICE_IQ || String(DEFAULT_TEST_PRICES.iq), 10),
  career: parseInt(process.env.PRICE_CAREER || String(DEFAULT_TEST_PRICES.career), 10),
};

export const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || '',
  appSecret: process.env.WECHAT_APP_SECRET || '',
  mchId: process.env.WECHAT_MCH_ID || '',
  apiKey: process.env.WECHAT_API_KEY || '',
  apiV3Key: process.env.WECHAT_API_V3_KEY || '',
  serialNo: process.env.WECHAT_SERIAL_NO || '',
  privateKey: process.env.WECHAT_PRIVATE_KEY || '',
  notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
  publicKeyId: process.env.WECHAT_PUBLIC_KEY_ID || '',
  publicKey: process.env.WECHAT_PUBLIC_KEY || '',
};

export const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
  returnUrl: process.env.ALIPAY_RETURN_URL || '',
};

export const ZPAY_CONFIG = {
  key: process.env.ZPAY_KEY || '',
  notifyUrl: process.env.ZPAY_NOTIFY_URL || '',
  pid: process.env.ZPAY_PID || '',
  returnUrl: process.env.ZPAY_RETURN_URL || '',
};

export const EMAIL_CONFIG = {
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com',
  host: process.env.SMTP_HOST || '',
  pass: process.env.SMTP_PASS || '',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_SECURE || '').trim()
    ? process.env.SMTP_SECURE === 'true'
    : parseInt(process.env.SMTP_PORT || '465', 10) === 465,
  user: process.env.SMTP_USER || '',
};

export function isSandboxMode(): boolean {
  return PAYMENT_MODE === 'sandbox';
}

export function getTestPrice(testType: string): number {
  return TEST_PRICES[testType] || 999;
}

export function formatPrice(cents: number): string {
  return formatTestPrice(cents);
}

export function getTestName(testType: string): string {
  if (testType === 'mbti' || testType === 'iq' || testType === 'career') {
    return TEST_NAMES[testType];
  }

  return testType;
}

export function getWechatNativeConfigErrors(): string[] {
  const requiredEntries: Array<[string, string]> = [
    ['WECHAT_APP_ID', WECHAT_CONFIG.appId],
    ['WECHAT_MCH_ID', WECHAT_CONFIG.mchId],
    ['WECHAT_API_KEY', WECHAT_CONFIG.apiKey],
    ['WECHAT_NOTIFY_URL', WECHAT_CONFIG.notifyUrl],
  ];

  return requiredEntries
    .filter(([, value]) => !value.trim())
    .map(([name]) => name);
}

export function getZpayConfigErrors(): string[] {
  const requiredEntries: Array<[string, string]> = [
    ['ZPAY_PID', ZPAY_CONFIG.pid],
    ['ZPAY_KEY', ZPAY_CONFIG.key],
    ['ZPAY_NOTIFY_URL', ZPAY_CONFIG.notifyUrl],
  ];

  return requiredEntries
    .filter(([, value]) => !value.trim())
    .map(([name]) => name);
}

export function isEmailServiceConfigured(): boolean {
  return Boolean(
    EMAIL_CONFIG.host.trim()
      && EMAIL_CONFIG.user.trim()
      && EMAIL_CONFIG.pass.trim()
      && EMAIL_CONFIG.fromEmail.trim()
      && Number.isFinite(EMAIL_CONFIG.port)
      && EMAIL_CONFIG.port > 0
  );
}
