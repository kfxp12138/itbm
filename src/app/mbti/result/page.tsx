'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMBTITypeDescription, normalizeMBTIResult, type MBTIResult } from '@/lib/mbti-scoring';
import type { MBTIType } from '@/data/mbti-types';

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white/90 backdrop-blur">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {title}
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? <div className="px-4 pb-4 text-gray-600 leading-relaxed">{children}</div> : null}
    </div>
  );
}

function DimensionBar({ result }: { result: MBTIResult['dimensions'][number] }) {
  return (
    <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{result.title}</p>
          <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700 border border-violet-200">
          {result.dominantPole} 倾向 {result.strengthPercentage}%
        </div>
      </div>

      <div className="flex justify-between text-sm mb-2 text-gray-600">
        <span className={result.leftPercentage >= result.rightPercentage ? 'font-semibold text-violet-800' : ''}>
          {result.leftPole} · {result.leftPercentage}%
        </span>
        <span className={result.rightPercentage > result.leftPercentage ? 'font-semibold text-fuchsia-800' : ''}>
          {result.rightPole} · {result.rightPercentage}%
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden bg-white mb-4">
        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500" style={{ width: `${result.leftPercentage}%` }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-2xl bg-white px-4 py-3 border border-violet-100">
          <p className="text-xs text-violet-500 mb-1">左侧描述</p>
          <p className="text-gray-800 leading-6">{result.leftLabel}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 border border-fuchsia-100">
          <p className="text-xs text-fuchsia-500 mb-1">右侧描述</p>
          <p className="text-gray-800 leading-6">{result.rightLabel}</p>
        </div>
      </div>
    </div>
  );
}

function parseResultPayload(raw: string | null): MBTIResult | null {
  if (!raw) {
    return null;
  }

  try {
    return normalizeMBTIResult(JSON.parse(raw));
  } catch {
    return null;
  }
}

function MBTIResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<MBTIResult | null>(null);
  const [typeInfo, setTypeInfo] = useState<MBTIType | undefined>(undefined);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadLocalResult = () => {
      const parsed = parseResultPayload(localStorage.getItem('mbti_latest_result'));

      if (!parsed) {
        return false;
      }

      setResult(parsed);
      setTypeInfo(getMBTITypeDescription(parsed.type));
      return true;
    };

    const verifyAndLoad = async () => {
      if (!orderId) {
        loadLocalResult();
        return;
      }

      setVerifying(true);

      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = (await response.json()) as { isPaid?: boolean; resultData?: string };

        if (!data.isPaid) {
          router.push('/payment?testType=mbti');
          return;
        }

        const parsed = parseResultPayload(data.resultData ?? null);

        if (parsed) {
          setResult(parsed);
          setTypeInfo(getMBTITypeDescription(parsed.type));
          return;
        }

        if (!loadLocalResult()) {
          router.push('/payment?testType=mbti');
        }
      } catch {
        if (!loadLocalResult()) {
          router.push('/payment?testType=mbti');
        }
      } finally {
        setVerifying(false);
      }
    };

    void verifyAndLoad();
  }, [orderId, router]);

  const averageStrength = useMemo(() => {
    if (!result) {
      return 0;
    }

    return Math.round(result.dimensions.reduce((sum, dimension) => sum + dimension.strengthPercentage, 0) / result.dimensions.length);
  }, [result]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(135deg,_#f7f4ff,_#ede9fe_42%,_#f8fafc)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center text-gray-600">验证支付中...</div>
      </div>
    );
  }

  if (!result || !typeInfo) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(135deg,_#f7f4ff,_#ede9fe_42%,_#f8fafc)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),_transparent_30%),linear-gradient(180deg,_#f8f5ff_0%,_#f5f3ff_35%,_#ffffff_100%)] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/92 backdrop-blur shadow-xl p-6 sm:p-8 lg:p-10 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-transparent" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.28em] text-violet-500 mb-3">MBTI 结果概览</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-gray-500 mb-2">你的核心类型</p>
                <div className="text-4xl sm:text-6xl font-bold text-violet-600 mb-3 tracking-[0.18em]">{result.type}</div>
                <div className="text-xl text-gray-800 mb-1">{typeInfo.epithet}</div>
                <div className="text-sm text-gray-400">{typeInfo.name}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 min-w-full lg:min-w-[380px]">
                <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4">
                  <p className="text-xs text-violet-500 mb-1">完成题数</p>
                  <p className="text-lg font-semibold text-violet-900">{result.completedQuestions}/{result.totalQuestions}</p>
                </div>
                <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-4">
                  <p className="text-xs text-fuchsia-500 mb-1">平均倾向强度</p>
                  <p className="text-lg font-semibold text-fuchsia-900">{averageStrength}%</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs text-gray-500 mb-1">结果说明</p>
                  <p className="text-sm font-medium text-gray-800 leading-6">4 个维度综合而成，仍保留经典 16 型输出。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/92 backdrop-blur shadow-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">人格描述</h2>
            <p className="text-gray-600 leading-8 text-sm sm:text-base">{typeInfo.description}</p>
          </div>

          <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-950 via-violet-900 to-fuchsia-900 shadow-xl p-6 sm:p-8 text-white">
            <p className="text-sm uppercase tracking-[0.22em] text-violet-200 mb-3">阅读提示</p>
            <ul className="space-y-3 text-sm leading-7 text-violet-100/90">
              <li>• 类型代码帮助你快速定位整体偏好。</li>
              <li>• 维度条形图会显示你在四组偏好中的倾向强弱。</li>
              <li>• 若某一维度接近 50%，通常表示你会随着情境灵活切换。</li>
            </ul>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/92 backdrop-blur shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">维度分析</h2>
              <p className="text-sm text-gray-500 mt-1">四个维度共同构成你的 MBTI 画像。</p>
            </div>
          </div>
          <div className="space-y-4">
            {result.dimensions.map((dimension) => (
              <DimensionBar key={dimension.key} result={dimension} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <CollapsibleSection title="性格特征">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.generalTraits.map((trait, index) => <li key={index}>{trait}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="核心优势">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.strengths.map((strength, index) => <li key={index}>{strength}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="特殊天赋">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.gifts.map((gift, index) => <li key={index}>{gift}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系优势">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipStrengths.map((strength, index) => <li key={index}>{strength}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系挑战">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipWeaknesses.map((weakness, index) => <li key={index}>{weakness}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="生活建议">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {typeInfo.tenRulesToLive.map((rule, index) => <li key={index}>{rule}</li>)}
            </ol>
          </CollapsibleSection>

          <CollapsibleSection title="潜在问题">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.potentialProblemAreas.map((problem, index) => <li key={index}>{problem}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="成长方向">
            <p className="text-sm">{typeInfo.solutions}</p>
          </CollapsibleSection>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/mbti')}
            className="flex-1 bg-violet-600 text-white py-3 rounded-2xl font-medium hover:bg-violet-700 transition-colors"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-white text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MBTIResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(135deg,_#f7f4ff,_#ede9fe_42%,_#f8fafc)] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center text-gray-600">加载中...</div>
        </div>
      }
    >
      <MBTIResultContent />
    </Suspense>
  );
}
