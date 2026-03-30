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
      <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-amber-600 hover:text-amber-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 rounded-[1.25rem] border border-amber-500/25 bg-amber-500/12 p-3">
          <p className="text-center text-sm font-medium text-amber-700">
            ⚠️ 沙盒模式 — 仅用于开发测试
          </p>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">模拟支付</h1>
        <p className="mb-6 text-center text-slate-600">点击下方按钮模拟支付成功</p>

        {/* Order Info */}
        {orderInfo && (
          <div className="glass-card-soft mb-6 space-y-2 rounded-[1.5rem] p-4">
            <div className="flex justify-between">
              <span className="text-slate-500">订单号</span>
              <span className="font-mono text-sm text-slate-700">{orderInfo.orderId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">测试项目</span>
              <span className="font-medium text-slate-900">{TEST_NAMES[orderInfo.testType] || orderInfo.testType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">订单状态</span>
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
            className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500 py-4 text-lg font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? '处理中...' : '✓ 模拟支付成功'}
          </button>
        )}

        {orderInfo && orderInfo.isPaid && (
          <button
            onClick={() => router.push(`/${orderInfo.testType}/result?orderId=${orderId}`)}
            className="w-full rounded-2xl border border-blue-500/30 bg-blue-500 py-4 text-lg font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition-colors hover:bg-blue-400"
          >
            查看结果
          </button>
        )}

        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          className="mt-3 w-full text-sm text-slate-500 transition-colors hover:text-slate-900"
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
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="text-slate-600">加载中...</p>
          </div>
        </div>
      }
    >
      <SandboxContent />
    </Suspense>
  );
}
