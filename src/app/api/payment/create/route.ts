import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createOrder } from '@/lib/db';
import { createWechatNativeOrder } from '@/lib/wechat-pay';
import { formatPrice, getTestName, getTestPrice, getWechatNativeConfigErrors, isSandboxMode } from '@/lib/payment-config';

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

    if (!isSandboxMode() && paymentMethod === 'alipay') {
      return NextResponse.json(
        {
          error: '当前生产环境仅开放微信原生扫码支付，支付宝暂未开放。',
          mode: 'production',
        },
        { status: 501 }
      );
    }

    if (!isSandboxMode() && paymentMethod === 'wechat') {
      const configErrors = getWechatNativeConfigErrors();

      if (configErrors.length > 0) {
        return NextResponse.json(
          {
            error: `微信支付配置不完整：${configErrors.join('、')}`,
            mode: 'production',
          },
          { status: 400 }
        );
      }

      const nativeOrder = await createWechatNativeOrder({
        description: `${getTestName(testType)}结果解锁`,
        outTradeNo: orderId,
        productId: orderId,
        spbillCreateIp: getClientIp(request),
        total: amount,
      });

      createOrder({
        id: orderId,
        test_type: testType,
        amount,
        email,
        payment_method: paymentMethod,
        result_data: resultData,
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
        message: '当前仅接入微信原生扫码支付，支付宝暂未开放。',
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
