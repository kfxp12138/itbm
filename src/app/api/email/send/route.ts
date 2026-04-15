import { NextRequest, NextResponse } from 'next/server';
import { isEmailServiceConfigured } from '@/lib/payment-config';
import { sendTestResultEmail, type TestType } from '@/lib/send-email';

interface RequestBody {
  to: string;
  testType: TestType;
  resultData: unknown;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!isEmailServiceConfigured()) {
      return NextResponse.json({ error: '邮件服务未配置' }, { status: 503 });
    }

    const body: RequestBody = await request.json();
    const { to, testType, resultData, orderId } = body;

    if (!to || !testType || !resultData) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const result = await sendTestResultEmail({
      to,
      testType,
      resultData,
      orderId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || '邮件发送失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      orderId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: '邮件发送失败' }, { status: 500 });
  }
}
