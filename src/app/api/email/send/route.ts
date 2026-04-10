import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { registerFonts } from '@/lib/pdf-fonts';
import { RESEND_CONFIG, TEST_NAMES } from '@/lib/payment-config';
import { MBTIReport } from '@/components/pdf/MBTIReport';
import { IQReport } from '@/components/pdf/IQReport';
import { CareerReport } from '@/components/pdf/CareerReport';

// Register fonts on module load
registerFonts();

interface MBTIResultData {
  type: string;
  typeName: string;
  epithet: string;
  description: string;
  counts: Record<string, number>;
  generalTraits: string[];
  strengths: string[];
  tenRulesToLive: string[];
}

interface IQResultData {
  score: number;
  correctCount: number;
  age: number;
  level: string;
  description: string;
  timestamp: number;
}

interface CareerResultData {
  mbtiType: string;
  mbtiTypeName: string;
  ffmScores: Array<{ trait: string; percentage: number }>;
  careers: string[];
}

type TestType = 'mbti' | 'iq' | 'career';

interface RequestBody {
  to: string;
  testType: TestType;
  resultData: MBTIResultData | IQResultData | CareerResultData;
  orderId?: string;
}

// Helper to render PDF with proper typing
async function renderPdf(element: React.ReactElement): Promise<Buffer> {
  return renderToBuffer(element as React.ReactElement<DocumentProps>);
}

function generateEmailHtml(testType: TestType, resultData: MBTIResultData | IQResultData | CareerResultData): string {
  const testName = TEST_NAMES[testType] || testType;
  let summary = '';

  switch (testType) {
    case 'mbti': {
      const data = resultData as MBTIResultData;
      summary = `
        <p><strong>人格类型：</strong>${data.type} - ${data.typeName}</p>
        <p><strong>特征描述：</strong>${data.epithet}</p>
      `;
      break;
    }
    case 'iq': {
      const data = resultData as IQResultData;
      summary = `
        <p><strong>IQ分数：</strong>${data.score}</p>
        <p><strong>智力等级：</strong>${data.level}</p>
        <p><strong>正确题数：</strong>${data.correctCount}/60</p>
      `;
      break;
    }
    case 'career': {
      const data = resultData as CareerResultData;
      summary = `
        <p><strong>职业性格类型：</strong>${data.mbtiType} - ${data.mbtiTypeName}</p>
        <p><strong>推荐职业数量：</strong>${data.careers.length}个</p>
      `;
      break;
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">礼至测途-在线潜能测试平台</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0;">您的${testName}报告已生成</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #374151; margin-top: 0;">测试结果摘要</h2>
        ${summary}
        
        <div style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280;">
            📎 完整的测试报告已作为PDF附件发送，请查收。
          </p>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          礼至测途-在线潜能测试平台<br>
          湖南礼至文化传播有限公司 · 湘ICP备2024048825号
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!RESEND_CONFIG.apiKey) {
      return NextResponse.json(
        { error: '邮件服务未配置' },
        { status: 503 }
      );
    }

    const body: RequestBody = await request.json();
    const { to, testType, resultData, orderId } = body;

    if (!to || !testType || !resultData) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: '邮箱格式无效' },
        { status: 400 }
      );
    }

    // Generate PDF
    let pdfBuffer: Buffer;

    switch (testType) {
      case 'mbti': {
        const data = resultData as MBTIResultData;
        pdfBuffer = await renderPdf(
          React.createElement(MBTIReport, {
            type: data.type,
            typeName: data.typeName,
            epithet: data.epithet,
            description: data.description,
            counts: data.counts,
            generalTraits: data.generalTraits,
            strengths: data.strengths,
            tenRulesToLive: data.tenRulesToLive,
          })
        );
        break;
      }
      case 'iq': {
        const data = resultData as IQResultData;
        pdfBuffer = await renderPdf(
          React.createElement(IQReport, {
            score: data.score,
            correctCount: data.correctCount,
            age: data.age,
            level: data.level,
            description: data.description,
            timestamp: data.timestamp,
          })
        );
        break;
      }
      case 'career': {
        const data = resultData as CareerResultData;
        pdfBuffer = await renderPdf(
          React.createElement(CareerReport, {
            mbtiType: data.mbtiType,
            mbtiTypeName: data.mbtiTypeName,
            ffmScores: data.ffmScores,
            careers: data.careers,
          })
        );
        break;
      }
      default:
        return NextResponse.json(
          { error: '无效的测试类型' },
          { status: 400 }
        );
    }

    const testName = TEST_NAMES[testType] || testType;

    // Initialize Resend client
    const resend = new Resend(RESEND_CONFIG.apiKey);

    // Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: RESEND_CONFIG.fromEmail,
      to: to,
      subject: `你的${testName}测试报告 — 礼至测途-在线潜能测试平台`,
      html: generateEmailHtml(testType, resultData),
      attachments: [
        {
          filename: `lizhice-report-${testType}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: '邮件发送失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      orderId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: '邮件发送失败' },
      { status: 500 }
    );
  }
}
