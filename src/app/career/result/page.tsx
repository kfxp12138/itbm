'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CareerResult } from '@/lib/career-scoring';

function parseCareerResult(raw: string | null): CareerResult | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CareerResult;
  } catch {
    return null;
  }
}

function CareerResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<CareerResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (orderId) {
        setVerifying(true);
        try {
          const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
          const data = await response.json();

          if (!data.isPaid) {
            router.push('/payment?testType=career');
            return;
          }


          // Try to use resultData from API, fallback to localStorage
          if (data.resultData) {
            const parsed = parseCareerResult(data.resultData);
            if (parsed) {
              setResult(parsed);
            }
          } else {
            const parsed = parseCareerResult(localStorage.getItem('career_latest_result'));
            if (parsed) {
              setResult(parsed);
            }
          }
        } catch (error) {
          console.error('Verify error:', error);
          router.push('/payment?testType=career');
        } finally {
          setVerifying(false);
        }
      } else {
        // No orderId - fallback to localStorage (backward compatible)
        const parsed = parseCareerResult(localStorage.getItem('career_latest_result'));
        if (parsed) {
          setResult(parsed);
        }
      }
    };

    verifyAndLoad();
  }, [orderId, router]);

  if (verifying) {
    return (
      <div className="app-shell-module-emerald flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-slate-600">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="app-shell-module-emerald flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  const traitDescriptions: Record<string, string> = {
    '开放性': '反映你对新体验、创意和抽象思维的接受程度',
    '尽责性': '反映你做事的条理性、自律性和责任感',
    '外向性': '反映你的社交活跃度和从外部世界获取能量的程度',
    '宜人性': '反映你与他人合作、信任和体谅的倾向',
    '神经质': '反映你的情绪波动性和对压力的敏感程度',
  };

  return (
    <div className="app-shell-module-emerald min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card rounded-[2rem] p-8 text-center">
          <p className="mb-2 text-slate-500">你的MBTI类型</p>
          <div className="mb-2 text-3xl font-bold text-emerald-300 sm:text-5xl">{result.mbtiType}</div>
          <div className="text-xl text-slate-700">{result.mbtiTypeName}</div>
        </div>

        <div className="glass-card rounded-[2rem] p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">大五人格分析</h2>
          <div className="space-y-5">
            {result.ffmScores.map((score) => (
              <div key={score.trait}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-800">{score.trait}</span>
                  <span className="font-bold text-emerald-300">{score.percentage}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-emerald-100">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${score.percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{traitDescriptions[score.trait]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">推荐职业方向</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.careers.map((career) => (
              <div
                key={career}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center transition-colors hover:bg-emerald-100"
              >
                <span className="font-medium text-emerald-700">{career}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/career')}
            className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="app-button-secondary flex-1 py-3 font-medium"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CareerResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="text-zinc-300">加载中...</p>
          </div>
        </div>
      }
    >
      <CareerResultContent />
    </Suspense>
  );
}
