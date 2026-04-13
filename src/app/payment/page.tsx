'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  clearActivePaymentSession,
  readActivePaymentSession,
  readPendingResultRaw,
  saveActivePaymentSession,
  type ActivePaymentSession,
  type PaidTestType,
} from '@/lib/client-result-storage';

type PaymentMethod = 'wechat' | 'alipay';

type NativePaymentSession = ActivePaymentSession;

interface CreatePaymentResponse {
  amount?: number;
  amountDisplay?: string;
  codeUrl?: string;
  error?: string;
  expiresAt?: string;
  message?: string;
  mode?: 'sandbox' | 'production';
  orderId?: string;
  paymentMethod?: PaymentMethod;
  redirectUrl?: string;
}

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
  const paidTestType = isValidPaidTestType(testType) ? testType : null;

  // Validate testType synchronously
  const isValidTestType = ['mbti', 'iq', 'career'].includes(testType);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nativePayment, setNativePayment] = useState<NativePaymentSession | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const resultData = useMemo(() => {
    if (testType === 'mbti' || testType === 'iq' || testType === 'career') {
      return readPendingResultRaw(testType);
    }

    return null;
  }, [testType]);

  // Redirect if invalid - using useLayoutEffect to run before paint
  useLayoutEffect(() => {
    if (!testType || !isValidTestType) {
      router.push('/');
    }
  }, [testType, isValidTestType, router]);

  useEffect(() => {
    if (!paidTestType || nativePayment) {
      return;
    }

    const restoredPayment = readActivePaymentSession(paidTestType);
    if (!restoredPayment) {
      return;
    }

    setSelectedMethod(restoredPayment.paymentMethod);
    setNativePayment(restoredPayment);
  }, [nativePayment, paidTestType]);

  useEffect(() => {
    if (!nativePayment?.codeUrl) {
      setQrCodeDataUrl(null);
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(nativePayment.codeUrl, {
      margin: 1,
      width: 280,
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch((error) => {
        console.error('QR code generation error:', error);
        if (!cancelled) {
          setQrCodeDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nativePayment]);

  useEffect(() => {
    if (!nativePayment?.orderId) {
      return;
    }

    let cancelled = false;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/verify?orderId=${nativePayment.orderId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { isPaid?: boolean };

        if (!cancelled && data.isPaid) {
          if (paidTestType) {
            clearActivePaymentSession(paidTestType);
          }
          router.push(`/${testType}/result?orderId=${nativePayment.orderId}`);
        }
      } catch (error) {
        console.error('Payment status polling error:', error);
      }
    };

    checkPaymentStatus().catch((error) => console.error('Initial payment status check failed:', error));
    const intervalId = window.setInterval(() => {
      checkPaymentStatus().catch((error) => console.error('Payment status polling failed:', error));
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [nativePayment, paidTestType, router, testType]);

  const handleMethodChange = (method: PaymentMethod) => {
    if (paidTestType) {
      clearActivePaymentSession(paidTestType);
    }
    setSelectedMethod(method);
    setNativePayment(null);
    setPaymentError(null);
    setCopySuccess(false);
  };

  const handleCopyCodeUrl = async () => {
    if (!nativePayment?.codeUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(nativePayment.codeUrl);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy code_url failed:', error);
    }
  };

  const checkPaymentNow = async () => {
    if (!nativePayment?.orderId) {
      return;
    }

    try {
      const response = await fetch(`/api/payment/verify?orderId=${nativePayment.orderId}`, {
        cache: 'no-store',
      });
      const data = (await response.json()) as { error?: string; isPaid?: boolean };

      if (!response.ok) {
        setPaymentError(data.error || '支付状态查询失败');
        return;
      }

      if (data.isPaid) {
        if (paidTestType) {
          clearActivePaymentSession(paidTestType);
        }
        router.push(`/${testType}/result?orderId=${nativePayment.orderId}`);
        return;
      }

      setPaymentError('暂未收到支付成功通知，请完成支付后稍候自动跳转。');
    } catch (error) {
      console.error('Manual payment verify error:', error);
      setPaymentError('支付状态查询失败，请稍后重试。');
    }
  };

  const handleConfirm = async () => {
    if (submitting) return;

    if (!resultData) {
      setPaymentError('未找到待支付的测试结果，请重新完成测试后再发起支付。');
      return;
    }

    setSubmitting(true);
    setPaymentError(null);

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

      const data = (await response.json()) as CreatePaymentResponse;

      if (data.mode === 'sandbox' && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }

      if (data.mode === 'production' && data.paymentMethod === 'wechat' && data.codeUrl && data.orderId && data.amountDisplay) {
        const nextPaymentSession: NativePaymentSession = {
          amountDisplay: data.amountDisplay,
          codeUrl: data.codeUrl,
          expiresAt: data.expiresAt,
          orderId: data.orderId,
          paymentMethod: data.paymentMethod,
        };

        if (paidTestType) {
          saveActivePaymentSession(paidTestType, nextPaymentSession);
        }

        setNativePayment(nextPaymentSession);
        setSubmitting(false);
        return;
      }

      setPaymentError(data.error || data.message || '创建订单失败');
      setSubmitting(false);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('网络错误，请重试');
      setSubmitting(false);
    }
  };

  if (!isValidTestType) {
    return (
      <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <p className="section-kicker text-center">Payment</p>
        <h1 className="mb-2 mt-4 text-center text-2xl font-bold text-slate-900">确认支付</h1>
        <p className="mb-6 text-center text-slate-600">完成支付后查看测试结果</p>

        {/* Test Info */}
        <div className="glass-card-soft mb-6 rounded-[1.5rem] p-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">测试项目</span>
            <span className="font-medium text-slate-900">{TEST_NAMES[testType] || testType}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-slate-500">支付金额</span>
            <span className="text-xl font-bold text-amber-300">{TEST_PRICES[testType] || '¥9.99'}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-slate-700">选择支付方式</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleMethodChange('wechat')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedMethod === 'wechat'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-200'
               }`}
            >
              <span className="text-2xl">💬</span>
              <span className={`text-sm font-medium ${selectedMethod === 'wechat' ? 'text-emerald-700' : 'text-slate-600'}`}>
                微信支付
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">当前线上仅开放微信原生扫码支付，支付宝通道暂未开放。</p>
        </div>

        {/* Email Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
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

        {paymentError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {paymentError}
          </div>
        ) : null}

        {nativePayment ? (
          <div className="mb-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-5 text-center">
            <p className="text-sm font-medium text-emerald-700">请使用微信扫码完成支付</p>
            <p className="mt-2 text-xs leading-6 text-emerald-800">
              订单号：{nativePayment.orderId}
              <br />
              金额：{nativePayment.amountDisplay}
            </p>
            <div className="mt-4 flex justify-center">
              {qrCodeDataUrl ? (
                <img
                  alt="微信支付二维码"
                  className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm"
                  height={280}
                  src={qrCodeDataUrl}
                  width={280}
                />
              ) : (
                <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-slate-500">
                  正在生成二维码...
                </div>
              )}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-600">推荐直接使用微信扫码支付；下方链接仅作为备用方式保留。</p>
            <div className="mt-4 space-y-3">
              <a
                className="block rounded-2xl border border-emerald-500/20 bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
                href={nativePayment.codeUrl}
              >
                打开微信支付链接
              </a>
              <button
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                onClick={handleCopyCodeUrl}
                type="button"
              >
                {copySuccess ? '支付链接已复制' : '复制支付链接'}
              </button>
              <button
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                onClick={checkPaymentNow}
                type="button"
              >
                我已完成支付，立即检查
              </button>
            </div>
            {nativePayment.expiresAt ? (
              <p className="mt-4 text-xs text-slate-500">二维码有效期至：{new Date(nativePayment.expiresAt).toLocaleString('zh-CN')}</p>
            ) : null}
          </div>
        ) : null}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full rounded-2xl border border-amber-500/30 bg-amber-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(245,158,11,0.25)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? '处理中...' : nativePayment ? '重新获取支付二维码' : '确认支付'}
        </button>

        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="mt-3 w-full text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          返回
        </button>
      </div>
    </div>
  );
}

function isValidPaidTestType(value: string): value is PaidTestType {
  return value === 'mbti' || value === 'iq' || value === 'career';
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
            <p className="text-slate-600">加载中...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
