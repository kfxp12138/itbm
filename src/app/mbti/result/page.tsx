'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMBTITypeDescription } from '@/lib/mbti-scoring';
import type { MBTIType } from '@/data/mbti-types';

interface StoredResult {
  type: string;
  counts: Record<string, number>;
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {title}
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
}

function DimensionBar({ left, right, leftCount, rightCount }: { left: string; right: string; leftCount: number; rightCount: number }) {
  const total = leftCount + rightCount;
  const leftPct = total > 0 ? Math.round((leftCount / total) * 100) : 50;
  const rightPct = 100 - leftPct;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${leftPct >= rightPct ? 'text-violet-700' : 'text-gray-400'}`}>{left} {leftPct}%</span>
        <span className={`font-medium ${rightPct > leftPct ? 'text-violet-700' : 'text-gray-400'}`}>{rightPct}% {right}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
        <div className="bg-violet-500 transition-all duration-500" style={{ width: `${leftPct}%` }} />
        <div className="bg-gray-300 transition-all duration-500" style={{ width: `${rightPct}%` }} />
      </div>
    </div>
  );
}

function MBTIResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<StoredResult | null>(null);
  const [typeInfo, setTypeInfo] = useState<MBTIType | undefined>(undefined);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (orderId) {
        setVerifying(true);
        try {
          const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
          const data = await response.json();

          if (!data.isPaid) {
            router.push('/payment?testType=mbti');
            return;
          }


          // Try to use resultData from API, fallback to localStorage
          if (data.resultData) {
            const parsed: StoredResult = JSON.parse(data.resultData);
            setResult(parsed);
            setTypeInfo(getMBTITypeDescription(parsed.type));
          } else {
            const stored = localStorage.getItem('mbti_latest_result');
            if (stored) {
              const parsed: StoredResult = JSON.parse(stored);
              setResult(parsed);
              setTypeInfo(getMBTITypeDescription(parsed.type));
            }
          }
        } catch (error) {
          console.error('Verify error:', error);
          router.push('/payment?testType=mbti');
        } finally {
          setVerifying(false);
        }
      } else {
        // No orderId - fallback to localStorage (backward compatible)
        const stored = localStorage.getItem('mbti_latest_result');
        if (stored) {
          const parsed: StoredResult = JSON.parse(stored);
          setResult(parsed);
          setTypeInfo(getMBTITypeDescription(parsed.type));
        }
      }
    };

    verifyAndLoad();
  }, [orderId, router]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result || !typeInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Type Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <p className="text-gray-500 mb-2">你的MBTI类型</p>
          <div className="text-3xl sm:text-5xl font-bold text-violet-600 mb-2">{result.type}</div>
          <div className="text-xl text-gray-700 mb-1">{typeInfo.epithet}</div>
          <div className="text-sm text-gray-400">{typeInfo.name}</div>
        </div>

        {/* Dimension Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">维度分析</h2>
          <DimensionBar left="外向 (E)" right="内向 (I)" leftCount={result.counts.E} rightCount={result.counts.I} />
          <DimensionBar left="实感 (S)" right="直觉 (N)" leftCount={result.counts.S} rightCount={result.counts.N} />
          <DimensionBar left="思维 (T)" right="情感 (F)" leftCount={result.counts.T} rightCount={result.counts.F} />
          <DimensionBar left="判断 (J)" right="知觉 (P)" leftCount={result.counts.J} rightCount={result.counts.P} />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">人格描述</h2>
          <p className="text-gray-600 leading-relaxed text-sm">{typeInfo.description}</p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-3">
          <CollapsibleSection title="性格特征">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.generalTraits.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="核心优势">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="特殊天赋">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.gifts.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系优势">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipStrengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系挑战">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="生活建议">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {typeInfo.tenRulesToLive.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </CollapsibleSection>

          <CollapsibleSection title="潜在问题">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.potentialProblemAreas.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="成长方向">
            <p className="text-sm">{typeInfo.solutions}</p>
          </CollapsibleSection>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/mbti')}
            className="flex-1 bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-white text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
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
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <MBTIResultContent />
    </Suspense>
  );
}
