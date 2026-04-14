import { NextRequest, NextResponse } from 'next/server';
import { getOrder, markOrderPaidIfPending } from '@/lib/db';
import { isSandboxMode, ZPAY_CONFIG } from '@/lib/payment-config';
import { getZpayChannelByPaymentMethod, parseZpayAmountToCents, queryZpayOrderByOutTradeNo } from '@/lib/zpay';

function canQueryZpayOrderStatus(): boolean {
  return Boolean(ZPAY_CONFIG.pid && ZPAY_CONFIG.key);
}

async function reconcilePendingZpayOrder(orderId: string) {
  const providerOrder = await queryZpayOrderByOutTradeNo(orderId);
  if (!providerOrder) {
    return false;
  }

  const latestOrder = getOrder(orderId);
  if (!latestOrder || latestOrder.status !== 'pending') {
    return latestOrder?.status === 'paid';
  }

  const expectedType = latestOrder.payment_method ? getZpayChannelByPaymentMethod(latestOrder.payment_method) : undefined;
  const providerAmount = parseZpayAmountToCents(providerOrder.money);

  if (
    providerOrder.outTradeNo !== orderId ||
    providerOrder.status !== 1 ||
    providerOrder.pid !== ZPAY_CONFIG.pid ||
    providerAmount == null ||
    providerAmount !== latestOrder.amount ||
    (expectedType != null && providerOrder.type != null && providerOrder.type !== expectedType)
  ) {
    return false;
  }

  markOrderPaidIfPending(orderId, {
    paymentMethod: latestOrder.payment_method,
    transactionId: providerOrder.tradeNo,
  });

  return getOrder(orderId)?.status === 'paid';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: '缺少订单ID' },
      { status: 400 }
    );
  }

  let order = getOrder(orderId);

  if (!order) {
    return NextResponse.json(
      { error: '订单不存在' },
      { status: 404 }
    );
  }

  const isPendingZpayOrder = order.status === 'pending' && (order.payment_method === 'wechat' || order.payment_method === 'alipay' || order.payment_method == null);

  if (!isSandboxMode() && isPendingZpayOrder && canQueryZpayOrderStatus()) {
    try {
      const reconciled = await reconcilePendingZpayOrder(orderId);
      if (reconciled) {
        order = getOrder(orderId);
      }
    } catch (error) {
      console.error('ZPAY payment reconciliation failed:', error);
    }
  }

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
