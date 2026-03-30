"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "首页", href: "/" },
    { name: "MBTI测试", href: "/mbti" },
    { name: "IQ测试", href: "/iq" },
    { name: "职业测试", href: "/career" },
    { name: "测试记录", href: "/history" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl">
      <div className="app-container">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-transform duration-200 group-hover:scale-105">
                心
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 transition-colors group-hover:text-violet-700">
                心理测试平台
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/mbti" 
              className="app-button-primary px-4 py-2 text-sm font-medium"
            >
              开始测试
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="space-y-1 border-b border-slate-200 bg-white/96 px-2 pb-3 pt-2 shadow-xl sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-xl px-3 py-2 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-2 border-t border-slate-200 pb-2 pt-4">
            <Link 
              href="/mbti" 
              onClick={() => setIsOpen(false)}
              className="app-button-primary block w-full px-4 py-3 text-center text-base font-medium"
            >
              立即开始
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
