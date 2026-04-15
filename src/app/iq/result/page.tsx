'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIQDescription, getIQPopulationRange, IQ_POPULATION_RANGES } from '@/lib/iq-scoring';
import { persistPaidResult } from '@/lib/client-result-storage';

interface IQResult {
  timestamp: number;
  score: number;
  correctCount: number;
  age: number;
}

function IQResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<IQResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (!orderId) {
        router.push('/iq');
        return;
      }

      setVerifying(true);
      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = (await response.json()) as { isPaid?: boolean; resultData?: string; testType?: string };

        if (!data.isPaid || !data.resultData || data.testType !== 'iq') {
          router.push('/payment?testType=iq');
          return;
        }

        const parsed = JSON.parse(data.resultData) as IQResult;
        persistPaidResult('iq', parsed, parsed);
        setResult(parsed);
      } catch (error) {
        console.error('Verify error:', error);
        router.push('/payment?testType=iq');
      } finally {
        setVerifying(false);
      }
    };

    verifyAndLoad();
  }, [orderId, router]);

  if (verifying) {
    return (
      <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">IQ Result</p>
          <p className="mt-4 text-lg font-medium text-slate-900">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">IQ Result</p>
          <p className="mt-4 text-lg font-medium text-slate-900">加载中...</p>
        </div>
      </div>
    );
  }

  const { level, description } = getIQDescription(result.score);
  const popStat = getIQPopulationRange(result.score);

  const getScoreColor = (score: number) => {
    if (score >= 130) return 'text-purple-600';
    if (score >= 120) return 'text-indigo-600';
    if (score >= 110) return 'text-blue-600';
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 120) return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    if (score >= 90) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  const heroGlowClass = 'bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(139,92,246,0.08),_transparent_24%)]';

  return (
    <div className="app-shell-module-indigo px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        
        <section className="glass-card relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
          <div className={`absolute inset-0 ${heroGlowClass}`} />
          <div className="relative text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="section-kicker justify-center">IQ 测试结果</p>
              <div className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wider ${getBadgeColor(result.score)}`}>
                {level}
              </div>
            </div>
            
            <h1 className={`mt-8 text-7xl font-bold tracking-tight sm:text-[8rem] ${getScoreColor(result.score)}`}>
              {result.score}
            </h1>
            <p className="mt-4 text-xl font-medium text-slate-900 sm:text-2xl">您的 IQ 分数</p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">{description}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400">正确题数</p>
                <p className="mt-2 text-xl font-semibold text-indigo-900">{result.correctCount} / 60</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">测试年龄</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{result.age} 岁</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">测试时间</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 mt-3">
                  {new Date(result.timestamp).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 text-center sm:text-left">
            <p className="section-kicker">人群分布</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">您的分数在人群中的大致位置</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              智商（IQ）分数的平均值为 100，标准差为 15。根据正态分布模型，您的分数处于 <span className="font-semibold text-indigo-600">
                {popStat.min === 0 ? `< ${popStat.max + 1}` : popStat.max === 200 ? `≥ ${popStat.min}` : `${popStat.min} - ${popStat.max}`}
              </span> 区间，该区间大约占总人群的 <span className="font-semibold text-indigo-600">{popStat.percent}</span>。
            </p>
          </div>

          <div className="space-y-3">
            {IQ_POPULATION_RANGES.map((range, idx) => {
              const isCurrent = result.score >= range.min && result.score <= range.max;
              return (
                <div 
                  key={idx} 
                  className={`relative flex items-center justify-between rounded-2xl border p-4 transition-colors sm:p-5 ${
                    isCurrent 
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm' 
                      : 'border-slate-100 bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 text-sm font-bold sm:w-24 sm:text-base ${isCurrent ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {range.min === 0 ? `< ${range.max + 1}` : range.max === 200 ? `≥ ${range.min}` : `${range.min} - ${range.max}`}
                    </div>
                    <div className={`text-sm font-medium sm:text-base ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {range.label}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isCurrent && (
                      <span className="hidden rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 sm:inline-block">
                        您的区间
                      </span>
                    )}
                    <div className={`w-12 text-right text-sm sm:w-16 sm:text-base ${isCurrent ? 'font-bold text-indigo-600' : 'text-slate-500'}`}>
                      {range.percent}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push('/iq')}
            className="app-button-primary flex-1 rounded-2xl border border-indigo-200 bg-indigo-600 px-5 py-4 text-white transition-colors hover:bg-indigo-500"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="app-button-secondary flex-1 justify-center py-4"
          >
            返回首页
          </button>
        </div>

      </div>
    </div>
  );
}

export default function IQResultPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell-module-indigo flex min-h-screen items-center justify-center px-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="section-kicker justify-center">IQ Result</p>
            <p className="mt-4 text-lg font-medium text-slate-900">加载中...</p>
          </div>
        </div>
      }
    >
      <IQResultContent />
    </Suspense>
  );
}
