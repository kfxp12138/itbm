import { NextRequest, NextResponse } from 'next/server';
import { exchangeWechatOauthCodeForOpenId, WECHAT_OPENID_COOKIE, WECHAT_OAUTH_RETURN_TO_COOKIE, WECHAT_OAUTH_STATE_COOKIE } from '@/lib/wechat-oauth';

function appendWechatAuthFlag(returnTo: string, request: NextRequest): string {
  const url = new URL(returnTo, request.url);
  url.searchParams.set('wechatAuth', '1');
  return url.toString();
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(WECHAT_OAUTH_STATE_COOKIE)?.value;
  const returnTo = request.cookies.get(WECHAT_OAUTH_RETURN_TO_COOKIE)?.value || '/payment';

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  try {
    const openId = await exchangeWechatOauthCodeForOpenId(code);
    const response = NextResponse.redirect(appendWechatAuthFlag(returnTo, request));

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
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
}
