import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: '缺少订单ID' },
      { status: 400 }
    );
  }

  const order = getOrder(orderId);

  if (!order) {
    return NextResponse.json(
      { error: '订单不存在' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    orderId: order.id,
    testType: order.test_type,
    status: order.status,
    isPaid: order.status === 'paid',
    resultData: order.status === 'paid' ? order.result_data : null,
  });
}
