import { NextRequest, NextResponse } from 'next/server';
import { buildAppPathUrl } from '@/lib/app-url';
import { exchangeWechatOauthCodeForOpenId, WECHAT_OPENID_COOKIE, WECHAT_OAUTH_RETURN_TO_COOKIE, WECHAT_OAUTH_STATE_COOKIE } from '@/lib/wechat-oauth';

function normalizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/payment';
  }

  return returnTo;
}

function appendWechatAuthFlag(returnTo: string): string {
  const url = new URL(buildAppPathUrl(returnTo));
  url.searchParams.set('wechatAuth', '1');
  return url.toString();
}

function buildSafeRedirectResponse(returnTo: string) {
  const response = NextResponse.redirect(buildAppPathUrl(returnTo));
  response.cookies.delete(WECHAT_OAUTH_STATE_COOKIE);
  response.cookies.delete(WECHAT_OAUTH_RETURN_TO_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(WECHAT_OAUTH_STATE_COOKIE)?.value;
  const returnTo = normalizeReturnTo(request.cookies.get(WECHAT_OAUTH_RETURN_TO_COOKIE)?.value);

  if (!code || !state || !storedState || state !== storedState) {
    return buildSafeRedirectResponse(returnTo);
  }

  try {
    const openId = await exchangeWechatOauthCodeForOpenId(code);
    const response = NextResponse.redirect(appendWechatAuthFlag(returnTo));

    response.cookies.set(WECHAT_OPENID_COOKIE, openId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
    response.cookies.delete(WECHAT_OAUTH_STATE_COOKIE);
    response.cookies.delete(WECHAT_OAUTH_RETURN_TO_COOKIE);

    return response;
  } catch (error) {
    console.error('WeChat OAuth callback error:', error);
    return buildSafeRedirectResponse(returnTo);
  }
}
