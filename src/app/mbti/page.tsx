'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mbtiQuestions } from '@/data/mbti-questions';
import { getQuestionScore, calculateMBTIType } from '@/lib/mbti-scoring';

export default function MBTITestPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<("A" | "B" | null)[]>(Array(70).fill(null));

  const handleAnswer = (answer: "A" | "B") => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = answer;
    setAnswers(newAnswers);
    if (currentQ < 69) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200);
    }
  };

  const handleSubmit = () => {
    const scores = answers.map((a, i) => {
      if (!a) return 'E';
      return getQuestionScore(mbtiQuestions[i].no, a);
    });
    const { type, counts } = calculateMBTIType(scores);
    const entry = { timestamp: Date.now(), type, scores };
    const existing = JSON.parse(localStorage.getItem('mbti_results') || '[]');
    existing.push(entry);
    localStorage.setItem('mbti_results', JSON.stringify(existing));
    localStorage.setItem('mbti_latest_result', JSON.stringify({ type, counts }));
    router.push('/payment?testType=mbti');
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <div className="text-4xl text-center mb-4">🧠</div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">MBTI人格测试</h1>
          <div className="space-y-4 text-gray-600 mb-8">
            <p>MBTI（迈尔斯-布里格斯类型指标）是世界上最广泛使用的人格类型理论之一，将人格分为16种类型。</p>
            <div className="bg-violet-50 rounded-lg p-4">
              <p className="font-medium text-violet-800 mb-2">四个维度：</p>
              <ul className="text-sm text-violet-700 space-y-1">
                <li>• 外向(E) vs 内向(I) — 精力来源</li>
                <li>• 实感(S) vs 直觉(N) — 信息获取方式</li>
                <li>• 思维(T) vs 情感(F) — 决策方式</li>
                <li>• 判断(J) vs 知觉(P) — 生活方式</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">共70道题，每题二选一，约15分钟完成。请根据直觉作答。</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            开始测试
          </button>
        </div>
      </div>
    );
  }

  const question = mbtiQuestions[currentQ];
  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>第 {currentQ + 1}/70 题</span>
            <span>已答 {answeredCount}/70</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / 70) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-lg font-medium text-gray-800 text-center mb-8 min-h-[3rem] flex items-center justify-center">
          {question.question}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {question.answerOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleAnswer(opt.type as "A" | "B")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                answers[currentQ] === opt.type
                  ? 'border-violet-500 bg-violet-50 text-violet-800'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 text-gray-700'
              }`}
            >
              <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 text-sm font-bold ${
                answers[currentQ] === opt.type
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {opt.type}
              </span>
              {opt.answer}
            </button>
          ))}
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
          {currentQ < 69 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={answers[currentQ] === null}
              className="flex-1 bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < 70}
              className="flex-1 bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              查看结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
