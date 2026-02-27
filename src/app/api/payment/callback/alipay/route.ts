import { NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/payment-config';

export async function POST() {
  if (isSandboxMode()) {
    return new NextResponse('SANDBOX MODE', { status: 200 });
  }

  // TODO: Production Alipay callback handling
  // 1. Parse form data
  // 2. Verify signature
  // 3. Update order status
  // 4. Return success response

  return new NextResponse('success', { status: 200 });
}
