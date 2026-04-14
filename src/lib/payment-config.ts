export const PAYMENT_MODE = process.env.PAYMENT_MODE || 'sandbox';

export const TEST_PRICES: Record<string, number> = {
  mbti: parseInt(process.env.PRICE_MBTI || '999', 10),
  iq: parseInt(process.env.PRICE_IQ || '1999', 10),
  career: parseInt(process.env.PRICE_CAREER || '999', 10),
};

export const TEST_NAMES: Record<string, string> = {
  mbti: 'MBTI人格测试',
  iq: 'IQ智力测试',
  career: '职业性格测试',
};

export const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || '',
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

export const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
};

export function isSandboxMode(): boolean {
  return PAYMENT_MODE === 'sandbox';
}

export function getTestPrice(testType: string): number {
  return TEST_PRICES[testType] || 999;
}

export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function getTestName(testType: string): string {
  return TEST_NAMES[testType] || testType;
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
    ['ZPAY_RETURN_URL', ZPAY_CONFIG.returnUrl],
  ];

  return requiredEntries
    .filter(([, value]) => !value.trim())
    .map(([name]) => name);
}
