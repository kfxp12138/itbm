import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import nodemailer from 'nodemailer';
import React from 'react';
import { registerFonts } from '@/lib/pdf-fonts';
import { EMAIL_CONFIG, TEST_NAMES, isEmailServiceConfigured } from '@/lib/payment-config';
import { MBTIReport } from '@/components/pdf/MBTIReport';
import { IQReport } from '@/components/pdf/IQReport';
import { CareerReport } from '@/components/pdf/CareerReport';
import { getMBTITypeDescription } from '@/lib/mbti-scoring';
import { getIQDescription } from '@/lib/iq-scoring';
import { mbtiCareers } from '@/data/career-data';

// Register fonts on module load
registerFonts();

function createTransporter() {
  return nodemailer.createTransport({
    auth: {
      pass: EMAIL_CONFIG.pass,
      user: EMAIL_CONFIG.user,
    },
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    requireTLS: !EMAIL_CONFIG.secure,
    secure: EMAIL_CONFIG.secure,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      servername: EMAIL_CONFIG.host,
    },
  });
}

// Full data interfaces (what PDF components expect)
export interface MBTIResultData {
  type: string;
  typeName: string;
  epithet: string;
  description: string;
  counts: Record<string, number>;
  generalTraits: string[];
  strengths: string[];
  tenRulesToLive: string[];
}

export interface IQResultData {
  score: number;
  correctCount: number;
  age: number;
  level: string;
  description: string;
  timestamp: number;
}

export interface CareerResultData {
  mbtiType: string;
  mbtiTypeName: string;
  ffmScores: Array<{ trait: string; percentage: number }>;
  careers: string[];
}

// Partial data interfaces (what localStorage stores)
interface PartialMBTIData {
  type: string;
  counts: Record<string, number>;
}

interface PartialIQData {
  score: number;
  correctCount: number;
  age: number;
  timestamp?: number;
}

interface PartialCareerData {
  mbtiType: string;
  mbtiTypeName?: string;
  ffmScores: Array<{ trait: string; percentage: number }>;
  careers: string[];
}

export type TestType = 'mbti' | 'iq' | 'career';
export type ResultData = MBTIResultData | IQResultData | CareerResultData;

// Enrich partial data with full details from type definitions
function enrichMBTIData(partial: PartialMBTIData): MBTIResultData {
  const typeInfo = getMBTITypeDescription(partial.type);
  return {
    type: partial.type,
    typeName: typeInfo?.name ?? partial.type,
    epithet: typeInfo?.epithet ?? '',
    description: typeInfo?.description ?? '',
    counts: partial.counts,
    generalTraits: typeInfo?.generalTraits ?? [],
    strengths: typeInfo?.strengths ?? [],
    tenRulesToLive: typeInfo?.tenRulesToLive ?? [],
  };
}

function enrichIQData(partial: PartialIQData): IQResultData {
  const { level, description } = getIQDescription(partial.score);
  return {
    score: partial.score,
    correctCount: partial.correctCount,
    age: partial.age,
    level,
    description,
    timestamp: partial.timestamp ?? Date.now(),
  };
}

function enrichCareerData(partial: PartialCareerData): CareerResultData {
  const careerMatch = mbtiCareers.find(c => c.type === partial.mbtiType);
  return {
    mbtiType: partial.mbtiType,
    mbtiTypeName: partial.mbtiTypeName ?? careerMatch?.typeName ?? '',
    ffmScores: partial.ffmScores,
    careers: partial.careers,
  };
}

// Helper to render PDF with proper typing
async function renderPdf(element: React.ReactElement): Promise<Buffer> {
  return renderToBuffer(element as React.ReactElement<DocumentProps>);
}

function generateEmailHtml(testType: TestType, resultData: ResultData): string {
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

export interface SendEmailParams {
  to: string;
  testType: TestType;
  resultData: unknown; // Accept partial data, will be enriched
  orderId?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendTestResultEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, testType, orderId } = params;
  const { resultData } = params;

  if (!isEmailServiceConfigured()) {
    return { success: false, error: '邮件服务未配置' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: '邮箱格式无效' };
  }

  if (!resultData || typeof resultData !== 'object') {
    return { success: false, error: '结果数据无效' };
  }

  try {
    // Generate PDF
    let pdfBuffer: Buffer;
    let enrichedData: ResultData;

    switch (testType) {
      case 'mbti': {
        const partial = resultData as PartialMBTIData;
        if (!partial.type || !partial.counts) {
          return { success: false, error: 'MBTI数据不完整' };
        }
        enrichedData = enrichMBTIData(partial);
        const data = enrichedData as MBTIResultData;
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
        const partial = resultData as PartialIQData;
        if (typeof partial.score !== 'number' || typeof partial.correctCount !== 'number') {
          return { success: false, error: 'IQ数据不完整' };
        }
        enrichedData = enrichIQData(partial);
        const data = enrichedData as IQResultData;
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
        const partial = resultData as PartialCareerData;
        if (!partial.mbtiType || !partial.ffmScores || !partial.careers) {
          return { success: false, error: '职业测试数据不完整' };
        }
        enrichedData = enrichCareerData(partial);
        const data = enrichedData as CareerResultData;
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
        return { success: false, error: '无效的测试类型' };
    }

    const testName = TEST_NAMES[testType] || testType;

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.fromEmail,
      to: to,
      subject: `你的${testName}测试报告 — 礼至测途-在线潜能测试平台`,
      html: generateEmailHtml(testType, enrichedData),
      attachments: [
        {
          filename: `lizhice-report-${testType}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}, orderId: ${orderId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: '邮件发送失败' };
  }
}
