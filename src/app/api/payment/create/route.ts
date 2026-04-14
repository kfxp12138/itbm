import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createOrder, updateOrderStatus } from '@/lib/db';
import { formatPrice, getTestName, getTestPrice, getZpayConfigErrors, isSandboxMode } from '@/lib/payment-config';
import { createZpayOrder, getZpayChannelByPaymentMethod } from '@/lib/zpay';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [firstIp] = forwarded.split(',');
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

interface CreatePaymentRequest {
  testType: 'mbti' | 'iq' | 'career';
  paymentMethod: 'wechat' | 'alipay';
  email?: string;
  resultData?: string;
}

function createShortOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `ORD${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { testType, paymentMethod, email, resultData } = body;

    // Validate testType
    if (!['mbti', 'iq', 'career'].includes(testType)) {
      return NextResponse.json(
        { error: '无效的测试类型' },
        { status: 400 }
      );
    }

    // Validate paymentMethod
    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: '无效的支付方式' },
        { status: 400 }
      );
    }

    if (!resultData?.trim()) {
      return NextResponse.json(
        { error: '未找到待支付的测试结果，请重新完成测试后再发起支付。' },
        { status: 400 }
      );
    }

    const orderId = createShortOrderId();
    const amount = getTestPrice(testType);

    if (!isSandboxMode()) {
      const configErrors = getZpayConfigErrors();

      if (configErrors.length > 0) {
        return NextResponse.json(
          {
            error: `ZPAY 配置不完整：${configErrors.join('、')}`,
            mode: 'production',
          },
          { status: 400 }
        );
      }

      createOrder({
        id: orderId,
        test_type: testType,
        amount,
        email,
        payment_method: paymentMethod,
        result_data: resultData,
      });

      try {
        const nativeOrder = await createZpayOrder({
          clientIp: getClientIp(request),
          description: `${getTestName(testType)}结果解锁`,
          notifyUrl: undefined,
          outTradeNo: orderId,
          total: amount,
          type: getZpayChannelByPaymentMethod(paymentMethod),
        });

        return NextResponse.json({
          orderId,
          amount,
          amountDisplay: formatPrice(amount),
          codeUrl: nativeOrder.codeUrl,
          expiresAt: nativeOrder.expiresAt,
          mode: 'production',
          paymentMethod,
        });
      } catch (error) {
        updateOrderStatus(orderId, 'failed');
        throw error;
      }
    }

    // Create order in DB
    createOrder({
      id: orderId,
      test_type: testType,
      amount,
      email,
      payment_method: paymentMethod,
      result_data: resultData,
    });

    if (isSandboxMode()) {
      return NextResponse.json({
        orderId,
        amount,
        amountDisplay: formatPrice(amount),
        redirectUrl: `/payment/sandbox?orderId=${orderId}`,
        mode: 'sandbox',
      });
    }

    return NextResponse.json(
      {
        orderId,
        amount,
        amountDisplay: formatPrice(amount),
        mode: 'production',
        message: '当前生产环境支付通道暂不可用。',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    );
  }
}
