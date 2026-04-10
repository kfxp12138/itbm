'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MBTI_DIMENSIONS, mbtiQuestions } from '@/data/mbti-questions';
import { calculateMBTIResult, type MBTIAnswerValue } from '@/lib/mbti-scoring';
import { savePendingResult } from '@/lib/client-result-storage';

const MBTI_DRAFT_KEY = 'mbti_draft_v2';
const SECTION_SIZE = 50;

interface MBTIDraft {
  currentQ: number;
  answers: Array<MBTIAnswerValue | null>;
  savedAt: number;
}

const SCALE_OPTIONS: Array<{ value: MBTIAnswerValue; tone: string; size: string }> = [
  { value: 1, tone: '非常符合', size: 'h-10 w-10 sm:h-16 sm:w-16' },
  { value: 2, tone: '比较符合', size: 'h-10 w-10 sm:h-14 sm:w-14' },
  { value: 3, tone: '中立', size: 'h-10 w-10 sm:h-12 sm:w-12' },
  { value: 4, tone: '比较符合', size: 'h-10 w-10 sm:h-14 sm:w-14' },
  { value: 5, tone: '非常符合', size: 'h-10 w-10 sm:h-16 sm:w-16' },
];

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

    return {
      answers: parsed.answers.map((answer) => (answer === 1 || answer === 2 || answer === 3 || answer === 4 || answer === 5 ? answer : null)),
      currentQ: Math.min(Math.max(parsed.currentQ, 0), mbtiQuestions.length - 1),
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
      setDraft(parseDraft(localStorage.getItem(MBTI_DRAFT_KEY)));
      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    localStorage.setItem(
      MBTI_DRAFT_KEY,
      JSON.stringify({
        currentQ,
        answers,
        savedAt: Date.now(),
      } satisfies MBTIDraft)
    );
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

  const summaryText = useMemo(
    () => ['200 道题，5 级作答', '四个部分逐步完成', '自动保存进度，完成后查看完整画像'],
    []
  );

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
    savePendingResult('mbti', result);
    localStorage.removeItem(MBTI_DRAFT_KEY);
    setDraft(null);
    router.push('/payment?testType=mbti');
  };

  if (!draftReady) {
    return (
      <div className="app-shell-module-violet px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="glass-card w-full rounded-[2rem] p-8 text-center">
            <p className="section-kicker justify-center">MBTI</p>
            <p className="mt-4 text-lg font-medium text-slate-900">正在加载完整版测试...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="app-shell-module-violet px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="glass-card relative overflow-hidden rounded-[2rem] px-7 py-8 sm:px-10 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.14),_transparent_36%),radial-gradient(circle_at_85%_15%,_rgba(217,70,239,0.08),_transparent_24%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-3 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-violet-700">
                  <span>MBTI 完整版</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span>200 题</span>
                </div>

                <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-6xl sm:leading-[1.05]">
                  用更完整的题量，看到更稳定的 MBTI 结果和四维倾向。
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  测试共 200 题，分为 4 个部分，采用 5 级作答。完成后会给出 16 型结果、四个维度倾向以及详细的人格解读。
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {summaryText.map((item, index) => (
                    <div key={item} className="glass-card-soft rounded-[1.5rem] px-5 py-5">
                      <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-slate-400">0{index + 1}</p>
                      <p className="text-sm leading-7 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-[1.75rem] border border-white/70 bg-white/70 p-5 backdrop-blur sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-400">4 个阶段</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">覆盖能量、信息、决策与节奏四个核心维度</p>
                    </div>
                    <div className="hidden rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-700 sm:block">
                      建议一次完成
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {MBTI_DIMENSIONS.map((dimension, index) => (
                      <div key={dimension.key} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-violet-500/80">Part {index + 1}</p>
                        <p className="mt-3 text-lg font-semibold text-slate-900">{dimension.sectionTitle}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{dimension.sectionSubtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="glass-card rounded-[2rem] p-8 sm:p-10">
              <p className="section-kicker">完整版说明</p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <li className="glass-card-soft rounded-2xl px-4 py-4">适合想看详细人格解读和四维倾向的人。</li>
                <li className="glass-card-soft rounded-2xl px-4 py-4">请按自己平时的真实状态作答，不必追求理想答案。</li>
                <li className="glass-card-soft rounded-2xl px-4 py-4">如果想先快速试一版，也可以先做 20 题免费版。</li>
              </ul>

              {draft ? (
                <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 px-5 py-5">
                  <p className="text-sm font-semibold text-violet-700">检测到上次进度</p>
                  <p className="mt-2 text-sm leading-6 text-violet-700/80">
                    你上次保存于 {formatSavedAt(draft.savedAt)}，当前已完成 {draft.answers.filter((answer) => answer !== null).length}/{totalQuestions} 题。
                  </p>
                </div>
              ) : null}

              <div className="mt-8 space-y-3">
                {draft ? (
                  <button onClick={handleResume} className="app-button-primary w-full justify-center px-5 py-4 text-sm font-semibold">
                    从上次进度继续
                  </button>
                ) : null}
                <button
                  onClick={handleStart}
                  className={draft ? 'app-button-secondary w-full justify-center px-5 py-4 text-sm font-semibold' : 'app-button-primary w-full justify-center px-5 py-4 text-sm font-semibold'}
                >
                  {draft ? '重新开始完整版' : '开始完整版测试'}
                </button>
                <button onClick={() => router.push('/mbti/free')} className="app-button-secondary w-full justify-center px-5 py-4 text-sm font-semibold">
                  先做 20 题免费版
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-module-violet px-4 pb-10 pt-20 sm:pb-16 sm:pt-24">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-violet-100/80 backdrop-blur">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${Math.max(overallProgress, currentQ === 0 ? 1 : 0)}%` }} />
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.32em] text-violet-700">
                <span>Part {currentSection + 1}</span>
                <span className="h-1 w-1 rounded-full bg-violet-500" />
                <span>{sectionMeta.sectionTitle}</span>
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-5xl">第 {question.no} 题</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{sectionMeta.sectionSubtitle}</p>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className="glass-card-soft rounded-[1.5rem] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">整体进度</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{answeredCount}/{totalQuestions}</p>
              </div>
              <div className="glass-card-soft rounded-[1.5rem] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">本部分</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{currentSectionAnswered}/{SECTION_SIZE}</p>
              </div>
              <div className="rounded-[1.5rem] border border-violet-200 bg-violet-50 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-violet-500/80">状态</p>
                <p className="mt-2 text-base font-medium text-violet-700">自动保存已开启</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
            <div>
              <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                <span>总进度</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${Math.max(overallProgress, currentQ === 0 ? 1 : 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                <span>{sectionMeta.sectionTitle}</span>
                <span>{Math.round((currentSectionAnswered / SECTION_SIZE) * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-400 transition-all duration-500" style={{ width: `${Math.max((currentSectionAnswered / SECTION_SIZE) * 100, currentQ % SECTION_SIZE === 0 ? 2 : 0)}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card overflow-hidden rounded-[2rem]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,0.95))] px-6 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Question {currentQ + 1} of {totalQuestions}</p>
              <h1 className="mx-auto mt-5 max-w-3xl text-2xl font-semibold leading-[1.55] text-slate-900 sm:text-4xl sm:leading-[1.35]">
                {question.prompt}
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">请选择更符合你日常状态的一侧</p>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left sm:rounded-3xl sm:px-6 sm:py-8">
                <p className="text-[15px] font-medium leading-6 text-slate-900 sm:text-2xl sm:leading-10">{question.leftLabel}</p>
              </div>
              <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-right sm:rounded-3xl sm:px-6 sm:py-8">
                <p className="text-[15px] font-medium leading-6 text-slate-900 sm:text-2xl sm:leading-10">{question.rightLabel}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 sm:mt-10 sm:p-5">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-6">
                <div className="relative mx-auto max-w-3xl">
                  <div className="absolute left-1/2 top-6 h-px w-[calc(100%-5rem)] -translate-x-1/2 -translate-y-1/2 bg-slate-200 sm:left-[10%] sm:right-[10%] sm:w-auto sm:translate-x-0 sm:top-8" />
                  <div className="relative grid grid-cols-5 gap-1 sm:gap-4">
                    {SCALE_OPTIONS.map((option) => {
                      const isSelected = currentAnswer === option.value;
                      const isLeft = option.value < 3;
                      const isNeutral = option.value === 3;

                      return (
                        <div key={option.value} className="flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3">
                          <div className="flex h-12 w-full items-center justify-center sm:h-16">
                            <button
                              onClick={() => handleAnswer(option.value)}
                              className={`mx-auto shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 ${option.size} ${
                                isSelected
                                  ? isNeutral
                                    ? 'border-slate-300 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] sm:scale-110 sm:shadow-[0_10px_24px_rgba(15,23,42,0.15)]'
                                    : isLeft
                                      ? 'border-violet-300 bg-violet-500 text-white shadow-[0_10px_22px_rgba(139,92,246,0.18)] sm:scale-110 sm:shadow-[0_12px_28px_rgba(139,92,246,0.25)]'
                                      : 'border-fuchsia-300 bg-fuchsia-500 text-white shadow-[0_10px_22px_rgba(217,70,239,0.18)] sm:scale-110 sm:shadow-[0_12px_28px_rgba(217,70,239,0.22)]'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 sm:hover:-translate-y-1'
                              }`}
                              aria-label={`选择第 ${option.value} 档`}
                            >
                              {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-current sm:h-3 sm:w-3" /> : null}
                            </button>
                          </div>
                          <p className={`min-h-8 text-[9px] font-medium leading-4 sm:min-h-0 sm:text-xs ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                            {option.tone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm leading-6 text-slate-500">当前答案{currentAnswer ? '已记录' : '尚未选择'}，可返回上一题修改，系统会自动保存。</div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentQ((previous) => Math.max(0, previous - 1))}
                  disabled={currentQ === 0}
                  className="app-button-secondary rounded-2xl px-5 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一题
                </button>
                {currentQ < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQ((previous) => Math.min(previous + 1, totalQuestions - 1))}
                    disabled={currentAnswer === null}
                    className="app-button-primary rounded-2xl px-5 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    下一题
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="app-button-primary rounded-2xl px-5 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    查看完整版结果
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">200 题作答总览</h2>
              <p className="mt-1 text-sm text-slate-500">可在下方查看作答情况，并跳转到任意题目。</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-violet-500" />当前题
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-slate-400" />已作答
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500">
                <span className="h-2.5 w-2.5 rounded-[4px] bg-slate-200" />未作答
              </span>
            </div>
          </div>

          <div className="glass-card-soft rounded-[1.75rem] p-4 sm:p-6">
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
                        ? 'z-10 scale-105 border-violet-300 bg-violet-500 text-white shadow-[0_10px_22px_rgba(139,92,246,0.22)]'
                        : isAnswered
                          ? 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
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
