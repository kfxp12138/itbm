import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrderStatus } from '@/lib/db';
import { isSandboxMode, RESEND_CONFIG } from '@/lib/payment-config';

interface SandboxConfirmRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  // Only allow in sandbox mode
  if (!isSandboxMode()) {
    return NextResponse.json(
      { error: '此接口仅在沙盒模式下可用' },
      { status: 403 }
    );
  }

  try {
    const body: SandboxConfirmRequest = await request.json();
    const { orderId } = body;

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

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: '订单状态无效，无法确认支付' },
        { status: 400 }
      );
    }

    // Update order status to paid
    updateOrderStatus(orderId, 'paid');

    // Send email if configured and email exists
    if (order.email && RESEND_CONFIG.apiKey) {
      try {
        const resultData = order.result_data ? JSON.parse(order.result_data) : null;
        if (resultData) {
          // Fire and forget - don't block the response
          fetch(new URL('/api/email/send', request.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: order.email,
              testType: order.test_type,
              resultData,
              orderId,
            }),
          }).catch((err) => console.error('Email send failed:', err));
        }
      } catch (err) {
        console.error('Failed to parse result_data for email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      testType: order.test_type,
    });
  } catch (error) {
    console.error('Sandbox confirm error:', error);
    return NextResponse.json(
      { error: '确认支付失败' },
      { status: 500 }
    );
  }
}
