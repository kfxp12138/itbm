'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SETS, QUESTIONS_PER_SET, TEST_DURATION_SECONDS, getQuestionImagePath, getAnswerCount } from '@/data/iq-data';
import { calculateIQScore } from '@/lib/iq-scoring';

type Step = 'age' | 'instructions' | 'test';

const TOTAL_QUESTIONS = SETS.length * QUESTIONS_PER_SET;
const MIN_AGE = 10;
const MAX_AGE = 80;

function parseAgeInput(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < MIN_AGE || parsed > MAX_AGE) {
    return null;
  }

  return parsed;
}

export default function IQTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('age');
  const [age, setAge] = useState<number>(25);
  const [ageInput, setAgeInput] = useState('25');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const currentSet = Math.floor(currentQuestion / QUESTIONS_PER_SET);
  const submitTest = useCallback(() => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
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
    } catch (error) {
      console.error('IQ submit error:', error);
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, age, router]);

  const handleAgeChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setAgeInput(value);
      setAgeError(null);
    }
  };

  const goToInstructions = () => {
    const parsedAge = parseAgeInput(ageInput);

    if (parsedAge === null) {
      setAgeError(`请输入 ${MIN_AGE} - ${MAX_AGE} 岁之间的整数年龄`);
      return;
    }

    setAge(parsedAge);
    setAgeInput(String(parsedAge));
    setAgeError(null);
    setStep('instructions');
  };

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
      <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8">
          <p className="section-kicker text-center">IQ Test</p>
          <h1 className="mb-4 mt-4 text-center text-3xl font-bold text-slate-900">瑞文智力测试</h1>
          <p className="mb-8 text-center text-slate-600">请输入您的年龄以开始测试</p>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">年龄</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={ageInput}
              onChange={(e) => handleAgeChange(e.target.value)}
              className="app-input px-4 py-3 text-lg"
              placeholder="请输入 10 - 80 岁"
              aria-invalid={ageError ? 'true' : 'false'}
            />
            {ageError ? (
              <p className="mt-2 text-sm text-red-500">{ageError}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">支持直接输入年龄，不再只能用上下调节。</p>
            )}
          </div>
          <button
            onClick={goToInstructions}
            className="w-full rounded-2xl border border-blue-500/30 bg-blue-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition-colors hover:bg-blue-400"
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  if (step === 'instructions') {
    return (
      <div className="app-shell-module-indigo flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-lg rounded-[2rem] p-8">
          <p className="section-kicker text-center">Instructions</p>
          <h1 className="mb-6 mt-4 text-center text-3xl font-bold text-slate-900">测试说明</h1>
          <div className="mb-8 space-y-4 text-slate-600">
            <p>本测试是瑞文标准推理测验（Raven&apos;s Progressive Matrices），用于评估您的逻辑推理能力。</p>
            <ul className="list-disc list-inside space-y-2">
              <li>共 60 道图形推理题，分为 A、B、C、D、E 五组</li>
              <li>每题有一个图形矩阵，需要找出缺失的部分</li>
              <li>测试时间为 20 分钟</li>
              <li>时间结束后将自动提交</li>
              <li>可以在各组之间自由切换</li>
            </ul>
            <p className="font-medium text-slate-800">准备好后，点击开始测试。</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep('age')}
              className="app-button-secondary flex-1 py-3 font-medium"
            >
              返回
            </button>
            <button
              onClick={() => setStep('test')}
              className="flex-1 rounded-2xl border border-blue-500/30 bg-blue-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition-colors hover:bg-blue-400"
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
    <div className="app-shell-module-indigo min-h-screen flex flex-col">
      <div className="border-b border-slate-200/80 bg-white/75 px-4 py-3 backdrop-blur-xl">
        <div className="app-container flex items-center justify-between px-0">
          <div className="text-sm font-medium text-slate-700 sm:text-base">
          第 {currentQuestion + 1}/{TOTAL_QUESTIONS} 题 (组 {SETS[currentSet]})
          </div>
          <div className={`font-mono text-base font-bold sm:text-lg ${timeLeft <= 60 ? 'text-red-300' : 'text-blue-300'}`}>
          {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="app-container flex gap-1 overflow-x-auto px-4 py-3 sm:gap-2">
        {SETS.map((set, index) => (
          <button
            key={set}
            onClick={() => goToSet(index)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 sm:text-base ${
              currentSet === index
                ? 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.22)]'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50'
            }`}
          >
            {set}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="glass-card mb-4 w-full max-w-2xl rounded-[2rem] p-2 sm:mb-6 sm:p-4">
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

        <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:mb-6 sm:gap-3 sm:grid-cols-4">
          {Array.from({ length: answerCount }, (_, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(i)}
              className={`rounded-2xl py-4 text-lg font-bold transition-colors ${
                answers[currentQuestion] === i
                  ? 'bg-blue-500 text-white shadow-[0_0_22px_rgba(59,130,246,0.22)]'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-blue-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-md gap-4">
          <button
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
            className="app-button-secondary flex-1 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一题
          </button>
          {currentQuestion < TOTAL_QUESTIONS - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestion + 1)}
              className="flex-1 rounded-2xl border border-blue-500/30 bg-blue-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition-colors hover:bg-blue-400"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={submitTest}
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400"
            >
              {isSubmitting ? '提交中...' : '完成测试'}
            </button>
          )}
        </div>

        <button
          onClick={submitTest}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500 px-8 py-3 font-medium text-white shadow-[0_0_24px_rgba(245,158,11,0.25)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '提交中...' : '提前交卷'}
        </button>
        </div>
      </div>
    </div>
  );
}
