'use client';

import { Suspense, useState, useLayoutEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const TEST_NAMES: Record<string, string> = {
  mbti: 'MBTI人格测试',
  iq: 'IQ智力测试',
  career: '职业性格测试',
};

const TEST_PRICES: Record<string, string> = {
  mbti: '¥9.99',
  iq: '¥19.99',
  career: '¥9.99',
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testType = searchParams.get('testType') || '';

  // Validate testType synchronously
  const isValidTestType = ['mbti', 'iq', 'career'].includes(testType);

  const [selectedMethod, setSelectedMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultData] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && testType && isValidTestType) {
      return localStorage.getItem(`${testType}_latest_result`);
    }
    return null;
  });

  // Redirect if invalid - using useLayoutEffect to run before paint
  useLayoutEffect(() => {
    if (!testType || !isValidTestType) {
      router.push('/');
    }
  }, [testType, isValidTestType, router]);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          paymentMethod: selectedMethod,
          email: email || undefined,
          resultData: resultData || undefined,
        }),
      });

      const data = await response.json();

      if (data.mode === 'sandbox' && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.mode === 'production') {
        alert(data.message || '生产环境支付接口待接入');
        setSubmitting(false);
      } else {
        alert(data.error || '创建订单失败');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('网络错误，请重试');
      setSubmitting(false);
    }
  };

  if (!isValidTestType) {
    return (
      <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-zinc-300">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <p className="section-kicker text-center">Payment</p>
        <h1 className="mb-2 mt-4 text-center text-2xl font-bold text-zinc-50">确认支付</h1>
        <p className="mb-6 text-center text-zinc-400">完成支付后查看测试结果</p>

        {/* Test Info */}
        <div className="glass-card-soft mb-6 rounded-[1.5rem] p-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">测试项目</span>
            <span className="font-medium text-zinc-100">{TEST_NAMES[testType] || testType}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-zinc-400">支付金额</span>
            <span className="text-xl font-bold text-amber-300">{TEST_PRICES[testType] || '¥9.99'}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-zinc-300">选择支付方式</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMethod('wechat')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedMethod === 'wechat'
                  ? 'border-emerald-400 bg-emerald-500/12'
                  : 'border-white/8 bg-black/20 hover:border-emerald-400/40'
               }`}
            >
              <span className="text-2xl">💬</span>
              <span className={`text-sm font-medium ${selectedMethod === 'wechat' ? 'text-emerald-200' : 'text-zinc-400'}`}>
                微信支付
              </span>
            </button>
            <button
              onClick={() => setSelectedMethod('alipay')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedMethod === 'alipay'
                  ? 'border-blue-400 bg-blue-500/12'
                  : 'border-white/8 bg-black/20 hover:border-blue-400/40'
               }`}
            >
              <span className="text-2xl">💳</span>
              <span className={`text-sm font-medium ${selectedMethod === 'alipay' ? 'text-blue-200' : 'text-zinc-400'}`}>
                支付宝
              </span>
            </button>
          </div>
        </div>

        {/* Email Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            邮箱（可选，用于接收结果）
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="app-input px-4 py-3"
          />
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full rounded-2xl border border-amber-500/30 bg-amber-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(245,158,11,0.25)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? '处理中...' : '确认支付'}
        </button>

        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="mt-3 w-full text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          返回
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="text-zinc-300">加载中...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
