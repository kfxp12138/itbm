import { NextRequest, NextResponse } from 'next/server';
import { getOrder, markOrderPaidIfPending } from '@/lib/db';
import { isEmailServiceConfigured, isSandboxMode } from '@/lib/payment-config';
import {
  buildWechatCallbackFailureResponse,
  buildWechatCallbackSuccessResponse,
  parseWechatPaymentNotification,
  verifyWechatPaymentNotification,
} from '@/lib/wechat-pay';
import { sendTestResultEmail, type TestType } from '@/lib/send-email';

function createWechatXmlResponse(xml: string, status = 200) {
  return new NextResponse(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

export async function POST(request: NextRequest) {
  if (isSandboxMode()) {
    return createWechatXmlResponse(buildWechatCallbackSuccessResponse());
  }

  const rawBody = await request.text();

  try {
    const payment = parseWechatPaymentNotification(rawBody);

    if (!verifyWechatPaymentNotification(payment)) {
      return createWechatXmlResponse(buildWechatCallbackFailureResponse('验签失败'), 401);
    }

    if (payment.return_code !== 'SUCCESS' || payment.result_code !== 'SUCCESS') {
      return createWechatXmlResponse(buildWechatCallbackSuccessResponse());
    }

    const order = getOrder(payment.out_trade_no);

    if (!order) {
      console.warn('WeChat callback received for unknown order:', payment.out_trade_no);
      return createWechatXmlResponse(buildWechatCallbackSuccessResponse());
    }

    if (payment.mch_id !== process.env.WECHAT_MCH_ID || payment.appid !== process.env.WECHAT_APP_ID) {
      return createWechatXmlResponse(buildWechatCallbackFailureResponse('商户信息不匹配'), 400);
    }

    const totalFee = Number(payment.total_fee);
    if (!Number.isFinite(totalFee) || totalFee !== order.amount) {
      return createWechatXmlResponse(buildWechatCallbackFailureResponse('金额不匹配'), 400);
    }

    const wasMarkedPaid = markOrderPaidIfPending(order.id, {
      paymentMethod: 'wechat',
      transactionId: payment.transaction_id || undefined,
    });

    if (wasMarkedPaid && order.email && order.result_data && isEmailServiceConfigured()) {
      try {
        const resultData = JSON.parse(order.result_data);
        sendTestResultEmail({
          to: order.email,
          testType: order.test_type as TestType,
          resultData,
          orderId: order.id,
        }).catch((sendError) => console.error('WeChat callback email send failed:', sendError));
      } catch (parseError) {
        console.error('Failed to parse result_data for WeChat callback email:', parseError);
      }
    }

    return createWechatXmlResponse(buildWechatCallbackSuccessResponse());
  } catch (error) {
    console.error('WeChat callback handling error:', error);
    return createWechatXmlResponse(buildWechatCallbackFailureResponse('处理失败'), 500);
  }
}
