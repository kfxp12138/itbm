import { NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/payment-config';
// import { getOrder, updateOrderStatus } from '@/lib/db';
// import { sendTestResultEmail, TestType } from '@/lib/send-email';

export async function POST() {
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
  // const order = getOrder(orderId);
  // updateOrderStatus(orderId, 'paid', { paymentMethod: 'alipay', transactionId: '...' });
  // if (order?.email && order.result_data) {
  //   sendTestResultEmail({
  //     to: order.email,
  //     testType: order.test_type as TestType,
  //     resultData: JSON.parse(order.result_data),
  //     orderId,
  //   }).catch(console.error);
  // }

  return new NextResponse('success', { status: 200 });
}
