import { NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/payment-config';

export async function POST() {
  if (isSandboxMode()) {
    return new NextResponse('SANDBOX MODE', { status: 200 });
  }

  // TODO: Production WeChat Pay callback handling
  // 1. Parse XML body
  // 2. Verify signature
  // 3. Update order status
  // 4. Return success response

  return new NextResponse(
    '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
    {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    }
  );
}
