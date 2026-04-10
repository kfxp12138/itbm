'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clearAllPendingResults } from '@/lib/client-result-storage';

interface HistoryEntry {
  type: 'mbti' | 'mbti-free' | 'iq' | 'career';
  timestamp: number;
  summary: string;
  detail: string;
  href?: string;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = () => {
    const all: HistoryEntry[] = [];

    try {
      const mbti = JSON.parse(localStorage.getItem('mbti_results') || '[]');
      mbti.forEach((r: { timestamp: number; type: string }) => {
        all.push({
          type: 'mbti',
          timestamp: r.timestamp,
          summary: `MBTI: ${r.type}`,
          detail: r.type,
          href: `/mbti/result?historyTs=${r.timestamp}`,
        });
      });
    } catch { /* empty */ }

    try {
      const mbtiFree = JSON.parse(localStorage.getItem('mbti_free_results') || '[]');
      mbtiFree.forEach((r: { completedAt?: number; timestamp?: number; type: string; nearbyTypes?: string[] }) => {
        const timestamp = r.completedAt ?? r.timestamp;

        if (typeof timestamp !== 'number') {
          return;
        }

        all.push({
          type: 'mbti-free',
          timestamp,
          summary: `免费MBTI: ${r.type}`,
          detail: Array.isArray(r.nearbyTypes) && r.nearbyTypes.length > 0 ? `可能接近：${r.nearbyTypes.join('、')}` : '20题快速版',
          href: `/mbti/free/result?historyTs=${timestamp}`,
        });
      });
    } catch { /* empty */ }

    try {
      const iq = JSON.parse(localStorage.getItem('iq_results') || '[]');
      iq.forEach((r: { timestamp: number; score: number; correctCount: number; age: number }) => {
        all.push({
          type: 'iq',
          timestamp: r.timestamp,
          summary: `IQ: ${r.score}`,
          detail: `答对 ${r.correctCount}/60 题，年龄 ${r.age}`,
        });
      });
    } catch { /* empty */ }

    try {
      const career = JSON.parse(localStorage.getItem('career_results') || '[]');
      career.forEach((r: { timestamp: number; mbtiType: string; careers: string[] }) => {
        all.push({
          type: 'career',
          timestamp: r.timestamp,
          summary: `职业: ${r.mbtiType}`,
          detail: r.careers?.slice(0, 3).join('、') || '',
        });
      });
    } catch { /* empty */ }

    all.sort((a, b) => b.timestamp - a.timestamp);
    setEntries(all);
    setLoaded(true);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('mbti_results');
    localStorage.removeItem('mbti_free_results');
    localStorage.removeItem('iq_results');
    localStorage.removeItem('career_results');
    localStorage.removeItem('mbti_latest_result');
    localStorage.removeItem('mbti_free_latest_result');
    localStorage.removeItem('mbti_free_draft_v1');
    localStorage.removeItem('iq_latest_result');
    localStorage.removeItem('career_latest_result');
    clearAllPendingResults();
    setEntries([]);
  };

  const typeConfig = {
    mbti: { label: 'MBTI测试', color: 'bg-violet-100 text-violet-700', icon: '🧠' },
    'mbti-free': { label: '免费MBTI', color: 'bg-fuchsia-100 text-fuchsia-700', icon: '✨' },
    iq: { label: 'IQ测试', color: 'bg-blue-100 text-blue-700', icon: '🧩' },
    career: { label: '职业测试', color: 'bg-emerald-100 text-emerald-700', icon: '💼' },
  };

  if (!loaded) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="glass-card rounded-[2rem] px-8 py-10 text-center text-slate-600">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="section-kicker">History</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">测试记录</h1>
          </div>
          {entries.length > 0 && (
            <button
              onClick={clearHistory}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
            >
              清除记录
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="mb-6 text-slate-600">暂无测试记录，去做一个测试吧！</p>
            <Link
              href="/"
              className="app-button-primary gap-2 px-6 py-3 text-sm font-medium"
            >
              选择测试
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const config = typeConfig[entry.type];
              const cardContent = (
                <div className="glass-card rounded-[1.75rem] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{entry.summary}</div>
                      {entry.detail && (
                        <div className="mt-0.5 text-sm text-slate-600">{entry.detail}</div>
                      )}
                      {entry.href ? (
                        <div className="mt-2 text-sm font-medium text-violet-300">查看该次结果概览 →</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );

              return entry.href ? (
                <Link key={`${entry.type}-${entry.timestamp}-${i}`} href={entry.href} className="block">
                  {cardContent}
                </Link>
              ) : (
                <div key={`${entry.type}-${entry.timestamp}-${i}`}>{cardContent}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
