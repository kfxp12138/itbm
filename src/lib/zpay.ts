import { createHash } from 'crypto';
import { ZPAY_CONFIG } from '@/lib/payment-config';

const ZPAY_API_BASE_URL = 'https://zpayz.cn';

export type ZpayChannel = 'wxpay' | 'alipay';

interface ZpayCreateOrderParams {
  clientIp: string;
  device?: string;
  description: string;
  notifyUrl?: string;
  outTradeNo: string;
  returnUrl?: string;
  total: number;
  type: ZpayChannel;
}

export interface ZpayCreateOrderResult {
  expiresAt?: string;
  h5Url?: string;
  orderId?: string;
  tradeNo?: string;
}

export interface ZpayOrderQueryResult {
  money: string;
  outTradeNo: string;
  pid: string;
  status: number;
  tradeNo?: string;
  type?: string;
}

export interface ZpayCallbackParams {
  money: string;
  name?: string;
  out_trade_no: string;
  param?: string;
  pid: string;
  sign?: string;
  sign_type?: string;
  trade_no?: string;
  trade_status?: string;
  type?: string;
}

type ZpayValue = string | number | undefined | null;

function createMd5(value: string): string {
  return createHash('md5').update(value, 'utf8').digest('hex');
}

function buildZpaySignPayload(params: Record<string, ZpayValue>): string {
  return Object.entries(params)
    .filter(([key, value]) => key !== 'sign' && key !== 'sign_type' && value !== '' && value != null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
}

export function createZpaySignature(params: Record<string, ZpayValue>, key = ZPAY_CONFIG.key): string {
  return createMd5(`${buildZpaySignPayload(params)}${key}`);
}

export function verifyZpaySignature(params: Record<string, ZpayValue>, providedSign?: string, key = ZPAY_CONFIG.key): boolean {
  if (!providedSign?.trim()) {
    return false;
  }

  return createZpaySignature(params, key) === providedSign.trim().toLowerCase();
}

function assertZpaySuccessCode(payload: unknown): asserts payload is Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('ZPAY 返回格式无效');
  }

  const code = String((payload as Record<string, unknown>).code ?? '');
  if (code !== '1') {
    const message = String((payload as Record<string, unknown>).msg ?? 'ZPAY 下单失败');
    throw new Error(message);
  }
}

export function formatZpayAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parseZpayAmountToCents(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  const normalized = Number(String(value).trim());
  if (!Number.isFinite(normalized)) {
    return null;
  }

  return Math.round(normalized * 100);
}

export function getZpayChannelByPaymentMethod(paymentMethod: 'wechat' | 'alipay'): ZpayChannel {
  return paymentMethod === 'wechat' ? 'wxpay' : 'alipay';
}

export async function createZpayOrder(params: ZpayCreateOrderParams): Promise<ZpayCreateOrderResult> {
  const payload = {
    device: params.device || 'pc',
    clientip: params.clientIp,
    money: formatZpayAmount(params.total),
    name: params.description,
    notify_url: params.notifyUrl || ZPAY_CONFIG.notifyUrl,
    out_trade_no: params.outTradeNo,
    pid: ZPAY_CONFIG.pid,
    return_url: params.returnUrl || ZPAY_CONFIG.returnUrl,
    sign_type: 'MD5',
    type: params.type,
  };

  const requestBody = new FormData();
  const signedPayload = {
    ...payload,
    sign: createZpaySignature(payload),
  };

  Object.entries(signedPayload).forEach(([key, value]) => {
    requestBody.append(key, String(value));
  });

  const response = await fetch(`${ZPAY_API_BASE_URL}/mapi.php`, {
    body: requestBody,
    method: 'POST',
  });

  const rawText = await response.text();
  let data: unknown;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`ZPAY 下单响应无法解析：${rawText || '空响应'}`);
  }

  assertZpaySuccessCode(data);

  const record = data as Record<string, unknown>;
  const h5Url = typeof record.payurl2 === 'string' ? record.payurl2.trim() : '';
  if (!h5Url) {
    throw new Error('ZPAY 下单成功，但未返回 H5 支付链接');
  }

  return {
    h5Url: h5Url || undefined,
    orderId: typeof record.O_id === 'string' ? record.O_id : undefined,
    tradeNo: typeof record.trade_no === 'string' ? record.trade_no : undefined,
  };
}

export async function queryZpayOrderByOutTradeNo(outTradeNo: string): Promise<ZpayOrderQueryResult | null> {
  const query = new URLSearchParams({
    act: 'order',
    key: ZPAY_CONFIG.key,
    out_trade_no: outTradeNo,
    pid: ZPAY_CONFIG.pid,
  });

  const response = await fetch(`${ZPAY_API_BASE_URL}/api.php?${query.toString()}`, {
    cache: 'no-store',
    method: 'GET',
  });

  const rawText = await response.text();
  let data: unknown;

  try {
    data = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (String(record.code ?? '') !== '1') {
    return null;
  }

  return {
    money: String(record.money ?? ''),
    outTradeNo: String(record.out_trade_no ?? ''),
    pid: String(record.pid ?? ''),
    status: Number(record.status ?? 0),
    tradeNo: typeof record.trade_no === 'string' ? record.trade_no : undefined,
    type: typeof record.type === 'string' ? record.type : undefined,
  };
}

export function readZpayCallbackParams(url: string): ZpayCallbackParams {
  const searchParams = new URL(url).searchParams;

  return {
    money: searchParams.get('money') || '',
    name: searchParams.get('name') || undefined,
    out_trade_no: searchParams.get('out_trade_no') || '',
    param: searchParams.get('param') || undefined,
    pid: searchParams.get('pid') || '',
    sign: searchParams.get('sign') || undefined,
    sign_type: searchParams.get('sign_type') || undefined,
    trade_no: searchParams.get('trade_no') || undefined,
    trade_status: searchParams.get('trade_status') || undefined,
    type: searchParams.get('type') || undefined,
  };
}
