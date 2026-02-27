'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const TEST_NAMES: Record<string, string> = {
  mbti: 'MBTI人格测试',
  iq: 'IQ智力测试',
  career: '职业性格测试',
};

interface OrderInfo {
  orderId: string;
  testType: string;
  status: string;
  isPaid: boolean;
}

function SandboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '';

  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('缺少订单ID');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = await response.json();

        if (response.ok) {
          setOrderInfo(data);
        } else {
          setError(data.error || '获取订单信息失败');
        }
      } catch (err) {
        console.error('Fetch order error:', err);
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleConfirm = async () => {
    if (confirming || !orderInfo) return;
    setConfirming(true);

    try {
      const response = await fetch('/api/payment/sandbox-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/${data.testType}/result?orderId=${orderId}`);
      } else {
        alert(data.error || '确认支付失败');
        setConfirming(false);
      }
    } catch (err) {
      console.error('Confirm error:', err);
      alert('网络错误，请重试');
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        {/* Sandbox Warning */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-6">
          <p className="text-yellow-800 text-sm text-center font-medium">
            ⚠️ 沙盒模式 — 仅用于开发测试
          </p>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">模拟支付</h1>
        <p className="text-gray-500 text-center mb-6">点击下方按钮模拟支付成功</p>

        {/* Order Info */}
        {orderInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">订单号</span>
              <span className="font-mono text-sm text-gray-700">{orderInfo.orderId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">测试项目</span>
              <span className="font-medium text-gray-800">{TEST_NAMES[orderInfo.testType] || orderInfo.testType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">订单状态</span>
              <span className={`font-medium ${orderInfo.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                {orderInfo.isPaid ? '已支付' : '待支付'}
              </span>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {orderInfo && !orderInfo.isPaid && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? '处理中...' : '✓ 模拟支付成功'}
          </button>
        )}

        {orderInfo && orderInfo.isPaid && (
          <button
            onClick={() => router.push(`/${orderInfo.testType}/result?orderId=${orderId}`)}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors"
          >
            查看结果
          </button>
        )}

        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <SandboxContent />
    </Suspense>
  );
}
