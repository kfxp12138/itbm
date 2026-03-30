'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMBTITypeDescription, normalizeMBTIResult, type MBTIResult } from '@/lib/mbti-scoring';
import type { MBTIType } from '@/data/mbti-types';

type MBTITheme = {
  groupLabel: string;
  eyebrowClass: string;
  subtitleClass: string;
  titleGradientClass: string;
  heroBadgeClass: string;
  primaryStatClass: string;
  secondaryStatClass: string;
  barBadgeClass: string;
  barLeftClass: string;
  barRightClass: string;
  collapseHoverClass: string;
  collapseIconClass: string;
  collapseBorderClass: string;
  primaryButtonClass: string;
  primaryGlowClass: string;
  orbClass: string;
  heroOverlayStyle: React.CSSProperties;
};

const PURPLE_TYPES = new Set(['INTJ', 'INTP', 'ENTJ', 'ENTP']);
const GREEN_TYPES = new Set(['INFJ', 'INFP', 'ENFJ', 'ENFP']);
const BLUE_TYPES = new Set(['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ']);
const YELLOW_TYPES = new Set(['ISTP', 'ISFP', 'ESTP', 'ESFP']);

const MBTI_THEMES: Record<'purple' | 'green' | 'blue' | 'yellow', MBTITheme> = {
  purple: {
    groupLabel: '紫人',
    eyebrowClass: 'text-violet-300/80',
    subtitleClass: 'text-violet-200',
    titleGradientClass: 'from-zinc-50 via-violet-100 to-zinc-500',
    heroBadgeClass: 'border-violet-500/25 bg-violet-500/10 text-violet-100',
    primaryStatClass: 'border-violet-500/20 bg-violet-500/10 text-violet-100',
    secondaryStatClass: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100',
    barBadgeClass: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
    barLeftClass: 'bg-violet-500',
    barRightClass: 'bg-fuchsia-500/55',
    collapseHoverClass: 'hover:text-violet-300',
    collapseIconClass: 'text-violet-400',
    collapseBorderClass: 'border-violet-500/40',
    primaryButtonClass: 'border-violet-500/30 bg-violet-500 hover:bg-violet-400',
    primaryGlowClass: 'shadow-[0_0_24px_rgba(139,92,246,0.35)]',
    orbClass: 'bg-violet-400/70',
    heroOverlayStyle: {
      backgroundImage:
        'radial-gradient(circle at top, rgba(139,92,246,0.22), transparent 30%), radial-gradient(circle at 80% 20%, rgba(217,70,239,0.14), transparent 20%)',
    },
  },
  green: {
    groupLabel: '绿人',
    eyebrowClass: 'text-emerald-300/80',
    subtitleClass: 'text-emerald-200',
    titleGradientClass: 'from-zinc-50 via-emerald-100 to-zinc-500',
    heroBadgeClass: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
    primaryStatClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    secondaryStatClass: 'border-teal-500/20 bg-teal-500/10 text-teal-100',
    barBadgeClass: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    barLeftClass: 'bg-emerald-500',
    barRightClass: 'bg-teal-500/55',
    collapseHoverClass: 'hover:text-emerald-300',
    collapseIconClass: 'text-emerald-400',
    collapseBorderClass: 'border-emerald-500/40',
    primaryButtonClass: 'border-emerald-500/30 bg-emerald-500 hover:bg-emerald-400',
    primaryGlowClass: 'shadow-[0_0_24px_rgba(16,185,129,0.3)]',
    orbClass: 'bg-emerald-400/70',
    heroOverlayStyle: {
      backgroundImage:
        'radial-gradient(circle at top, rgba(16,185,129,0.2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(45,212,191,0.12), transparent 20%)',
    },
  },
  blue: {
    groupLabel: '蓝人',
    eyebrowClass: 'text-sky-300/80',
    subtitleClass: 'text-sky-200',
    titleGradientClass: 'from-zinc-50 via-sky-100 to-zinc-500',
    heroBadgeClass: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
    primaryStatClass: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
    secondaryStatClass: 'border-blue-500/20 bg-blue-500/10 text-blue-100',
    barBadgeClass: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
    barLeftClass: 'bg-sky-500',
    barRightClass: 'bg-blue-500/55',
    collapseHoverClass: 'hover:text-sky-300',
    collapseIconClass: 'text-sky-400',
    collapseBorderClass: 'border-sky-500/40',
    primaryButtonClass: 'border-sky-500/30 bg-sky-500 hover:bg-sky-400',
    primaryGlowClass: 'shadow-[0_0_24px_rgba(14,165,233,0.3)]',
    orbClass: 'bg-sky-400/70',
    heroOverlayStyle: {
      backgroundImage:
        'radial-gradient(circle at top, rgba(14,165,233,0.2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.12), transparent 20%)',
    },
  },
  yellow: {
    groupLabel: '黄人',
    eyebrowClass: 'text-amber-300/80',
    subtitleClass: 'text-amber-200',
    titleGradientClass: 'from-zinc-50 via-amber-100 to-zinc-500',
    heroBadgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
    primaryStatClass: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    secondaryStatClass: 'border-orange-500/20 bg-orange-500/10 text-orange-100',
    barBadgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    barLeftClass: 'bg-amber-500',
    barRightClass: 'bg-orange-500/55',
    collapseHoverClass: 'hover:text-amber-300',
    collapseIconClass: 'text-amber-400',
    collapseBorderClass: 'border-amber-500/40',
    primaryButtonClass: 'border-amber-500/30 bg-amber-500 hover:bg-amber-400',
    primaryGlowClass: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]',
    orbClass: 'bg-amber-400/70',
    heroOverlayStyle: {
      backgroundImage:
        'radial-gradient(circle at top, rgba(245,158,11,0.2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(249,115,22,0.12), transparent 20%)',
    },
  },
};

