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
    const existing = JSON.parse(localStorage.getItem('career_results') || '[]');
    existing.push(entry);
    localStorage.setItem('career_results', JSON.stringify(existing));
    localStorage.setItem('career_latest_result', JSON.stringify(result));
    router.push('/payment?testType=career');
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <div className="text-4xl text-center mb-4">💼</div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">职业性格测试</h1>
          <div className="space-y-4 text-gray-600 mb-8">
            <p>本测试基于大五人格模型（BFI-10），通过10道简短的自我评估题目，分析你的五大人格特质，并映射到MBTI类型，为你推荐最适合的职业方向。</p>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="font-medium text-emerald-800 mb-2">五大人格特质：</p>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• 开放性 — 对新体验和创意的接受程度</li>
                <li>• 尽责性 — 做事的条理性和责任感</li>
                <li>• 外向性 — 社交活跃度和精力来源</li>
                <li>• 宜人性 — 与他人合作和信任的倾向</li>
                <li>• 神经质 — 情绪稳定性和压力应对</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">共10道题，约2分钟完成。请根据直觉作答。</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>第 {currentQ + 1}/10 题</span>
            <span>{question.trait}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-base sm:text-lg font-medium text-gray-800 text-center mb-6 sm:mb-8 min-h-[3rem] flex items-center justify-center">
          {question.text}
        </h2>

        {/* Likert Scale */}
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
        <div className="flex justify-between text-xs text-gray-400 mb-8 px-2">
          <span>非常不同意</span>
          <span>非常同意</span>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一题
          </button>
          {currentQ < 9 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={answers[currentQ] === null}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              查看结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
