'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CareerResult } from '@/lib/career-scoring';

function CareerResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [result, setResult] = useState<CareerResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (orderId) {
        setVerifying(true);
        try {
          const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
          const data = await response.json();

          if (!data.isPaid) {
            router.push('/payment?testType=career');
            return;
          }


          // Try to use resultData from API, fallback to localStorage
          if (data.resultData) {
            setResult(JSON.parse(data.resultData));
          } else {
            const stored = localStorage.getItem('career_latest_result');
            if (stored) {
              setResult(JSON.parse(stored));
            }
          }
        } catch (error) {
          console.error('Verify error:', error);
          router.push('/payment?testType=career');
        } finally {
          setVerifying(false);
        }
      } else {
        // No orderId - fallback to localStorage (backward compatible)
        const stored = localStorage.getItem('career_latest_result');
        if (stored) {
          setResult(JSON.parse(stored));
        }
      }
    };

    verifyAndLoad();
  }, [orderId, router]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">验证支付中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const traitDescriptions: Record<string, string> = {
    '开放性': '反映你对新体验、创意和抽象思维的接受程度',
    '尽责性': '反映你做事的条理性、自律性和责任感',
    '外向性': '反映你的社交活跃度和从外部世界获取能量的程度',
    '宜人性': '反映你与他人合作、信任和体谅的倾向',
    '神经质': '反映你的情绪波动性和对压力的敏感程度',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* MBTI Type */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-gray-500 mb-2">你的MBTI类型</p>
          <div className="text-3xl sm:text-5xl font-bold text-emerald-600 mb-2">{result.mbtiType}</div>
          <div className="text-xl text-gray-700">{result.mbtiTypeName}</div>
        </div>

        {/* FFM Scores */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">大五人格分析</h2>
          <div className="space-y-5">
            {result.ffmScores.map((score) => (
              <div key={score.trait}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-700">{score.trait}</span>
                  <span className="text-emerald-600 font-bold">{score.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${score.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{traitDescriptions[score.trait]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">推荐职业方向</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.careers.map((career) => (
              <div
                key={career}
                className="bg-emerald-50 rounded-xl p-4 text-center hover:bg-emerald-100 transition-colors"
              >
                <span className="text-emerald-800 font-medium">{career}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/career')}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            重新测试
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-white text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CareerResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <CareerResultContent />
    </Suspense>
  );
}