function getMBTITheme(type: string): MBTITheme {
  if (PURPLE_TYPES.has(type)) {
    return MBTI_THEMES.purple;
  }

  if (GREEN_TYPES.has(type)) {
    return MBTI_THEMES.green;
  }

  if (BLUE_TYPES.has(type)) {
    return MBTI_THEMES.blue;
  }

  if (YELLOW_TYPES.has(type)) {
    return MBTI_THEMES.yellow;
  }

  return MBTI_THEMES.purple;
}

function CollapsibleSection({ title, children, theme }: { title: string; children: React.ReactNode; theme: MBTITheme }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden border-b border-zinc-800/80">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className={`flex w-full items-center justify-between py-6 text-left text-lg font-medium text-zinc-200 transition-colors ${theme.collapseHoverClass}`}
      >
        {title}
        <svg className={`h-5 w-5 text-zinc-600 transition-transform ${open ? `rotate-180 ${theme.collapseIconClass}` : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? <div className={`ml-2 border-l-2 pb-8 pl-5 pt-1 text-zinc-400 leading-8 ${theme.collapseBorderClass}`}>{children}</div> : null}
    </div>
  );
}

function DimensionBar({ result, theme }: { result: MBTIResult['dimensions'][number]; theme: MBTITheme }) {
  return (
    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/85 p-6 transition-all duration-300 hover:border-zinc-700 sm:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-50">{result.title}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{result.subtitle}</p>
        </div>
        <div className={`rounded-full border px-3 py-1.5 text-xs font-medium ${theme.barBadgeClass}`}>
          {result.dominantPole} 倾向 {result.strengthPercentage}%
        </div>
      </div>

      <div className="mb-4 flex items-end justify-between gap-4">
        <div className={result.leftPercentage >= result.rightPercentage ? 'text-zinc-50' : 'text-zinc-600'}>
          <p className="text-3xl font-semibold tracking-tight">
            {result.leftPole}
            <span className="ml-2 text-base font-medium opacity-50">{result.leftPercentage}%</span>
          </p>
        </div>
        <div className={result.rightPercentage > result.leftPercentage ? 'text-zinc-50 text-right' : 'text-zinc-600 text-right'}>
          <p className="text-3xl font-semibold tracking-tight">
            <span className="mr-2 text-base font-medium opacity-50">{result.rightPercentage}%</span>
            {result.rightPole}
          </p>
        </div>
      </div>

      <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="flex h-full w-full">
          <div className={`h-full ${theme.barLeftClass}`} style={{ width: `${result.leftPercentage}%` }} />
          <div className={`h-full ${theme.barRightClass}`} style={{ width: `${result.rightPercentage}%` }} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-8 text-sm leading-7">
        <div className="border-r-0 border-zinc-800/80 pr-0 sm:border-r sm:pr-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">左侧描述</p>
          <p className="text-zinc-300">{result.leftLabel}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">右侧描述</p>
          <p className="text-zinc-300">{result.rightLabel}</p>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value, tone = 'default', theme }: { label: string; value: string; tone?: 'default' | 'primary' | 'secondary'; theme: MBTITheme }) {
  const toneClass =
    tone === 'primary'
      ? theme.primaryStatClass
      : tone === 'secondary'
        ? theme.secondaryStatClass
        : 'border-zinc-800 bg-zinc-900/85 text-zinc-100';

  return (
    <div className={`rounded-3xl border px-4 py-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
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

      if (historyResult) {
        setResult(historyResult);
        setTypeInfo(getMBTITypeDescription(historyResult.type));
        return true;
      }

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
  }, [historyTs, orderId, router]);

  const averageStrength = useMemo(() => {
    if (!result) {
      return 0;
    }

    return Math.round(result.dimensions.reduce((sum, dimension) => sum + dimension.strengthPercentage, 0) / result.dimensions.length);
  }, [result]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/85 p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">MBTI Result</p>
          <p className="mt-3 text-lg font-medium text-zinc-100">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result || !typeInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/85 p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">MBTI Result</p>
          <p className="mt-3 text-lg font-medium text-zinc-100">加载中...</p>
        </div>
      </div>
    );
  }

  const theme = getMBTITheme(result.type);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 px-6 py-10 shadow-[0_36px_140px_rgba(0,0,0,0.5)] sm:px-10 sm:py-14">
          <div className="absolute inset-0" style={theme.heroOverlayStyle} />
          <div className={`absolute left-10 top-10 h-28 w-28 rounded-full blur-3xl ${theme.orbClass}`} />
          <div className="relative text-center">
            <div className="flex flex-col items-center gap-3">
              <p className={`text-xs uppercase tracking-[0.38em] ${theme.eyebrowClass}`}>MBTI 结果概览</p>
              <div className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-[0.18em] ${theme.heroBadgeClass}`}>
                {theme.groupLabel}主题
              </div>
            </div>
            <h1 className={`mt-8 bg-gradient-to-br text-7xl font-bold leading-none tracking-[-0.08em] text-transparent bg-clip-text sm:text-[9rem] ${theme.titleGradientClass}`}>
              {result.type}
            </h1>
            <p className={`mt-5 text-2xl font-medium sm:text-3xl ${theme.subtitleClass}`}>{typeInfo.epithet}</p>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-zinc-400 sm:text-base">{typeInfo.description}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <ResultStat label="完成题数" value={`${result.completedQuestions}/${result.totalQuestions}`} tone="primary" theme={theme} />
              <ResultStat label="平均倾向强度" value={`${averageStrength}%`} tone="secondary" theme={theme} />
              <ResultStat label="结果说明" value={`${theme.groupLabel}画像下的 4 个维度综合结果。`} theme={theme} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/75 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">人格描述</p>
            <p className="mt-5 text-sm leading-8 text-zinc-300 sm:text-base">{typeInfo.description}</p>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/75 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">阅读提示</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-zinc-300">
              <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">类型代码帮助你快速定位整体偏好。</li>
              <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">维度条形图会显示你在四组偏好中的倾向强弱。</li>
              <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">若某一维度接近 50%，通常表示你会随着情境灵活切换。</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/75 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-50">维度分析</h2>
              <p className="mt-1 text-sm text-zinc-500">四个维度共同构成你的 MBTI 画像。</p>
            </div>
          </div>
          <div className="space-y-4">
            {result.dimensions.map((dimension) => (
              <DimensionBar key={dimension.key} result={dimension} theme={theme} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/75 px-6 py-2 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:px-8">
          <CollapsibleSection title="性格特征" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.generalTraits.map((trait, index) => <li key={index}>{trait}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="核心优势" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.strengths.map((strength, index) => <li key={index}>{strength}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="特殊天赋" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.gifts.map((gift, index) => <li key={index}>{gift}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系优势" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipStrengths.map((strength, index) => <li key={index}>{strength}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="关系挑战" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.relationshipWeaknesses.map((weakness, index) => <li key={index}>{weakness}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="生活建议" theme={theme}>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {typeInfo.tenRulesToLive.map((rule, index) => <li key={index}>{rule}</li>)}
            </ol>
          </CollapsibleSection>

          <CollapsibleSection title="潜在问题" theme={theme}>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {typeInfo.potentialProblemAreas.map((problem, index) => <li key={index}>{problem}</li>)}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="成长方向" theme={theme}>
            <p className="text-sm">{typeInfo.solutions}</p>
          </CollapsibleSection>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push('/mbti')}
            className={`flex-1 rounded-2xl border py-3 text-white transition-colors ${theme.primaryButtonClass} ${theme.primaryGlowClass}`}
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/85 p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">MBTI Result</p>
            <p className="mt-3 text-lg font-medium text-zinc-100">加载中...</p>
          </div>
        </div>
      }
    >
      <MBTIResultContent />
    </Suspense>
  );
}
