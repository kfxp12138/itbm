import { NextRequest, NextResponse } from 'next/server';
import { getOrder, markOrderPaidIfPending } from '@/lib/db';
import { isEmailServiceConfigured, isSandboxMode, ZPAY_CONFIG } from '@/lib/payment-config';
import { sendTestResultEmail, type TestType } from '@/lib/send-email';
import { getZpayChannelByPaymentMethod, parseZpayAmountToCents, readZpayCallbackParams, verifyZpaySignature } from '@/lib/zpay';

function createPlainTextResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    return createPlainTextResponse('success');
  }

  try {
    const payment = readZpayCallbackParams(request.url);

    if (!payment.out_trade_no || !payment.pid) {
      return createPlainTextResponse('fail', 400);
    }

    if (!verifyZpaySignature({ ...payment }, payment.sign)) {
      return createPlainTextResponse('fail', 401);
    }

    if (payment.trade_status !== 'TRADE_SUCCESS') {
      return createPlainTextResponse('success');
    }

    const order = getOrder(payment.out_trade_no);
    if (!order) {
      console.warn('ZPAY callback received for unknown order:', payment.out_trade_no);
      return createPlainTextResponse('success');
    }

    if (payment.pid !== ZPAY_CONFIG.pid) {
      return createPlainTextResponse('fail', 400);
    }

    const amountInCents = parseZpayAmountToCents(payment.money);
    if (amountInCents == null || amountInCents !== order.amount) {
      return createPlainTextResponse('fail', 400);
    }

    const expectedType = order.payment_method ? getZpayChannelByPaymentMethod(order.payment_method) : undefined;
    if (expectedType && payment.type && payment.type !== expectedType) {
      return createPlainTextResponse('fail', 400);
    }

    const wasMarkedPaid = markOrderPaidIfPending(order.id, {
      paymentMethod: order.payment_method,
      transactionId: payment.trade_no,
    });

    if (wasMarkedPaid && order.email && order.result_data && isEmailServiceConfigured()) {
      try {
        const resultData = JSON.parse(order.result_data);
        sendTestResultEmail({
          to: order.email,
          testType: order.test_type as TestType,
          resultData,
          orderId: order.id,
        }).catch((sendError) => console.error('ZPAY callback email send failed:', sendError));
      } catch (parseError) {
        console.error('Failed to parse result_data for ZPAY callback email:', parseError);
      }
    }

    return createPlainTextResponse('success');
  } catch (error) {
    console.error('ZPAY callback handling error:', error);
    return createPlainTextResponse('fail', 500);
  }
}
