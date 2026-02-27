import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { registerFonts } from '@/lib/pdf-fonts';
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
  testType: TestType;
  resultData: MBTIResultData | IQResultData | CareerResultData;
}

// Helper to render PDF with proper typing
async function renderPdf(element: React.ReactElement): Promise<Uint8Array> {
  const buffer = await renderToBuffer(element as React.ReactElement<DocumentProps>);
  return new Uint8Array(buffer);
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { testType, resultData } = body;

    if (!testType || !resultData) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    let pdfBuffer: Uint8Array;
    let filename: string;
    const timestamp = Date.now();

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
        filename = `xinli-report-mbti-${timestamp}.pdf`;
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
        filename = `xinli-report-iq-${timestamp}.pdf`;
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
        filename = `xinli-report-career-${timestamp}.pdf`;
        break;
      }
      default:
        return NextResponse.json(
          { error: '无效的测试类型' },
          { status: 400 }
        );
    }

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF生成失败' },
      { status: 500 }
    );
  }
}
