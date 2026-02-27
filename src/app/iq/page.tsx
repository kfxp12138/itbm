'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SETS, QUESTIONS_PER_SET, TEST_DURATION_SECONDS, getQuestionImagePath, getAnswerCount } from '@/data/iq-data';
import { calculateIQScore } from '@/lib/iq-scoring';

type Step = 'age' | 'instructions' | 'test';

const TOTAL_QUESTIONS = SETS.length * QUESTIONS_PER_SET;

export default function IQTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('age');
  const [age, setAge] = useState<number>(25);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);

  const currentSet = Math.floor(currentQuestion / QUESTIONS_PER_SET);
  const questionInSet = (currentQuestion % QUESTIONS_PER_SET) + 1;

  const submitTest = useCallback(() => {
    const { score, correctCount } = calculateIQScore(answers, age);
    const result = {
      timestamp: Date.now(),
      score,
      correctCount,
      age,
    };
    const existing = JSON.parse(localStorage.getItem('iq_results') || '[]');
    existing.push(result);
    localStorage.setItem('iq_results', JSON.stringify(existing));
    localStorage.setItem('iq_latest_result', JSON.stringify(result));
    router.push('/payment?testType=iq');
  }, [answers, age, router]);

  useEffect(() => {
    if (step !== 'test') return;
    if (timeLeft <= 0) {
      submitTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft, submitTest]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < TOTAL_QUESTIONS) {
      setCurrentQuestion(index);
    }
  };

  const goToSet = (setIndex: number) => {
    setCurrentQuestion(setIndex * QUESTIONS_PER_SET);
  };

  if (step === 'age') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">瑞文智力测试</h1>
          <p className="text-gray-600 text-center mb-8">请输入您的年龄以开始测试</p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
            <input
              type="number"
              min={10}
              max={80}
              value={age}
              onChange={(e) => setAge(Math.min(80, Math.max(10, parseInt(e.target.value) || 10)))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
          </div>
          <button
            onClick={() => setStep('instructions')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  if (step === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">测试说明</h1>
          <div className="space-y-4 text-gray-600 mb-8">
            <p>本测试是瑞文标准推理测验（Raven&apos;s Progressive Matrices），用于评估您的逻辑推理能力。</p>
            <ul className="list-disc list-inside space-y-2">
              <li>共 60 道图形推理题，分为 A、B、C、D、E 五组</li>
              <li>每题有一个图形矩阵，需要找出缺失的部分</li>
              <li>测试时间为 20 分钟</li>
              <li>时间结束后将自动提交</li>
              <li>可以在各组之间自由切换</li>
            </ul>
            <p className="font-medium text-gray-800">准备好后，点击开始测试。</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep('age')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              返回
            </button>
            <button
              onClick={() => setStep('test')}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              开始测试
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answerCount = getAnswerCount(currentQuestion);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="text-gray-700 font-medium text-sm sm:text-base">
          第 {currentQuestion + 1}/{TOTAL_QUESTIONS} 题 (组 {SETS[currentSet]})
        </div>
        <div className={`font-mono text-base sm:text-lg font-bold ${timeLeft <= 60 ? 'text-red-600' : 'text-indigo-600'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Set tabs */}
      <div className="bg-white border-b px-2 sm:px-4 py-2 flex gap-1 sm:gap-2 overflow-x-auto">
        {SETS.map((set, index) => (
          <button
            key={set}
            onClick={() => goToSet(index)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex-shrink-0 ${
              currentSet === index
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {set}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 flex flex-col items-center">
        {/* Question image */}
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 mb-4 sm:mb-6 w-full max-w-2xl">
          <div className="relative aspect-square w-full">
            <Image
              src={getQuestionImagePath(currentQuestion)}
              alt={`问题 ${currentQuestion + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md w-full mb-4 sm:mb-6">
          {Array.from({ length: answerCount }, (_, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(i)}
              className={`py-4 rounded-lg font-bold text-lg transition-colors ${
                answers[currentQuestion] === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-indigo-100 border border-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 max-w-md w-full">
          <button
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一题
          </button>
          {currentQuestion < TOTAL_QUESTIONS - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestion + 1)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={submitTest}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              完成测试
            </button>
          )}
        </div>

        {/* Submit button (always visible) */}
        <button
          onClick={submitTest}
          className="mt-6 px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          提前交卷
        </button>
      </div>
    </div>
  );
}
