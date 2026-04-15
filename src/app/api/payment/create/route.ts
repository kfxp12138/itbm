import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createOrder, updateOrderStatus } from '@/lib/db';
import { formatPrice, getTestName, getTestPrice, getZpayConfigErrors, isSandboxMode } from '@/lib/payment-config';
import { createZpayOrder, getZpayChannelByPaymentMethod } from '@/lib/zpay';

function getClientIp(request: NextRequest): string {
  const normalizeIp = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const withoutPort = trimmed.replace(/^\[(.*)\](:\d+)?$/, '$1').replace(/:\d+$/, '');
    const ipv4Match = withoutPort.match(/(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)/);
    if (ipv4Match?.[0]) {
      return ipv4Match[0];
    }

    if (withoutPort === '::1' || withoutPort.toLowerCase() === 'localhost') {
      return '127.0.0.1';
    }

    return null;
  };

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [firstIp] = forwarded.split(',');
    if (firstIp?.trim()) {
      const normalized = normalizeIp(firstIp);
      if (normalized) {
        return normalized;
      }
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) {
    const normalized = normalizeIp(realIp);
    if (normalized) {
      return normalized;
    }
  }

  return '127.0.0.1';
}

function getZpayDevice(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  return /android|iphone|ipad|ipod|mobile|windows phone/.test(userAgent) ? 'mobile' : 'pc';
}

interface CreatePaymentRequest {
  testType: 'mbti' | 'iq' | 'career';
  paymentMethod: 'wechat';
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
    if (paymentMethod !== 'wechat') {
        return NextResponse.json(
        { error: '当前仅开放微信支付。' },
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
            error: `微信支付配置不完整：${configErrors.join('、')}`,
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
        payment_provider: 'zpay',
        result_data: resultData,
      });

      try {
        const nativeOrder = await createZpayOrder({
          clientIp: getClientIp(request),
          device: getZpayDevice(request),
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
          expiresAt: nativeOrder.expiresAt,
          h5Url: nativeOrder.h5Url,
          mode: 'production',
          paymentMethod,
          wechatInAppUrl: nativeOrder.wechatInAppUrl,
        });
      } catch (error) {
        updateOrderStatus(orderId, 'failed', { paymentProvider: 'zpay' });
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
      payment_provider: 'zpay',
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
