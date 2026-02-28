import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, RESEND_CONFIG } from '@/lib/payment-config';
import { getOrder, updateOrderStatus } from '@/lib/db';

// Helper to send email after successful payment
async function sendResultEmail(request: NextRequest, orderId: string) {
  const order = getOrder(orderId);
  if (!order?.email || !RESEND_CONFIG.apiKey) return;

  try {
    const resultData = order.result_data ? JSON.parse(order.result_data) : null;
    if (resultData) {
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

export async function POST(request: NextRequest) {
  if (isSandboxMode()) {
    return new NextResponse('SANDBOX MODE', { status: 200 });
  }

  // TODO: Production WeChat Pay callback handling
  // 1. Parse XML body
  // 2. Verify signature
  // 3. Update order status
  // 4. Send email notification
  // 5. Return success response

  // Example implementation (uncomment when ready):
  // const orderId = extractOrderIdFromXml(body);
  // updateOrderStatus(orderId, 'paid', { paymentMethod: 'wechat', transactionId: '...' });
  // await sendResultEmail(request, orderId);

  return new NextResponse(
    '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
    {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    }
  );
}
