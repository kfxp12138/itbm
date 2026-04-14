import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('out_trade_no');

  if (!orderId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const targetPath = order.status === 'paid'
    ? `/${order.test_type}/result?orderId=${order.id}`
    : `/payment?${new URLSearchParams({
        testType: order.test_type,
        orderId: order.id,
        method: order.payment_method || 'wechat',
      }).toString()}`;

  return NextResponse.redirect(new URL(targetPath, request.url));
}
