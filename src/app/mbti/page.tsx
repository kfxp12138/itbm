'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MBTI_DIMENSIONS, mbtiQuestions } from '@/data/mbti-questions';
import { calculateMBTIResult, type MBTIAnswerValue } from '@/lib/mbti-scoring';

const MBTI_DRAFT_KEY = 'mbti_draft_v2';

interface MBTIDraft {
  currentQ: number;
  answers: Array<MBTIAnswerValue | null>;
  savedAt: number;
}

const SCALE_OPTIONS: Array<{ value: MBTIAnswerValue; label: string; tone: string }> = [
  { value: 1, label: '非常偏左', tone: '强烈倾向' },
  { value: 2, label: '稍偏左', tone: '轻度倾向' },
  { value: 3, label: '中间', tone: '比较均衡' },
  { value: 4, label: '稍偏右', tone: '轻度倾向' },
  { value: 5, label: '非常偏右', tone: '强烈倾向' },
];

const SECTION_SIZE = 50;

function createEmptyAnswers(): Array<MBTIAnswerValue | null> {
  return Array.from({ length: mbtiQuestions.length }, () => null);
}

function parseDraft(raw: string | null): MBTIDraft | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MBTIDraft>;

    if (!Array.isArray(parsed.answers) || typeof parsed.currentQ !== 'number' || typeof parsed.savedAt !== 'number') {
      return null;
    }

    if (parsed.answers.length !== mbtiQuestions.length) {
      return null;
    }

    const answers = parsed.answers.map((answer) => {
      if (answer === null) {
        return null;
      }

      return answer === 1 || answer === 2 || answer === 3 || answer === 4 || answer === 5 ? answer : null;
    });

    const currentQ = Math.min(Math.max(parsed.currentQ, 0), mbtiQuestions.length - 1);

    return {
      answers,
      currentQ,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function formatSavedAt(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export default function MBTITestPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Array<MBTIAnswerValue | null>>(createEmptyAnswers);
  const [draft, setDraft] = useState<MBTIDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedDraft = parseDraft(localStorage.getItem(MBTI_DRAFT_KEY));
      setDraft(storedDraft);
      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    const nextDraft: MBTIDraft = {
      currentQ,
      answers,
      savedAt: Date.now(),
    };

    localStorage.setItem(MBTI_DRAFT_KEY, JSON.stringify(nextDraft));
  }, [answers, currentQ, started]);

  const totalQuestions = mbtiQuestions.length;
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const question = mbtiQuestions[currentQ];
  const currentSection = Math.floor(currentQ / SECTION_SIZE);
  const sectionMeta = MBTI_DIMENSIONS[currentSection];
  const currentAnswer = answers[currentQ];
  const currentSectionAnswered = answers.slice(currentSection * SECTION_SIZE, (currentSection + 1) * SECTION_SIZE).filter((answer) => answer !== null).length;
  const overallProgress = Math.round((answeredCount / totalQuestions) * 100);
  const canSubmit = answeredCount === totalQuestions;

  const summaryText = useMemo(() => {
    return [
      '200道题，五级倾向作答',
      '每题只选最贴近你日常状态的一侧',
      '支持自动保存进度，可随时回来继续',
    ];
  }, []);

  const handleStart = () => {
    setAnswers(createEmptyAnswers());
    setCurrentQ(0);
    localStorage.removeItem(MBTI_DRAFT_KEY);
    setDraft(null);
    setStarted(true);
  };

  const handleResume = () => {
    if (!draft) {
      return;
    }

    setAnswers(draft.answers);
    setCurrentQ(draft.currentQ);
    setStarted(true);
  };

  const handleAnswer = (value: MBTIAnswerValue) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[currentQ] = value;
      return next;
    });

    if (currentQ < totalQuestions - 1) {
      window.setTimeout(() => {
        setCurrentQ((previous) => Math.min(previous + 1, totalQuestions - 1));
      }, 160);
    }
  };

  const handleSubmit = () => {
    const result = calculateMBTIResult(answers);
    const historyEntry = {
      timestamp: Date.now(),
      ...result,
    };

    let existing: unknown = [];

    try {
      existing = JSON.parse(localStorage.getItem('mbti_results') || '[]');
    } catch {
      existing = [];
    }

    const history = Array.isArray(existing) ? existing : [];
    history.push(historyEntry);

    localStorage.setItem('mbti_results', JSON.stringify(history));
    localStorage.setItem('mbti_latest_result', JSON.stringify(result));
    localStorage.removeItem(MBTI_DRAFT_KEY);
    setDraft(null);
    router.push('/payment?testType=mbti');
  };

  if (!draftReady) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border border-violet-500/30 bg-violet-500/10" />
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">MBTI 量表载入中</p>
            <p className="mt-3 text-lg font-medium text-zinc-100">正在准备你的 200 题性格旅程...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 px-7 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.22),_transparent_38%),radial-gradient(circle_at_80%_20%,_rgba(217,70,239,0.18),_transparent_28%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center gap-3 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-violet-200">
                  <span>MBTI 200题进阶版</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span>五级倾向量表</span>
                </div>

                <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight text-zinc-50 sm:text-6xl sm:leading-[1.05]">
                  不再是匆忙二选一，而是一场更沉浸的性格剖面阅读。
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                  200 道题、四个部分、五个程度。你只需要按照日常状态判断自己更靠近哪一侧，系统会保留经典 16 型结果，同时给出更细腻的倾向强度。
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {summaryText.map((item, index) => (
                    <div key={item} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 px-5 py-5 backdrop-blur">
                      <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-zinc-500">0{index + 1}</p>
                      <p className="text-sm leading-7 text-zinc-200">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-[1.75rem] border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">4 个阶段</p>
                      <p className="mt-2 text-xl font-semibold text-zinc-50">从行为习惯到决策偏好，逐层展开</p>
                    </div>
                    <div className="hidden rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 sm:block">
                      一次完成更准确
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {MBTI_DIMENSIONS.map((dimension, index) => (
                      <div key={dimension.key} className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-5 py-5">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-violet-300/70">Part {index + 1}</p>
                        <p className="mt-3 text-lg font-semibold text-zinc-50">{dimension.sectionTitle}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{dimension.sectionSubtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur sm:p-10">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">开始前建议</p>
                <ul className="mt-5 space-y-4 text-sm leading-7 text-zinc-300">
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">约 25~35 分钟完成，尽量一次做完，但系统会自动保存进度。</li>
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">请按你平时最自然的状态作答，而不是理想中的自己。</li>
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">中间选项代表两边都不像或比较平衡，不必强迫自己偏向。</li>
                </ul>

                {draft ? (
                  <div className="mt-6 rounded-3xl border border-violet-500/25 bg-violet-500/10 px-5 py-5">
                    <p className="text-sm font-semibold text-violet-100">检测到上次进度</p>
                    <p className="mt-2 text-sm leading-6 text-violet-100/80">
                      你上次保存于 {formatSavedAt(draft.savedAt)}，当前已完成 {draft.answers.filter((answer) => answer !== null).length}/{totalQuestions} 题。
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-10 space-y-3">
                {draft ? (
                  <button
                    onClick={handleResume}
                    className="w-full rounded-2xl border border-violet-500/30 bg-violet-500 px-5 py-4 font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all duration-300 hover:bg-violet-400"
                  >
                    从上次进度继续
                  </button>
                ) : null}
                <button
                  onClick={handleStart}
                  className={`w-full rounded-2xl px-5 py-4 font-semibold transition-all duration-300 ${draft ? 'border border-zinc-700 bg-zinc-950 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900' : 'border border-violet-500/20 bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:bg-violet-400'}`}
                >
                  {draft ? '重新开始测试' : '开始测试'}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 pb-10 pt-20 text-zinc-100 sm:pb-16 sm:pt-24">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-zinc-900/90 backdrop-blur">
        <div
          className="h-full bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.8)] transition-all duration-500"
          style={{ width: `${Math.max(overallProgress, currentQ === 0 ? 1 : 0)}%` }}
        />
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.32em] text-violet-200">
                <span>Part {currentSection + 1}</span>
                <span className="h-1 w-1 rounded-full bg-violet-400" />
                <span>{sectionMeta.sectionTitle}</span>
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-zinc-50 sm:text-5xl">第 {question.no} 题</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">{sectionMeta.sectionSubtitle}</p>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">整体进度</p>
                <p className="mt-2 text-xl font-semibold text-zinc-50">{answeredCount}/{totalQuestions}</p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">本部分</p>
                <p className="mt-2 text-xl font-semibold text-zinc-50">{currentSectionAnswered}/{SECTION_SIZE}</p>
              </div>
              <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-violet-200/80">状态</p>
                <p className="mt-2 text-base font-medium text-violet-100">自动保存已开启</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
            <div>
              <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
                <span>总进度</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${Math.max(overallProgress, currentQ === 0 ? 1 : 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
                <span>{sectionMeta.sectionTitle}</span>
                <span>{Math.round((currentSectionAnswered / SECTION_SIZE) * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-fuchsia-500 transition-all duration-500" style={{ width: `${Math.max((currentSectionAnswered / SECTION_SIZE) * 100, currentQ % SECTION_SIZE === 0 ? 2 : 0)}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_32px_120px_rgba(0,0,0,0.48)]">
          <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_36%),linear-gradient(180deg,_rgba(24,24,27,0.98),_rgba(9,9,11,1))] px-6 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Question {currentQ + 1} of {totalQuestions}</p>
              <p className="mt-5 text-sm leading-7 text-violet-200/70">{question.prompt}</p>
              <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-[1.35] text-zinc-50 sm:text-5xl sm:leading-[1.2]">
                这一题里，你通常更接近哪一边？
              </h1>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-5 py-6 text-left">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">左侧描述</p>
                <p className="mt-3 text-lg font-medium leading-8 text-zinc-100">{question.leftLabel}</p>
              </div>
              <div className="text-center text-sm uppercase tracking-[0.4em] text-zinc-600">VS</div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-5 py-6 text-left lg:text-right">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">右侧描述</p>
                <p className="mt-3 text-lg font-medium leading-8 text-zinc-100">{question.rightLabel}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                  <span className="max-w-[42%] text-left text-[11px] leading-5 sm:text-xs">{question.leftLabel}</span>
                  <span className="text-zinc-700">平衡</span>
                  <span className="max-w-[42%] text-right text-[11px] leading-5 sm:text-xs">{question.rightLabel}</span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {SCALE_OPTIONS.map((option) => {
                    const isSelected = currentAnswer === option.value;
                    const isLeft = option.value < 3;
                    const isNeutral = option.value === 3;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`rounded-[1.5rem] border px-2 py-4 text-center transition-all duration-300 sm:px-4 sm:py-5 ${
                          isSelected
                            ? isNeutral
                              ? 'border-zinc-300 bg-zinc-100 text-zinc-950 shadow-[0_0_24px_rgba(255,255,255,0.16)]'
                              : isLeft
                                ? 'border-violet-400 bg-violet-500 text-white shadow-[0_0_28px_rgba(139,92,246,0.45)]'
                                : 'border-fuchsia-400 bg-fuchsia-500 text-white shadow-[0_0_28px_rgba(217,70,239,0.42)]'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-center">
                          <span
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                              isSelected ? 'bg-black/20 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {option.value}
                          </span>
                        </div>
                        <p className="text-sm font-semibold sm:text-base">{option.label}</p>
                        <p className={`mt-2 text-[11px] leading-5 sm:text-xs sm:leading-6 ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                          {option.value < 3 ? '更接近左侧描述' : option.value > 3 ? '更接近右侧描述' : '两边都能接受或差异不大'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm leading-6 text-zinc-500">
                当前答案{currentAnswer ? '已记录' : '尚未选择'}。你可以返回上一题修改，系统会实时保存。
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentQ((previous) => Math.max(0, previous - 1))}
                  disabled={currentQ === 0}
                  className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-medium text-zinc-200 transition-all duration-300 hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一题
                </button>
                {currentQ < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQ((previous) => Math.min(previous + 1, totalQuestions - 1))}
                    disabled={currentAnswer === null}
                    className="rounded-2xl border border-violet-500/30 bg-violet-500 px-5 py-3 font-medium text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all duration-300 hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    下一题
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="rounded-2xl border border-violet-500/30 bg-violet-500 px-5 py-3 font-medium text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all duration-300 hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    查看结果
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-50">200题作答总览</h2>
              <p className="mt-1 text-sm text-zinc-500">总览已经移到题目下方，方便先专注作答，再在需要时跳转检查。</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-200">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-violet-400" />当前题
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-700/80 px-3 py-1 text-zinc-100">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-zinc-300" />已作答
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-400">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-zinc-700" />未作答
              </span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-20">
              {answers.map((answer, index) => {
                const isAnswered = answer !== null;
                const isCurrent = index === currentQ;

                return (
                  <button
                    key={mbtiQuestions[index].no}
                    onClick={() => setCurrentQ(index)}
                    className={`group relative flex aspect-square items-center justify-center rounded-xl border text-[11px] font-semibold transition-all duration-200 sm:text-xs ${
                      isCurrent
                        ? 'z-10 scale-105 border-violet-400 bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.55)]'
                        : isAnswered
                          ? 'border-zinc-600 bg-zinc-700/80 text-zinc-100 hover:border-violet-400 hover:bg-zinc-700'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <span className="absolute inset-x-2 bottom-1 h-px rounded-full bg-current opacity-15" />
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
