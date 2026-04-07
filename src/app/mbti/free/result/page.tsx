'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeFreeMBTIResult, type MBTIFreeResult } from '@/lib/mbti-free-scoring';

function parseFreeResult(raw: string | null): MBTIFreeResult | null {
  if (!raw) {
    return null;
  }

  try {
    return normalizeFreeMBTIResult(JSON.parse(raw));
  } catch {
    return null;
  }
}

function loadHistoryResult(historyTs: string | null): MBTIFreeResult | null {
  if (!historyTs) {
    return null;
  }

  const target = Number(historyTs);
  if (!Number.isFinite(target)) {
    return null;
  }

  try {
    const stored = JSON.parse(localStorage.getItem('mbti_free_results') || '[]') as unknown;
    if (!Array.isArray(stored)) {
      return null;
    }

    const matched = stored.find((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const timestamp = 'completedAt' in entry && typeof entry.completedAt === 'number' ? entry.completedAt : 'timestamp' in entry && typeof entry.timestamp === 'number' ? entry.timestamp : null;
      return timestamp === target;
    });

    return matched ? normalizeFreeMBTIResult(matched) : null;
  } catch {
    return null;
  }
}

function FreeResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyTs = searchParams.get('historyTs');
  const [result, setResult] = useState<MBTIFreeResult | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const historyResult = loadHistoryResult(historyTs);
      if (historyResult) {
        setResult(historyResult);
        return;
      }

      setResult(parseFreeResult(localStorage.getItem('mbti_free_latest_result')));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [historyTs]);

  const nearbyTypes = result?.nearbyTypes ?? [];

  if (!result) {
    return (
      <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">Free MBTI Result</p>
          <p className="mt-4 text-lg font-medium text-slate-900">暂时没有可展示的免费版结果。</p>
          <button onClick={() => router.push('/mbti/free')} className="app-button-primary mt-6 justify-center px-6 py-3 text-sm font-medium">
            去做 20 题免费版
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-module-violet px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="glass-card relative overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.12),_transparent_38%),radial-gradient(circle_at_80%_18%,_rgba(139,92,246,0.08),_transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-fuchsia-700">
              <span>20 题免费版</span>
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              <span>快速结果</span>
            </div>
            <h1 className="mt-8 text-6xl font-bold tracking-[-0.08em] text-fuchsia-700 sm:text-[7rem]">{result.type}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base">
              这是 20 题免费版给出的结果，仅展示当前主类型与可能接近的类型。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="glass-card-soft rounded-[1.5rem] p-5">
                <p className="section-kicker justify-center">主类型</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{result.type}</p>
              </div>
              <div className="glass-card-soft rounded-[1.5rem] p-5">
                <p className="section-kicker justify-center">完成题数</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{result.completedQuestions}/{result.totalQuestions}</p>
              </div>
              <div className="glass-card-soft rounded-[1.5rem] p-5">
                <p className="section-kicker justify-center">结果定位</p>
                <p className="mt-3 text-base font-semibold text-slate-900">免费 20 题版</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">主类型</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{result.type}</h2>
          <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">本页不提供类型评价，仅展示结果代码。</p>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">可能接近的类型</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">你也可能靠近这些相邻类型</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {nearbyTypes.length > 0 ? (
              nearbyTypes.map((type) => (
                <div key={type} className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="text-2xl font-semibold text-fuchsia-700">{type}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">作为相邻类型展示，不附带解释。</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-600 sm:col-span-3">
                本次结果未生成相邻类型。
              </div>
            )}
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">下一步</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">继续查看其他版本</h2>
          <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">
            你可以重新做免费版，或者进入 200 题完整版查看更完整的测试结果。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => router.push('/mbti')} className="app-button-primary justify-center px-6 py-3 text-sm font-medium">
              去做 200 题完整版
            </button>
            <button onClick={() => router.push('/mbti/free')} className="app-button-secondary justify-center px-6 py-3 text-sm font-medium">
              重新做免费版
            </button>
            <button onClick={() => router.push('/')} className="app-button-secondary justify-center px-6 py-3 text-sm font-medium">
              返回首页
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function MBTIFreeResultPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="section-kicker justify-center">Free MBTI Result</p>
            <p className="mt-4 text-lg font-medium text-slate-900">加载中...</p>
          </div>
        </div>
      }
    >
      <FreeResultContent />
    </Suspense>
  );
}
