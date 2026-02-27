import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createOrder } from '@/lib/db';
import { getTestPrice, isSandboxMode, formatPrice } from '@/lib/payment-config';

interface CreatePaymentRequest {
  testType: 'mbti' | 'iq' | 'career';
  paymentMethod: 'wechat' | 'alipay';
  email?: string;
  resultData?: string;
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

    const orderId = uuidv4();
    const amount = getTestPrice(testType);

    // Create order in DB
    createOrder({
      id: orderId,
      test_type: testType,
      amount,
      email,
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

    // Production mode - not yet implemented
    return NextResponse.json(
      {
        orderId,
        amount,
        amountDisplay: formatPrice(amount),
        mode: 'production',
        message: '生产环境支付接口待接入',
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
