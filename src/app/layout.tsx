import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "心理测试平台 - 探索你的内心世界",
  description: "提供MBTI人格测试、IQ智力测试、职业性格测试等多种专业心理测试，帮助你更好地认识自己。",
  keywords: ["心理测试", "MBTI", "IQ测试", "职业测试", "性格测试", "心理健康"],
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
      <body className="antialiased min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t border-white/8 bg-black/25 py-14 backdrop-blur-xl">
          <div className="app-container">
            <div className="md:flex md:justify-between">
              <div className="mb-8 md:mb-0">
                <span className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-bold text-white shadow-[0_0_26px_rgba(139,92,246,0.3)]">
                    心
                  </div>
                  <span className="font-bold text-xl tracking-tight text-zinc-50">
                    心理测试平台
                  </span>
                </span>
                <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
                  专业的在线心理测评平台，提供科学、准确的MBTI、智商及职业性格测试，助你探索潜能，规划未来。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-16">
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-200">测试项目</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/mbti" className="text-base text-zinc-400 hover:text-violet-300">MBTI人格测试</Link>
                    </li>
                    <li>
                      <Link href="/iq" className="text-base text-zinc-400 hover:text-blue-300">IQ智力测试</Link>
                    </li>
                    <li>
                      <Link href="/career" className="text-base text-zinc-400 hover:text-emerald-300">职业性格测试</Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-200">关于我们</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-base text-zinc-400 hover:text-zinc-100">关于平台</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-zinc-400 hover:text-zinc-100">联系我们</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-zinc-400 hover:text-zinc-100">隐私政策</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 border-t border-white/8 pt-8">
              <p className="text-center text-base text-zinc-500">
                &copy; {new Date().getFullYear()} 心理测试平台. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
