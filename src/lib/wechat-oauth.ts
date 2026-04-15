import { randomBytes } from 'crypto';
import { WECHAT_CONFIG } from '@/lib/payment-config';

export const WECHAT_OPENID_COOKIE = 'wechat_openid';
export const WECHAT_OAUTH_RETURN_TO_COOKIE = 'wechat_oauth_return_to';
export const WECHAT_OAUTH_STATE_COOKIE = 'wechat_oauth_state';

interface WechatOauthTokenResponse {
  errcode?: number;
  errmsg?: string;
  openid?: string;
}

export function buildWechatOauthAuthorizeUrl(params: {
  redirectUri: string;
  scope?: 'snsapi_base' | 'snsapi_userinfo';
  state: string;
}): string {
  const searchParams = new URLSearchParams({
    appid: WECHAT_CONFIG.appId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: params.scope || 'snsapi_base',
    state: params.state,
  });

  return `https://open.weixin.qq.com/connect/oauth2/authorize?${searchParams.toString()}#wechat_redirect`;
}

export async function exchangeWechatOauthCodeForOpenId(code: string): Promise<string> {
  const searchParams = new URLSearchParams({
    appid: WECHAT_CONFIG.appId,
    secret: WECHAT_CONFIG.appSecret,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${searchParams.toString()}`, {
    cache: 'no-store',
  });

  const data = (await response.json()) as WechatOauthTokenResponse;

  if (!response.ok || data.errcode || !data.openid) {
    throw new Error(`微信网页授权失败: ${data.errmsg || data.errcode || response.status}`);
  }

  return data.openid;
}

export function createWechatOauthState(): string {
  return randomBytes(12).toString('hex');
}
