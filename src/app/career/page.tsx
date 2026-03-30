'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { careerQuestions } from '@/data/career-data';
import { calculateCareerResult } from '@/lib/career-scoring';

const LIKERT_OPTIONS = [
  { value: 1, label: '非常不同意', color: 'bg-red-500', hoverColor: 'hover:bg-red-400', size: 'w-11 h-11 sm:w-12 sm:h-12' },
  { value: 2, label: '不同意', color: 'bg-orange-400', hoverColor: 'hover:bg-orange-300', size: 'w-10 h-10' },
  { value: 3, label: '中立', color: 'bg-gray-400', hoverColor: 'hover:bg-gray-300', size: 'w-10 h-10 sm:w-9 sm:h-9' },
  { value: 4, label: '同意', color: 'bg-emerald-400', hoverColor: 'hover:bg-emerald-300', size: 'w-10 h-10' },
  { value: 5, label: '非常同意', color: 'bg-green-500', hoverColor: 'hover:bg-green-400', size: 'w-11 h-11 sm:w-12 sm:h-12' },
];

export default function CareerTestPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);

    if (currentQ < 9) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    }
  };

  const handleSubmit = () => {
    const validAnswers = answers.map(a => a ?? 3);
    const result = calculateCareerResult(validAnswers);
    const entry = {
      timestamp: Date.now(),
      mbtiType: result.mbtiType,
      ffmScores: result.ffmScores,
      careers: result.careers,
    };
    let existing: unknown = [];

    try {
      existing = JSON.parse(localStorage.getItem('career_results') || '[]');
    } catch {
      existing = [];
    }

    const history = Array.isArray(existing) ? existing : [];
    history.push(entry);
    localStorage.setItem('career_results', JSON.stringify(history));
    localStorage.setItem('career_latest_result', JSON.stringify(result));
    router.push('/payment?testType=career');
  };

  if (!started) {
    return (
      <div className="app-shell-module-emerald flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-lg rounded-[2rem] p-8">
          <div className="text-4xl text-center mb-4">💼</div>
          <h1 className="mb-4 text-center text-2xl font-bold text-slate-900">职业性格测试</h1>
          <div className="mb-8 space-y-4 text-slate-600">
            <p>本测试基于大五人格模型（BFI-10），通过10道简短的自我评估题目，分析你的五大人格特质，并映射到MBTI类型，为你推荐最适合的职业方向。</p>
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
              <p className="mb-2 font-medium text-emerald-700">五大人格特质：</p>
              <ul className="space-y-1 text-sm text-emerald-700/80">
                <li>• 开放性 — 对新体验和创意的接受程度</li>
                <li>• 尽责性 — 做事的条理性和责任感</li>
                <li>• 外向性 — 社交活跃度和精力来源</li>
                <li>• 宜人性 — 与他人合作和信任的倾向</li>
                <li>• 神经质 — 情绪稳定性和压力应对</li>
              </ul>
            </div>
            <p className="text-sm text-slate-500">共10道题，约2分钟完成。请根据直觉作答。</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400"
          >
            开始测试
          </button>
        </div>
      </div>
    );
  }

  const question = careerQuestions[currentQ];
  const allAnswered = answers.every(a => a !== null);

  return (
    <div className="app-shell-module-emerald flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg rounded-[2rem] p-8">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-slate-500">
            <span>第 {currentQ + 1}/10 题</span>
            <span>{question.trait}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-emerald-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentQ + 1) / 10) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="mb-6 flex min-h-[3rem] items-center justify-center text-center text-base font-medium text-slate-900 sm:mb-8 sm:text-lg">
          {question.text}
        </h2>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
          {LIKERT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className={`${opt.size} rounded-full transition-all duration-200 flex items-center justify-center text-white font-bold text-sm ${
                answers[currentQ] === opt.value
                  ? `${opt.color} ring-4 ring-offset-2 ring-emerald-300 scale-110`
                  : `${opt.color} opacity-60 ${opt.hoverColor} hover:opacity-100 hover:scale-105`
              }`}
            >
              {opt.value}
            </button>
          ))}
        </div>
        <div className="mb-8 flex justify-between px-2 text-xs text-slate-500">
          <span>非常不同意</span>
          <span>非常同意</span>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="app-button-secondary flex-1 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一题
          </button>
          {currentQ < 9 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={answers[currentQ] === null}
              className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              查看结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
