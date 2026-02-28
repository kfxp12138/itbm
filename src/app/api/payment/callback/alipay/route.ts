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

  // TODO: Production Alipay callback handling
  // 1. Parse form data
  // 2. Verify signature
  // 3. Update order status
  // 4. Send email notification
  // 5. Return success response

  // Example implementation (uncomment when ready):
  // const orderId = extractOrderIdFromForm(formData);
  // updateOrderStatus(orderId, 'paid', { paymentMethod: 'alipay', transactionId: '...' });
  // await sendResultEmail(request, orderId);

  return new NextResponse('success', { status: 200 });
}
