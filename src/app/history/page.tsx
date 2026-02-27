'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HistoryEntry {
  type: 'mbti' | 'iq' | 'career';
  timestamp: number;
  summary: string;
  detail: string;
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
    loadHistory();
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('mbti_results');
    localStorage.removeItem('iq_results');
    localStorage.removeItem('career_results');
    localStorage.removeItem('mbti_latest_result');
    localStorage.removeItem('iq_latest_result');
    localStorage.removeItem('career_latest_result');
    setEntries([]);
  };

  const typeConfig = {
    mbti: { label: 'MBTI测试', color: 'bg-violet-100 text-violet-700', icon: '🧠' },
    iq: { label: 'IQ测试', color: 'bg-blue-100 text-blue-700', icon: '🧩' },
    career: { label: '职业测试', color: 'bg-emerald-100 text-emerald-700', icon: '💼' },
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">测试记录</h1>
          {entries.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              清除记录
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500 mb-6">暂无测试记录，去做一个测试吧！</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              选择测试
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const config = typeConfig[entry.type];
              return (
                <div
                  key={`${entry.type}-${entry.timestamp}-${i}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900">{entry.summary}</div>
                      {entry.detail && (
                        <div className="text-sm text-gray-500 mt-0.5">{entry.detail}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
