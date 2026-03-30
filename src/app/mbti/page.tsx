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
  const currentSection = Math.floor(currentQ / 50);
  const sectionMeta = MBTI_DIMENSIONS[currentSection];
  const currentAnswer = answers[currentQ];
  const currentSectionAnswered = answers.slice(currentSection * 50, (currentSection + 1) * 50).filter((answer) => answer !== null).length;
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_transparent_35%),linear-gradient(135deg,_#f7f4ff,_#ede9fe_42%,_#f8fafc)] flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/70 p-8 max-w-md w-full text-center text-gray-600">
          正在加载测试...
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.2),_transparent_35%),linear-gradient(135deg,_#f7f4ff,_#ede9fe_42%,_#f8fafc)] px-4 py-10">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-violet-200/60 bg-white/85 backdrop-blur shadow-xl p-8 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 mb-6">
              <span>MBTI 200题进阶版</span>
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>五级倾向作答</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">更细腻地看见你的性格倾向，而不是只做二选一。</h1>
            <p className="text-base sm:text-lg text-gray-600 leading-8 mb-8">
              这版测试改成了 200 道题、五档倾向量表。每道题都会在同一条维度上给出左右两种偏好，你只需要选出自己更接近哪一边，以及偏向的程度。
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {summaryText.map((item) => (
                <div key={item} className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-4 text-sm leading-6 text-violet-900">
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-violet-950 via-violet-900 to-fuchsia-900 text-white p-6 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                {MBTI_DIMENSIONS.map((dimension, index) => (
                  <div key={dimension.key} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-violet-200 mb-2">Part {index + 1}</p>
                    <p className="text-lg font-semibold mb-1">{dimension.sectionTitle}</p>
                    <p className="text-sm leading-6 text-violet-100/80">{dimension.sectionSubtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/90 backdrop-blur shadow-xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600 mb-3">开始前建议</p>
              <ul className="space-y-3 text-sm leading-7 text-gray-600 mb-8">
                <li>• 约 25~35 分钟完成，尽量一次做完，但系统会自动保存进度。</li>
                <li>• 请按你平时最自然的状态作答，而不是理想中的自己。</li>
                <li>• 中间选项代表两边都不像或比较平衡，不必强迫自己偏向。</li>
              </ul>

              {draft ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-5 mb-6">
                  <p className="text-sm font-semibold text-violet-900 mb-1">检测到上次进度</p>
                  <p className="text-sm text-violet-700 leading-6">
                    你上次保存于 {formatSavedAt(draft.savedAt)}，当前已完成 {draft.answers.filter((answer) => answer !== null).length}/{totalQuestions} 题。
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {draft ? (
                <button
                  onClick={handleResume}
                  className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-white font-semibold shadow-lg shadow-violet-200 transition-all duration-300 hover:bg-violet-700"
                >
                  从上次进度继续
                </button>
              ) : null}
              <button
                onClick={handleStart}
                className={`w-full rounded-2xl px-5 py-4 font-semibold transition-all duration-300 ${draft ? 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50' : 'bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700'}`}
              >
                {draft ? '重新开始测试' : '开始测试'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),_transparent_30%),linear-gradient(180deg,_#f8f5ff_0%,_#f5f3ff_35%,_#ffffff_100%)] px-4 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 backdrop-blur shadow-xl p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-violet-700 uppercase mb-3">
                <span>Part {currentSection + 1}</span>
                <span className="h-1 w-1 rounded-full bg-violet-400" />
                <span>{sectionMeta.sectionTitle}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">第 {question.no} 题</h2>
              <p className="text-gray-600 leading-7 max-w-2xl">{sectionMeta.sectionSubtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
                <p className="text-xs text-violet-500 mb-1">整体进度</p>
                <p className="text-lg font-semibold text-violet-900">{answeredCount}/{totalQuestions}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">本部分</p>
                <p className="text-lg font-semibold text-gray-900">{currentSectionAnswered}/50</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>总进度 {overallProgress}%</span>
                <span>自动保存已开启</span>
              </div>
              <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${Math.max(overallProgress, currentQ === 0 ? 1 : 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{sectionMeta.sectionTitle}</span>
                <span>{Math.round((currentSectionAnswered / 50) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-violet-300 transition-all duration-300" style={{ width: `${Math.max((currentSectionAnswered / 50) * 100, currentQ % 50 === 0 ? 2 : 0)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/95 backdrop-blur shadow-xl p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-8">
            <p className="text-sm text-violet-500 mb-3">{question.prompt}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-relaxed max-w-3xl mx-auto">
              这一题里，你通常更接近哪一边？
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center mb-8">
            <div className="rounded-3xl border border-violet-200 bg-violet-50 px-5 py-5 text-left">
              <p className="text-xs uppercase tracking-[0.22em] text-violet-500 mb-2">左侧倾向 · {question.leftPole}</p>
              <p className="text-base sm:text-lg font-semibold text-violet-950 leading-7">{question.leftLabel}</p>
            </div>
            <div className="text-center text-sm font-medium text-gray-400">VS</div>
            <div className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 px-5 py-5 text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-500 mb-2">右侧倾向 · {question.rightPole}</p>
              <p className="text-base sm:text-lg font-semibold text-fuchsia-950 leading-7">{question.rightLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-5 mb-8">
            {SCALE_OPTIONS.map((option) => {
              const isSelected = currentAnswer === option.value;
              const isLeft = option.value < 3;
              const isNeutral = option.value === 3;

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`rounded-3xl border px-4 py-5 text-left transition-all duration-300 ${
                    isSelected
                      ? isNeutral
                        ? 'border-violet-400 bg-violet-100 shadow-lg shadow-violet-100'
                        : isLeft
                          ? 'border-violet-500 bg-violet-100 shadow-lg shadow-violet-100'
                          : 'border-fuchsia-500 bg-fuchsia-100 shadow-lg shadow-fuchsia-100'
                      : isNeutral
                        ? 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50'
                        : isLeft
                          ? 'border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50'
                          : 'border-fuchsia-200 bg-white hover:border-fuchsia-400 hover:bg-fuchsia-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {option.value}
                    </span>
                    <span className="text-xs text-gray-400">{option.tone}</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">{option.label}</p>
                  <p className="text-sm leading-6 text-gray-500">
                    {option.value < 3 ? `更像左侧：${question.leftLabel}` : option.value > 3 ? `更像右侧：${question.rightLabel}` : '两边都能接受或差异不大'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 leading-6">
              当前答案{currentAnswer ? '已记录' : '尚未选择'}。你可以返回上一题修改，系统会实时保存。
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentQ((previous) => Math.max(0, previous - 1))}
                disabled={currentQ === 0}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-gray-700 font-medium transition-all duration-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一题
              </button>
              {currentQ < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQ((previous) => Math.min(previous + 1, totalQuestions - 1))}
                  disabled={currentAnswer === null}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-white font-medium transition-all duration-300 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一题
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-white font-medium transition-all duration-300 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  查看结果
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
