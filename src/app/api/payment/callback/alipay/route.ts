import { NextResponse } from 'next/server';

function disabledAlipayCallback() {
  return new NextResponse('当前仅开放微信支付', { status: 410 });
}

export async function GET() {
  return disabledAlipayCallback();
}

export async function POST() {
  return disabledAlipayCallback();
}
