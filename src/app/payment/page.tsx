'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  clearActivePaymentSession,
  readActivePaymentSession,
  readPendingResultRaw,
  saveActivePaymentSession,
  type ActivePaymentSession,
  type PaidTestType,
} from '@/lib/client-result-storage';
import { TEST_DISPLAY_PRICES, TEST_NAMES } from '@/lib/test-catalog';

type PaymentMethod = 'wechat';

type NativePaymentSession = ActivePaymentSession;

interface CreatePaymentResponse {
  amount?: number;
  amountDisplay?: string;
  error?: string;
  expiresAt?: string;
  h5Url?: string;
  message?: string;
  mode?: 'sandbox' | 'production';
  orderId?: string;
  paymentMethod?: PaymentMethod;
  redirectUrl?: string;
  wechatInAppUrl?: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testType = searchParams.get('testType') || '';
  const orderIdFromQuery = searchParams.get('orderId') || '';
  const paidTestType = isValidPaidTestType(testType) ? testType : null;
  const browserInfo = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { isMobile: false, isWeChat: false };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return {
      isMobile: /android|iphone|ipad|ipod|mobile|windows phone/.test(userAgent),
      isWeChat: /micromessenger/.test(userAgent),
    };
  }, []);
  const shouldPreferH5 = browserInfo.isMobile && !browserInfo.isWeChat;
  const initialPaymentSession = paidTestType
    ? readActivePaymentSession(paidTestType) || (orderIdFromQuery
      ? {
          amountDisplay: TEST_DISPLAY_PRICES[paidTestType],
          orderId: orderIdFromQuery,
          paymentMethod: 'wechat' as const,
        }
      : null)
    : null;

  // Validate testType synchronously
  const isValidTestType = ['mbti', 'iq', 'career'].includes(testType);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nativePayment, setNativePayment] = useState<NativePaymentSession | null>(initialPaymentSession);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentRedirecting, setPaymentRedirecting] = useState(false);
  const resultData = useMemo(() => {
    if (testType === 'mbti' || testType === 'iq' || testType === 'career') {
      return readPendingResultRaw(testType);
    }

    return null;
  }, [testType]);

  const paymentOpenUrl = browserInfo.isWeChat
    ? (nativePayment?.wechatInAppUrl || null)
    : (nativePayment?.h5Url || null);

  // Redirect if invalid - using useLayoutEffect to run before paint
  useLayoutEffect(() => {
    if (!testType || !isValidTestType) {
      router.push('/');
    }
  }, [testType, isValidTestType, router]);

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
    setPaymentRedirecting(false);
  };

  const handleOpenPayment = () => {
    setPaymentRedirecting(true);

    if (!paymentOpenUrl) {
      setPaymentRedirecting(false);
      return;
    }

    window.location.assign(paymentOpenUrl);
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

  const handleConfirm = useCallback(async () => {
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

      if (data.mode === 'production' && data.paymentMethod && data.orderId && data.amountDisplay) {
          const nextPaymentSession: NativePaymentSession = {
            amountDisplay: data.amountDisplay,
            expiresAt: data.expiresAt,
            h5Url: data.h5Url,
            orderId: data.orderId,
            paymentMethod: data.paymentMethod,
            wechatInAppUrl: data.wechatInAppUrl,
          };

        if (paidTestType) {
          saveActivePaymentSession(paidTestType, nextPaymentSession);
        }

        setNativePayment(nextPaymentSession);
        setSubmitting(false);

        if (browserInfo.isWeChat && nextPaymentSession.wechatInAppUrl) {
          setPaymentRedirecting(true);
          window.location.assign(nextPaymentSession.wechatInAppUrl);
        } else if (!browserInfo.isWeChat && shouldPreferH5 && nextPaymentSession.h5Url) {
          setPaymentRedirecting(true);
          window.location.assign(nextPaymentSession.h5Url);
        }

        return;
      }

      setPaymentError(data.error || data.message || '创建订单失败');
      setSubmitting(false);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('网络错误，请重试');
      setSubmitting(false);
    }
  }, [browserInfo.isWeChat, email, paidTestType, resultData, router, selectedMethod, shouldPreferH5, submitting, testType]);

  if (!isValidTestType) {
    return (
      <div className="app-shell-module-amber flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  const testName = paidTestType ? TEST_NAMES[paidTestType] : testType;
  const testDisplayPrice = paidTestType ? TEST_DISPLAY_PRICES[paidTestType] : TEST_DISPLAY_PRICES.mbti;

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
            <span className="font-medium text-slate-900">{testName}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-slate-500">支付金额</span>
          <span className="text-xl font-bold text-amber-300">{testDisplayPrice}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-slate-700">微信支付</p>
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
          <p className="mt-3 text-xs leading-6 text-slate-500">当前线上支持微信内支付与微信 H5 支付，系统会自动识别当前浏览器环境。</p>
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
            <p className="text-sm font-medium text-emerald-700">
              {browserInfo.isWeChat && nativePayment.wechatInAppUrl
                ? (paymentRedirecting ? '正在拉起微信内支付' : '请在微信内完成支付')
                : nativePayment.h5Url && shouldPreferH5 && !browserInfo.isWeChat
                  ? (paymentRedirecting ? '正在跳转到微信 H5 支付' : '请在浏览器中完成微信支付')
                  : browserInfo.isWeChat && nativePayment.h5Url
                    ? '当前订单未返回微信内支付链接'
                    : nativePayment.h5Url
                      ? '请打开微信 H5 支付链接完成支付'
                      : '正在确认这笔订单的支付状态'}
            </p>
            <p className="mt-2 text-xs leading-6 text-emerald-800">
              订单号：{nativePayment.orderId}
              <br />
              金额：{nativePayment.amountDisplay}
            </p>
            {browserInfo.isWeChat && nativePayment.wechatInAppUrl ? (
              <p className="mt-4 text-xs leading-6 text-slate-600">已自动按微信内环境切换到站内拉起支付；若未自动跳转，可点击下方按钮重新打开。</p>
            ) : nativePayment.h5Url && shouldPreferH5 && !browserInfo.isWeChat ? (
              <p className="mt-4 text-xs leading-6 text-slate-600">当前设备会优先拉起微信 H5 支付；若未自动跳转，可点击下方按钮重新打开。</p>
            ) : browserInfo.isWeChat && nativePayment.h5Url ? (
              <p className="mt-4 text-xs leading-6 text-slate-600">当前处于微信内浏览器，但通道未返回可直接拉起的微信内支付链接。请联系我检查商户通道是否已开通对应能力。</p>
            ) : (
              <p className="mt-4 text-xs leading-6 text-slate-600">如果这是从支付完成页返回的新会话，页面会继续按订单号检查结果；也可以重新发起一笔支付。</p>
            )}
            <div className="mt-4 space-y-3">
              {paymentOpenUrl ? (
                <button
                  className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
                  onClick={handleOpenPayment}
                  type="button"
                >
                  {paymentRedirecting
                    ? '正在跳转支付...'
                    : browserInfo.isWeChat
                      ? '打开微信支付'
                      : '打开微信 H5 支付'}
                </button>
              ) : null}
              <button
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                onClick={checkPaymentNow}
                type="button"
              >
                我已完成支付，立即检查
              </button>
            </div>
            {nativePayment.expiresAt ? (
              <p className="mt-4 text-xs text-slate-500">支付有效期至：{new Date(nativePayment.expiresAt).toLocaleString('zh-CN')}</p>
            ) : null}
          </div>
        ) : null}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full rounded-2xl border border-amber-500/30 bg-amber-500 py-3 font-medium text-white shadow-[0_0_24px_rgba(245,158,11,0.25)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? '处理中...' : nativePayment ? (browserInfo.isWeChat ? '重新获取微信内支付链接' : '重新获取 H5 支付链接') : '确认支付'}
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
