import { createHash, randomBytes } from 'crypto';
import { WECHAT_CONFIG } from '@/lib/payment-config';

const WECHAT_API_BASE_URL = 'https://api.mch.weixin.qq.com';
const WECHAT_ORDER_QUERY_PATH = '/pay/orderquery';
const WECHAT_UNIFIED_ORDER_PATH = '/pay/unifiedorder';
const WECHAT_SIGN_TYPE = 'MD5';

interface WechatNativeOrderPayload {
  description: string;
  outTradeNo: string;
  productId: string;
  spbillCreateIp: string;
  total: number;
  notifyUrl?: string;
}

interface WechatUnifiedOrderResponse {
  code_url?: string;
  err_code?: string;
  err_code_des?: string;
  result_code?: string;
  return_code?: string;
  return_msg?: string;
}

interface WechatOrderQueryResponse {
  appid?: string;
  err_code?: string;
  err_code_des?: string;
  mch_id?: string;
  out_trade_no?: string;
  result_code?: string;
  return_code?: string;
  return_msg?: string;
  total_fee?: string;
  trade_state?: string;
  transaction_id?: string;
}

export interface WechatPaymentNotification {
  appid: string;
  mch_id: string;
  out_trade_no: string;
  result_code: string;
  return_code: string;
  total_fee: string;
  transaction_id?: string;
}

export interface WechatNativeOrderResult {
  codeUrl: string;
  expiresAt: string;
}

export interface WechatOrderQueryResult {
  appId?: string;
  mchId?: string;
  outTradeNo?: string;
  totalFee?: number;
  tradeState?: string;
  transactionId?: string;
}

type WechatSignableValue = number | string | undefined;

function createNonce(length = 16): string {
  return randomBytes(length).toString('hex');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildXml(data: Record<string, string>): string {
  const body = Object.entries(data)
    .map(([key, value]) => `<${key}><![CDATA[${escapeXml(value)}]]></${key}>`)
    .join('');

  return `<xml>${body}</xml>`;
}

function parseWechatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /<([^>]+)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/\1>/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) !== null) {
    const tag = match[1];
    if (tag === 'xml') {
      const nested = parseWechatXml(match[2] || match[3] || '');
      Object.assign(result, nested);
      continue;
    }

    result[tag] = (match[2] || match[3] || '').trim();
  }

  return result;
}

function buildSignableEntries(params: Record<string, WechatSignableValue>): Array<[string, string]> {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)] as [string, string])
    .filter(([key]) => key !== 'sign')
    .sort(([left], [right]) => left.localeCompare(right, 'en'));
}

function createWechatV2Signature(params: Record<string, WechatSignableValue>): string {
  const signText = `${buildSignableEntries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')}&key=${WECHAT_CONFIG.apiKey}`;

  return createHash('md5').update(signText, 'utf8').digest('hex').toUpperCase();
}

function buildUnifiedOrderRequest(params: Record<string, WechatSignableValue>): string {
  return buildXml({
    ...Object.fromEntries(buildSignableEntries(params)),
    sign: createWechatV2Signature(params),
  });
}

async function requestWechatUnifiedOrder(params: Record<string, WechatSignableValue>): Promise<WechatUnifiedOrderResponse & Record<string, string>> {
  const response = await fetch(`${WECHAT_API_BASE_URL}${WECHAT_UNIFIED_ORDER_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'lizhi-cedition-next-app/1.0',
    },
    body: buildUnifiedOrderRequest(params),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`微信支付下单失败: ${response.status} ${responseText}`);
  }

  return parseWechatXml(responseText) as WechatUnifiedOrderResponse & Record<string, string>;
}

function verifyWechatV2Signature(params: Record<string, string>): boolean {
  const providedSign = params.sign;
  if (!providedSign) {
    return false;
  }

  return createWechatV2Signature(params) === providedSign;
}

export async function createWechatNativeOrder(payload: WechatNativeOrderPayload): Promise<WechatNativeOrderResult> {
  const requestParams: Record<string, WechatSignableValue> = {
    appid: WECHAT_CONFIG.appId,
    body: payload.description,
    mch_id: WECHAT_CONFIG.mchId,
    nonce_str: createNonce(),
    notify_url: payload.notifyUrl || WECHAT_CONFIG.notifyUrl,
    out_trade_no: payload.outTradeNo,
    product_id: payload.productId,
    sign_type: WECHAT_SIGN_TYPE,
    spbill_create_ip: payload.spbillCreateIp,
    total_fee: payload.total,
    trade_type: 'NATIVE',
  };

  const data = await requestWechatUnifiedOrder(requestParams);

  if (data.return_code !== 'SUCCESS') {
    throw new Error(`微信支付通信失败: ${data.return_msg || '未知错误'}`);
  }

  if (data.result_code !== 'SUCCESS' || !data.code_url) {
    throw new Error(`微信支付业务失败: ${data.err_code_des || data.return_msg || data.err_code || '未知错误'}`);
  }

  return {
    codeUrl: data.code_url,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
}

export async function queryWechatOrderByOutTradeNo(outTradeNo: string): Promise<WechatOrderQueryResult | null> {
  const requestParams: Record<string, WechatSignableValue> = {
    appid: WECHAT_CONFIG.appId,
    mch_id: WECHAT_CONFIG.mchId,
    nonce_str: createNonce(),
    out_trade_no: outTradeNo,
    sign_type: WECHAT_SIGN_TYPE,
  };

  const requestBody = buildXml({
    ...Object.fromEntries(buildSignableEntries(requestParams)),
    sign: createWechatV2Signature(requestParams),
  });

  const response = await fetch(`${WECHAT_API_BASE_URL}${WECHAT_ORDER_QUERY_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'lizhi-cedition-next-app/1.0',
    },
    body: requestBody,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`微信支付查单失败: ${response.status} ${responseText}`);
  }

  const data = parseWechatXml(responseText) as WechatOrderQueryResponse & Record<string, string>;

  if (data.return_code !== 'SUCCESS') {
    return null;
  }

  if (!verifyWechatV2Signature(data)) {
    throw new Error('微信支付查单响应验签失败');
  }

  if (data.result_code !== 'SUCCESS' || data.trade_state !== 'SUCCESS') {
    return null;
  }

  const totalFee = Number(data.total_fee);

  return {
    appId: data.appid,
    mchId: data.mch_id,
    outTradeNo: data.out_trade_no,
    totalFee: Number.isFinite(totalFee) ? totalFee : undefined,
    tradeState: data.trade_state,
    transactionId: data.transaction_id,
  };
}

export function parseWechatPaymentNotification(xml: string): Record<string, string> {
  return parseWechatXml(xml);
}

export function verifyWechatPaymentNotification(params: Record<string, string>): params is Record<string, string> & WechatPaymentNotification {
  return verifyWechatV2Signature(params);
}

export function buildWechatCallbackSuccessResponse(): string {
  return buildXml({ return_code: 'SUCCESS', return_msg: 'OK' });
}

export function buildWechatCallbackFailureResponse(message: string): string {
  return buildXml({ return_code: 'FAIL', return_msg: message });
}
