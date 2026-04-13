import { NextRequest, NextResponse } from 'next/server';
import { getOrder, markOrderPaidIfPending } from '@/lib/db';
import { isSandboxMode, WECHAT_CONFIG } from '@/lib/payment-config';
import { queryWechatOrderByOutTradeNo } from '@/lib/wechat-pay';

function canQueryWechatOrderStatus(): boolean {
  return Boolean(WECHAT_CONFIG.appId && WECHAT_CONFIG.mchId && WECHAT_CONFIG.apiKey);
}

async function reconcilePendingWechatOrder(orderId: string) {
  const providerOrder = await queryWechatOrderByOutTradeNo(orderId);
  if (!providerOrder) {
    return false;
  }

  if (
    providerOrder.outTradeNo !== orderId ||
    providerOrder.tradeState !== 'SUCCESS' ||
    providerOrder.appId !== WECHAT_CONFIG.appId ||
    providerOrder.mchId !== WECHAT_CONFIG.mchId
  ) {
    return false;
  }

  const latestOrder = getOrder(orderId);
  if (!latestOrder || latestOrder.status !== 'pending') {
    return latestOrder?.status === 'paid';
  }

  if (providerOrder.totalFee !== latestOrder.amount) {
    return false;
  }

  markOrderPaidIfPending(orderId, {
    paymentMethod: 'wechat',
    transactionId: providerOrder.transactionId,
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

  const isPendingWechatOrder = order.status === 'pending' && (order.payment_method === 'wechat' || order.payment_method == null);

  if (!isSandboxMode() && isPendingWechatOrder && canQueryWechatOrderStatus()) {
    try {
      const reconciled = await reconcilePendingWechatOrder(orderId);
      if (reconciled) {
        order = getOrder(orderId);
      }
    } catch (error) {
      console.error('WeChat payment reconciliation failed:', error);
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
