import { NextRequest, NextResponse } from 'next/server';
import { buildAppUrl } from '@/lib/app-url';
import { getWechatJsapiConfigErrors } from '@/lib/payment-config';
import {
  buildWechatOauthAuthorizeUrl,
  createWechatOauthState,
  WECHAT_OAUTH_RETURN_TO_COOKIE,
  WECHAT_OAUTH_STATE_COOKIE,
} from '@/lib/wechat-oauth';

function normalizeReturnTo(returnTo: string | null): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/payment';
  }

  return returnTo;
}

export async function GET(request: NextRequest) {
  const configErrors = getWechatJsapiConfigErrors();
  if (configErrors.length > 0) {
    return NextResponse.json(
      { error: `微信 JSAPI 配置不完整：${configErrors.join('、')}` },
      { status: 400 }
    );
  }

  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const state = createWechatOauthState();
  const redirectUri = buildAppUrl('/api/payment/wechat/oauth/callback');
  const authorizeUrl = buildWechatOauthAuthorizeUrl({ redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(WECHAT_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });
  response.cookies.set(WECHAT_OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });

  return response;
}
