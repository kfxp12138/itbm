import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "礼至测途-在线潜能测试平台",
  description: "礼至测途-在线潜能测试平台提供 MBTI 人格测试、IQ 智力评估与职业性格测评，帮助你更系统地认识潜能与发展方向。",
  keywords: ["礼至测途", "在线潜能测试平台", "MBTI", "IQ测试", "职业测试", "性格测试", "潜能测评"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t border-slate-200/80 bg-white/75 py-14 backdrop-blur-xl">
          <div className="app-container">
            <div className="md:flex md:justify-between">
              <div className="mb-8 md:mb-0">
                <span className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-bold text-white shadow-[0_0_26px_rgba(139,92,246,0.3)]">
                    礼
                  </div>
                  <span className="font-bold text-xl tracking-tight text-slate-900">
                    礼至测途
                  </span>
                </span>
                <p className="max-w-xs text-sm leading-relaxed text-slate-600">
                  礼至测途-在线潜能测试平台，提供科学、系统的 MBTI、IQ 与职业性格测评，帮助你更好地认识自己与未来方向。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-16">
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-800">测试项目</h3>
                  <ul className="space-y-3">
                    <li>
                       <Link href="/mbti/free" className="text-base text-slate-600 hover:text-fuchsia-600">免费MBTI快速版</Link>
                    </li>
                    <li>
                       <Link href="/mbti" className="text-base text-slate-600 hover:text-violet-600">MBTI人格测试</Link>
                    </li>
                    <li>
                       <Link href="/iq" className="text-base text-slate-600 hover:text-blue-600">IQ智力测试</Link>
                    </li>
                    <li>
                       <Link href="/career" className="text-base text-slate-600 hover:text-emerald-600">职业性格测试</Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-800">关于我们</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/about" className="text-base text-slate-600 hover:text-slate-900">关于我们</Link>
                    </li>
                    <li>
                      <a href="mailto:info@hn1jia1.com" className="text-base text-slate-600 hover:text-slate-900">info@hn1jia1.com</a>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-base text-slate-600 hover:text-slate-900">隐私政策</Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-800">公司信息</h3>
                  <ul className="space-y-3 text-base text-slate-600">
                    <li>湖南礼至文化传播有限公司</li>
                    <li>湘ICP备2024048825号</li>
                    <li>长沙市开福区通泰街街道中山路589号开福万达广场B区商业综合体21004房</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 border-t border-slate-200 pt-8">
              <div className="space-y-2 text-center text-base text-slate-500">
                <p>&copy; {new Date().getFullYear()} 礼至测途-在线潜能测试平台 · 湖南礼至文化传播有限公司</p>
                <p>备案号：湘ICP备2024048825号</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
