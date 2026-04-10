'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMBTITypeDescription, normalizeMBTIResult, type MBTIResult } from '@/lib/mbti-scoring';
import type { MBTIType } from '@/data/mbti-types';
import { persistPaidResult } from '@/lib/client-result-storage';

type MBTITheme = {
  groupLabel: string;
  badgeClass: string;
  accentTextClass: string;
  heroGlowClass: string;
  primaryButtonClass: string;
  softCardClass: string;
  softBorderClass: string;
  barLeftClass: string;
  barRightClass: string;
  hoverClass: string;
};

const PURPLE_TYPES = new Set(['INTJ', 'INTP', 'ENTJ', 'ENTP']);
const GREEN_TYPES = new Set(['INFJ', 'INFP', 'ENFJ', 'ENFP']);
const BLUE_TYPES = new Set(['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ']);
const YELLOW_TYPES = new Set(['ISTP', 'ISFP', 'ESTP', 'ESFP']);

const MBTI_THEMES: Record<'purple' | 'green' | 'blue' | 'yellow', MBTITheme> = {
  purple: {
    groupLabel: '紫人',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
    accentTextClass: 'text-violet-700',
    heroGlowClass: 'bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.14),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(217,70,239,0.08),_transparent_24%)]',
    primaryButtonClass: 'app-button-primary',
    softCardClass: 'bg-violet-50',
    softBorderClass: 'border-violet-200',
    barLeftClass: 'bg-violet-500',
    barRightClass: 'bg-fuchsia-400',
    hoverClass: 'hover:text-violet-700',
  },
  green: {
    groupLabel: '绿人',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accentTextClass: 'text-emerald-700',
    heroGlowClass: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(45,212,191,0.08),_transparent_24%)]',
    primaryButtonClass: 'rounded-2xl border border-emerald-200 bg-emerald-500 px-5 py-3 text-white transition-colors hover:bg-emerald-400',
    softCardClass: 'bg-emerald-50',
    softBorderClass: 'border-emerald-200',
    barLeftClass: 'bg-emerald-500',
    barRightClass: 'bg-teal-400',
    hoverClass: 'hover:text-emerald-700',
  },
  blue: {
    groupLabel: '蓝人',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    accentTextClass: 'text-sky-700',
    heroGlowClass: 'bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(59,130,246,0.08),_transparent_24%)]',
    primaryButtonClass: 'rounded-2xl border border-sky-200 bg-sky-500 px-5 py-3 text-white transition-colors hover:bg-sky-400',
    softCardClass: 'bg-sky-50',
    softBorderClass: 'border-sky-200',
    barLeftClass: 'bg-sky-500',
    barRightClass: 'bg-blue-400',
    hoverClass: 'hover:text-sky-700',
  },
  yellow: {
    groupLabel: '黄人',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    accentTextClass: 'text-amber-700',
    heroGlowClass: 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(249,115,22,0.08),_transparent_24%)]',
    primaryButtonClass: 'rounded-2xl border border-amber-200 bg-amber-500 px-5 py-3 text-white transition-colors hover:bg-amber-400',
    softCardClass: 'bg-amber-50',
    softBorderClass: 'border-amber-200',
    barLeftClass: 'bg-amber-500',
    barRightClass: 'bg-orange-400',
    hoverClass: 'hover:text-amber-700',
  },
};

function getMBTITheme(type: string): MBTITheme {
  if (PURPLE_TYPES.has(type)) return MBTI_THEMES.purple;
  if (GREEN_TYPES.has(type)) return MBTI_THEMES.green;
  if (BLUE_TYPES.has(type)) return MBTI_THEMES.blue;
  if (YELLOW_TYPES.has(type)) return MBTI_THEMES.yellow;
  return MBTI_THEMES.purple;
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

function loadHistoryResult(timestamp: string | null): MBTIResult | null {
  if (!timestamp) {
    return null;
  }

  const targetTimestamp = Number(timestamp);
  if (!Number.isFinite(targetTimestamp)) {
    return null;
  }

  try {
    const stored = JSON.parse(localStorage.getItem('mbti_results') || '[]') as unknown;
    if (!Array.isArray(stored)) {
      return null;
    }

    const matched = stored.find((entry) => {
      if (!entry || typeof entry !== 'object' || !('timestamp' in entry)) {
        return false;
      }

      return typeof entry.timestamp === 'number' && entry.timestamp === targetTimestamp;
    });

    return matched ? normalizeMBTIResult(matched) : null;
  } catch {
    return null;
  }
}

function CollapsibleSection({ title, children, theme }: { title: string; children: React.ReactNode; theme: MBTITheme }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button onClick={() => setOpen((previous) => !previous)} className={`flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-medium text-slate-800 transition-colors ${theme.hoverClass}`}>
        <span>{title}</span>
        <svg className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? <div className={`mb-5 rounded-2xl border px-5 py-5 text-sm leading-8 text-slate-600 ${theme.softBorderClass} ${theme.softCardClass}`}>{children}</div> : null}
    </div>
  );
}

function DimensionBar({ result, theme }: { result: MBTIResult['dimensions'][number]; theme: MBTITheme }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{result.title}</p>
          <p className="mt-1 text-sm text-slate-500">{result.subtitle}</p>
        </div>
        <div className={`rounded-full border px-3 py-1.5 text-xs font-medium ${theme.badgeClass}`}>
          {result.dominantPole} 倾向 {result.strengthPercentage}%
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{result.leftPole} · {result.leftPercentage}%</span>
        <span>{result.rightPole} · {result.rightPercentage}%</span>
      </div>
      <div className="mb-6 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className={theme.barLeftClass} style={{ width: `${result.leftPercentage}%` }} />
          <div className={theme.barRightClass} style={{ width: `${result.rightPercentage}%` }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">{result.leftLabel}</div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">{result.rightLabel}</div>
      </div>
    </div>
  );
}

function MBTIResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const historyTs = searchParams.get('historyTs');

  const [result, setResult] = useState<MBTIResult | null>(null);
  const [typeInfo, setTypeInfo] = useState<MBTIType | undefined>(undefined);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadLocalResult = () => {
      const historyResult = loadHistoryResult(historyTs);
      if (!historyResult) {
        return false;
      }

      setResult(historyResult);
      setTypeInfo(getMBTITypeDescription(historyResult.type));
      return true;
    };

    const verifyAndLoad = async () => {
      if (!orderId) {
        if (historyTs && loadLocalResult()) {
          return;
        }

        router.push('/mbti');
        return;
      }

      setVerifying(true);

      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = (await response.json()) as { isPaid?: boolean; resultData?: string; testType?: string };

        if (!data.isPaid || data.testType !== 'mbti') {
          router.push('/payment?testType=mbti');
          return;
        }

        const parsed = parseResultPayload(data.resultData ?? null);
        if (parsed) {
          persistPaidResult('mbti', parsed, {
            timestamp: Date.now(),
            ...parsed,
          });
          setResult(parsed);
          setTypeInfo(getMBTITypeDescription(parsed.type));
          return;
        }

        router.push('/payment?testType=mbti');
      } catch {
        router.push('/payment?testType=mbti');
      } finally {
        setVerifying(false);
      }
    };

    void verifyAndLoad();
  }, [historyTs, orderId, router]);

  const averageStrength = useMemo(() => {
    if (!result) {
      return 0;
    }

    return Math.round(result.dimensions.reduce((sum, dimension) => sum + dimension.strengthPercentage, 0) / result.dimensions.length);
  }, [result]);

  if (verifying) {
    return (
      <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">MBTI Result</p>
          <p className="mt-4 text-lg font-medium text-slate-900">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result || !typeInfo) {
    return (
      <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">MBTI Result</p>
          <p className="mt-4 text-lg font-medium text-slate-900">加载中...</p>
        </div>
      </div>
    );
  }

  const theme = getMBTITheme(result.type);

  return (
    <div className="app-shell-module-violet px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="glass-card relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
          <div className={`absolute inset-0 ${theme.heroGlowClass}`} />
          <div className="relative text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="section-kicker justify-center">MBTI 结果概览</p>
              <div className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-[0.18em] ${theme.badgeClass}`}>{theme.groupLabel}</div>
            </div>
            <h1 className={`mt-8 text-6xl font-bold tracking-[-0.08em] sm:text-[8rem] ${theme.accentTextClass}`}>{result.type}</h1>
            <p className="mt-4 text-2xl font-medium text-slate-900 sm:text-3xl">{typeInfo.epithet}</p>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">{typeInfo.description}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className={`rounded-3xl border px-4 py-4 ${theme.softBorderClass} ${theme.softCardClass}`}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">完成题数</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{result.completedQuestions}/{result.totalQuestions}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">平均倾向强度</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{averageStrength}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">结果说明</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">完整版详细画像</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">人格描述</p>
            <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">{typeInfo.description}</p>
          </div>
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">阅读提示</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <li className="glass-card-soft rounded-2xl px-4 py-4">类型代码帮助你快速定位整体偏好。</li>
              <li className="glass-card-soft rounded-2xl px-4 py-4">维度条会显示你在四组偏好中的倾向强弱。</li>
              <li className="glass-card-soft rounded-2xl px-4 py-4">如果某个维度接近 50%，通常表示你会随情境灵活切换。</li>
            </ul>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">维度分析</h2>
            <p className="mt-1 text-sm text-slate-500">四个维度共同构成你的 MBTI 画像。</p>
          </div>
          <div className="space-y-4">
            {result.dimensions.map((dimension) => (
              <DimensionBar key={dimension.key} result={dimension} theme={theme} />
            ))}
          </div>
        </section>

        <section className="glass-card rounded-[2rem] px-6 py-2 sm:px-8">
          <CollapsibleSection title="性格特征" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.generalTraits.map((trait, index) => <li key={index}>{trait}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="核心优势" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.strengths.map((strength, index) => <li key={index}>{strength}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="特殊天赋" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.gifts.map((gift, index) => <li key={index}>{gift}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="关系优势" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.relationshipStrengths.map((strength, index) => <li key={index}>{strength}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="关系挑战" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.relationshipWeaknesses.map((weakness, index) => <li key={index}>{weakness}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="生活建议" theme={theme}>
            <ol className="list-decimal list-inside space-y-2">{typeInfo.tenRulesToLive.map((rule, index) => <li key={index}>{rule}</li>)}</ol>
          </CollapsibleSection>
          <CollapsibleSection title="潜在问题" theme={theme}>
            <ul className="list-disc list-inside space-y-1">{typeInfo.potentialProblemAreas.map((problem, index) => <li key={index}>{problem}</li>)}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="成长方向" theme={theme}>
            <p>{typeInfo.solutions}</p>
          </CollapsibleSection>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => router.push('/mbti')} className={`flex-1 ${theme.primaryButtonClass}`}>
            重新测试完整版
          </button>
          <button onClick={() => router.push('/mbti/free')} className="app-button-secondary flex-1 justify-center py-3">
            做 20 题免费版
          </button>
          <button onClick={() => router.push('/')} className="app-button-secondary flex-1 justify-center py-3">
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
        <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="section-kicker justify-center">MBTI Result</p>
            <p className="mt-4 text-lg font-medium text-slate-900">加载中...</p>
          </div>
        </div>
      }
    >
      <MBTIResultContent />
    </Suspense>
  );
}
