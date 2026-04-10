'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIQDescription } from '@/lib/iq-scoring';
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
          <p className="text-zinc-300">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-zinc-300">加载中...</p>
        </div>
      </div>
    );
  }

  const { level, description } = getIQDescription(result.score);

  const getScoreColor = (score: number) => {
    if (score >= 130) return 'text-purple-600';
    if (score >= 120) return 'text-indigo-600';
    if (score >= 110) return 'text-blue-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-[2rem] p-5 sm:p-8">
        <p className="section-kicker text-center">IQ Result</p>
        <h1 className="mb-2 mt-4 text-center text-2xl font-bold text-zinc-50">测试结果</h1>
        <p className="mb-8 text-center text-zinc-400">瑞文智力测试</p>

        {/* IQ Score */}
        <div className="text-center mb-8">
            <div className={`text-5xl sm:text-7xl font-bold ${getScoreColor(result.score).replace('600', '300')}`}>
              {result.score}
            </div>
            <div className="mt-2 text-zinc-500">IQ 分数</div>
        </div>

        {/* Level badge */}
        <div className="flex justify-center mb-6">
          <span className={`px-4 py-2 rounded-full text-lg font-medium ${
            result.score >= 120 ? 'border border-blue-500/25 bg-blue-500/12 text-blue-200' :
            result.score >= 90 ? 'border border-emerald-500/25 bg-emerald-500/12 text-emerald-200' :
            'border border-amber-500/25 bg-amber-500/12 text-amber-200'
          }`}>
            {level}
          </span>
        </div>

        <p className="mb-8 text-center text-zinc-400">{description}</p>

        <div className="glass-card-soft mb-8 space-y-3 rounded-[1.5rem] p-4">
          <div className="flex justify-between">
            <span className="text-zinc-500">正确题数</span>
            <span className="font-medium text-zinc-100">{result.correctCount}/60</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">测试年龄</span>
            <span className="font-medium text-zinc-100">{result.age} 岁</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">测试时间</span>
            <span className="font-medium text-zinc-100">
              {new Date(result.timestamp).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/iq')}
            className="flex-1 rounded-2xl border border-blue-500/30 bg-blue-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition-colors hover:bg-blue-400"
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

export default function IQResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="text-zinc-300">加载中...</p>
          </div>
        </div>
      }
    >
      <IQResultContent />
    </Suspense>
  );
}
