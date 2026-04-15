import { NextRequest, NextResponse } from 'next/server';
import { getOrder, markOrderPaidIfPending } from '@/lib/db';
import { isSandboxMode, WECHAT_CONFIG, ZPAY_CONFIG } from '@/lib/payment-config';
import { queryWechatOrderByOutTradeNo } from '@/lib/wechat-pay';
import { getZpayChannelByPaymentMethod, parseZpayAmountToCents, queryZpayOrderByOutTradeNo } from '@/lib/zpay';

function canQueryZpayOrderStatus(): boolean {
  return Boolean(ZPAY_CONFIG.pid && ZPAY_CONFIG.key);
}

function canQueryWechatOrderStatus(): boolean {
  return Boolean(WECHAT_CONFIG.appId && WECHAT_CONFIG.mchId && WECHAT_CONFIG.apiKey);
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

async function reconcilePendingWechatJsapiOrder(orderId: string) {
  const providerOrder = await queryWechatOrderByOutTradeNo(orderId);
  if (!providerOrder) {
    return false;
  }

  const latestOrder = getOrder(orderId);
  if (!latestOrder || latestOrder.status !== 'pending') {
    return latestOrder?.status === 'paid';
  }

  if (
    providerOrder.outTradeNo !== orderId ||
    providerOrder.tradeState !== 'SUCCESS' ||
    providerOrder.appId !== WECHAT_CONFIG.appId ||
    providerOrder.mchId !== WECHAT_CONFIG.mchId ||
    providerOrder.totalFee == null ||
    providerOrder.totalFee !== latestOrder.amount
  ) {
    return false;
  }

  markOrderPaidIfPending(orderId, {
    paymentMethod: 'wechat',
    paymentProvider: 'wechat_jsapi',
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

  const paymentProvider = order.payment_provider || 'zpay';

  if (!isSandboxMode() && order.status === 'pending') {
    if (paymentProvider === 'wechat_jsapi' && canQueryWechatOrderStatus()) {
      try {
        const reconciled = await reconcilePendingWechatJsapiOrder(orderId);
        if (reconciled) {
          order = getOrder(orderId);
        }
      } catch (error) {
        console.error('WeChat JSAPI payment reconciliation failed:', error);
      }
    } else if ((paymentProvider === 'zpay' || order.payment_provider == null) && canQueryZpayOrderStatus()) {
      try {
        const reconciled = await reconcilePendingZpayOrder(orderId);
        if (reconciled) {
          order = getOrder(orderId);
        }
      } catch (error) {
        console.error('ZPAY payment reconciliation failed:', error);
      }
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
