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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">确认支付</h1>
        <p className="text-gray-500 text-center mb-6">完成支付后查看测试结果</p>

        {/* Test Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">测试项目</span>
            <span className="font-medium text-gray-800">{TEST_NAMES[testType] || testType}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">支付金额</span>
            <span className="text-xl font-bold text-indigo-600">{TEST_PRICES[testType] || '¥9.99'}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">选择支付方式</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMethod('wechat')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedMethod === 'wechat'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <span className="text-2xl">💬</span>
              <span className={`text-sm font-medium ${selectedMethod === 'wechat' ? 'text-green-700' : 'text-gray-600'}`}>
                微信支付
              </span>
            </button>
            <button
              onClick={() => setSelectedMethod('alipay')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedMethod === 'alipay'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">💳</span>
              <span className={`text-sm font-medium ${selectedMethod === 'alipay' ? 'text-blue-700' : 'text-gray-600'}`}>
                支付宝
              </span>
            </button>
          </div>
        </div>

        {/* Email Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱（可选，用于接收结果）
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '处理中...' : '确认支付'}
        </button>

        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
