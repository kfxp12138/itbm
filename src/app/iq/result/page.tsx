'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIQDescription } from '@/lib/iq-scoring';

interface IQResult {
  timestamp: number;
  score: number;
  correctCount: number;
  age: number;
}

function IQResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<IQResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (orderId) {
        setVerifying(true);
        try {
          const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
          const data = await response.json();

          if (!data.isPaid) {
            router.push('/payment?testType=iq');
            return;
          }


          // Try to use resultData from API, fallback to localStorage
          if (data.resultData) {
            setResult(JSON.parse(data.resultData));
          } else {
            const stored = localStorage.getItem('iq_latest_result');
            if (stored) {
              setResult(JSON.parse(stored));
            }
          }
        } catch (error) {
          console.error('Verify error:', error);
          router.push('/payment?testType=iq');
        } finally {
          setVerifying(false);
        }
      } else {
        // No orderId - fallback to localStorage (backward compatible)
        const stored = localStorage.getItem('iq_latest_result');
        if (stored) {
          setResult(JSON.parse(stored));
        }
      }
    };

    verifyAndLoad();
  }, [orderId, router]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const { level, description } = getIQDescription(result.score);

  const getScoreColor = (score: number) => {
    if (score >= 130) return 'text-purple-600';
    if (score >= 120) return 'text-indigo-600';
    if (score >= 110) return 'text-blue-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">测试结果</h1>
        <p className="text-gray-500 text-center mb-8">瑞文智力测试</p>

        {/* IQ Score */}
        <div className="text-center mb-8">
          <div className={`text-5xl sm:text-7xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}
          </div>
          <div className="text-gray-500 mt-2">IQ 分数</div>
        </div>

        {/* Level badge */}
        <div className="flex justify-center mb-6">
          <span className={`px-4 py-2 rounded-full text-lg font-medium ${
            result.score >= 120 ? 'bg-indigo-100 text-indigo-700' :
            result.score >= 90 ? 'bg-green-100 text-green-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {level}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mb-8">{description}</p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-8 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">正确题数</span>
            <span className="font-medium text-gray-800">{result.correctCount}/60</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">测试年龄</span>
            <span className="font-medium text-gray-800">{result.age} 岁</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">测试时间</span>
            <span className="font-medium text-gray-800">
              {new Date(result.timestamp).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/iq')}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IQResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <IQResultContent />
    </Suspense>
  );
}
