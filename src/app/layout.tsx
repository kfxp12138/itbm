import type { Metadata } from "next";
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

        <footer className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:justify-between">
              <div className="mb-8 md:mb-0">
                <span className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    心
                  </div>
                  <span className="font-bold text-xl tracking-tight text-gray-900">
                    心理测试平台
                  </span>
                </span>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  专业的在线心理测评平台，提供科学、准确的MBTI、智商及职业性格测试，助你探索潜能，规划未来。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-16">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">测试项目</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/mbti" className="text-base text-gray-500 hover:text-blue-600 transition-colors">MBTI人格测试</a>
                    </li>
                    <li>
                      <a href="/iq" className="text-base text-gray-500 hover:text-blue-600 transition-colors">IQ智力测试</a>
                    </li>
                    <li>
                      <a href="/career" className="text-base text-gray-500 hover:text-blue-600 transition-colors">职业性格测试</a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">关于我们</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-blue-600 transition-colors">关于平台</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-blue-600 transition-colors">联系我们</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-blue-600 transition-colors">隐私政策</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 border-t border-gray-100 pt-8">
              <p className="text-base text-gray-400 text-center">
                &copy; {new Date().getFullYear()} 心理测试平台. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
