'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mbtiFreeQuestions } from '@/data/mbti-free-questions';
import { calculateFreeMBTIResult } from '@/lib/mbti-free-scoring';
import type { MBTIAnswerValue } from '@/lib/mbti-scoring';

const MBTI_FREE_DRAFT_KEY = 'mbti_free_draft_v1';

interface MBTIFreeDraft {
  currentQ: number;
  answers: Array<MBTIAnswerValue | null>;
  savedAt: number;
}

const SCALE_OPTIONS: Array<{ value: MBTIAnswerValue; label: string; size: string }> = [
  { value: 1, label: '非常符合', size: 'h-11 w-11 sm:h-16 sm:w-16' },
  { value: 2, label: '比较符合', size: 'h-10 w-10 sm:h-14 sm:w-14' },
  { value: 3, label: '中立', size: 'h-8 w-8 sm:h-12 sm:w-12' },
  { value: 4, label: '比较符合', size: 'h-10 w-10 sm:h-14 sm:w-14' },
  { value: 5, label: '非常符合', size: 'h-11 w-11 sm:h-16 sm:w-16' },
];

function createEmptyAnswers(): Array<MBTIAnswerValue | null> {
  return Array.from({ length: mbtiFreeQuestions.length }, () => null);
}

function parseDraft(raw: string | null): MBTIFreeDraft | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MBTIFreeDraft>;
    if (!Array.isArray(parsed.answers) || typeof parsed.currentQ !== 'number' || typeof parsed.savedAt !== 'number') {
      return null;
    }

    if (parsed.answers.length !== mbtiFreeQuestions.length) {
      return null;
    }

    return {
      answers: parsed.answers.map((answer) => (answer === 1 || answer === 2 || answer === 3 || answer === 4 || answer === 5 ? answer : null)),
      currentQ: Math.min(Math.max(parsed.currentQ, 0), mbtiFreeQuestions.length - 1),
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

export default function MBTIFreePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Array<MBTIAnswerValue | null>>(createEmptyAnswers);
  const [draft, setDraft] = useState<MBTIFreeDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(parseDraft(localStorage.getItem(MBTI_FREE_DRAFT_KEY)));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    localStorage.setItem(MBTI_FREE_DRAFT_KEY, JSON.stringify({ currentQ, answers, savedAt: Date.now() } satisfies MBTIFreeDraft));
  }, [answers, currentQ, started]);

  const totalQuestions = mbtiFreeQuestions.length;
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const question = mbtiFreeQuestions[currentQ];
  const currentAnswer = answers[currentQ];

  const saveResult = () => {
    const result = calculateFreeMBTIResult(answers, mbtiFreeQuestions);
    const historyEntry = { ...result, timestamp: result.completedAt };

    let existing: unknown = [];
    try {
      existing = JSON.parse(localStorage.getItem('mbti_free_results') || '[]');
    } catch {
      existing = [];
    }

    const history = Array.isArray(existing) ? existing : [];
    history.push(historyEntry);

    localStorage.setItem('mbti_free_results', JSON.stringify(history));
    localStorage.setItem('mbti_free_latest_result', JSON.stringify(result));
    localStorage.removeItem(MBTI_FREE_DRAFT_KEY);
    router.push('/mbti/free/result');
  };

  if (!ready) {
    return (
      <div className="app-shell-module-violet flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="section-kicker justify-center">Free MBTI</p>
          <p className="mt-4 text-lg font-medium text-slate-900">正在加载 20 题免费版...</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="app-shell-module-violet px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="glass-card rounded-[2rem] px-7 py-8 sm:px-10 sm:py-12">
              <div className="inline-flex items-center gap-3 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-fuchsia-700">
                <span>免费 MBTI</span>
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
                <span>20 题快速版</span>
              </div>
              <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl sm:leading-[1.08]">
                先用 20 道题，快速判断你的主 MBTI 类型。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                免费版会给出一个当前最接近的 MBTI 类型，以及几个可能接近的相邻类型。想看四维倾向和详细解读，再进入 200 题完整版。
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="section-kicker">01</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">20 题内完成，适合先快速看看自己的整体方向。</p>
                </div>
                <div className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="section-kicker">02</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">结果只展示主类型与可能接近的类型，不展开深度解析。</p>
                </div>
                <div className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="section-kicker">03</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">如果你想看更稳定的判断，可以继续做 200 题完整版。</p>
                </div>
              </div>
            </section>

            <aside className="glass-card rounded-[2rem] p-8 sm:p-10">
              <p className="section-kicker">适合谁先做</p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <li className="glass-card-soft rounded-2xl px-4 py-4">第一次接触 MBTI，想先快速了解一个大致方向。</li>
                <li className="glass-card-soft rounded-2xl px-4 py-4">时间有限，只想先知道自己最可能是哪一类。</li>
                <li className="glass-card-soft rounded-2xl px-4 py-4">做完之后再决定是否继续做 200 题完整版。</li>
              </ul>

              {draft ? (
                <div className="mt-6 rounded-3xl border border-fuchsia-200 bg-fuchsia-50 px-5 py-5">
                  <p className="text-sm font-semibold text-fuchsia-700">检测到上次进度</p>
                  <p className="mt-2 text-sm leading-6 text-fuchsia-700/80">
                    你上次保存于 {formatSavedAt(draft.savedAt)}，当前已完成 {draft.answers.filter((answer) => answer !== null).length}/{totalQuestions} 题。
                  </p>
                </div>
              ) : null}

              <div className="mt-8 space-y-3">
                {draft ? (
                  <button
                    onClick={() => {
                      if (!draft) return;
                      setAnswers(draft.answers);
                      setCurrentQ(draft.currentQ);
                      setStarted(true);
                    }}
                    className="app-button-primary w-full justify-center px-5 py-4 text-sm font-semibold"
                  >
                    从上次进度继续
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setAnswers(createEmptyAnswers());
                    setCurrentQ(0);
                    localStorage.removeItem(MBTI_FREE_DRAFT_KEY);
                    setDraft(null);
                    setStarted(true);
                  }}
                  className={draft ? 'app-button-secondary w-full justify-center px-5 py-4 text-sm font-semibold' : 'app-button-primary w-full justify-center px-5 py-4 text-sm font-semibold'}
                >
                  {draft ? '重新开始免费版' : '开始 20 题免费版'}
                </button>
                <button onClick={() => router.push('/mbti')} className="app-button-secondary w-full justify-center px-5 py-4 text-sm font-semibold">
                  去做 200 题完整版
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
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-fuchsia-100/90 backdrop-blur">
        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500" style={{ width: `${Math.max(Math.round((answeredCount / totalQuestions) * 100), currentQ === 0 ? 1 : 0)}%` }} />
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Free MBTI</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">第 {question.no} / {totalQuestions} 题</h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">快速版只保留 20 道代表性题目，用来判断你的主类型和接近类型。</p>
            </div>
            <div className="rounded-[1.5rem] border border-fuchsia-200 bg-fuchsia-50 px-5 py-4 text-sm text-fuchsia-700">
              已完成 {answeredCount}/{totalQuestions}
            </div>
          </div>
        </section>

        <section className="glass-card overflow-hidden rounded-[2rem]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.1),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,0.95))] px-6 py-10 sm:px-10 sm:py-14">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Question {currentQ + 1}</p>
              <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-semibold leading-[1.55] text-slate-900 sm:text-4xl sm:leading-[1.35]">{question.prompt}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">请选择更符合你日常状态的一侧</p>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-left sm:rounded-3xl sm:px-6 sm:py-8">
                <p className="text-[15px] font-medium leading-6 text-slate-900 sm:text-2xl sm:leading-10">{question.leftLabel}</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-right sm:rounded-3xl sm:px-6 sm:py-8">
                <p className="text-[15px] font-medium leading-6 text-slate-900 sm:text-2xl sm:leading-10">{question.rightLabel}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-6">
                <div className="relative mx-auto max-w-3xl">
                  <div className="absolute left-[12%] right-[12%] top-5 h-px bg-slate-200 sm:left-[10%] sm:right-[10%] sm:top-8" />
                  <div className="relative flex items-start justify-between gap-1 sm:gap-4">
                    {SCALE_OPTIONS.map((option) => {
                      const isSelected = currentAnswer === option.value;
                      const isLeft = option.value < 3;
                      const isNeutral = option.value === 3;

                      return (
                        <div key={option.value} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:gap-3">
                          <button
                            onClick={() => {
                              setAnswers((previous) => {
                                const next = [...previous];
                                next[currentQ] = option.value;
                                return next;
                              });

                              if (currentQ < totalQuestions - 1) {
                                window.setTimeout(() => setCurrentQ((previous) => Math.min(previous + 1, totalQuestions - 1)), 160);
                              }
                            }}
                            className={`mx-auto flex items-center justify-center rounded-full border transition-all duration-300 ${option.size} ${
                              isSelected
                                ? isNeutral
                                  ? 'border-slate-300 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] sm:scale-110 sm:shadow-[0_10px_24px_rgba(15,23,42,0.15)]'
                                  : isLeft
                                    ? 'border-fuchsia-300 bg-fuchsia-500 text-white shadow-[0_10px_22px_rgba(217,70,239,0.18)] sm:scale-110 sm:shadow-[0_12px_28px_rgba(217,70,239,0.22)]'
                                    : 'border-violet-300 bg-violet-500 text-white shadow-[0_10px_22px_rgba(139,92,246,0.18)] sm:scale-110 sm:shadow-[0_12px_28px_rgba(139,92,246,0.22)]'
                                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 sm:hover:-translate-y-1'
                            }`}
                          >
                            {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-current sm:h-3 sm:w-3" /> : null}
                          </button>
                          <p className={`min-h-8 text-[9px] font-medium leading-4 sm:min-h-0 sm:text-xs ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                            {option.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm leading-6 text-slate-500">当前答案{currentAnswer ? '已记录' : '尚未选择'}，系统会自动保存。</div>

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
                    onClick={saveResult}
                    disabled={answeredCount !== totalQuestions}
                    className="app-button-primary rounded-2xl px-5 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    查看免费结果
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
