import Link from "next/link";

const tests = [
  {
    title: "免费MBTI快速版",
    icon: "✨",
    description: "20道题免费快速测，先看你的主类型，以及最可能接近的几个相邻类型。",
    href: "/mbti/free",
    color: "from-fuchsia-500 to-violet-600",
    bgColor: "bg-fuchsia-50",
  },
  {
    title: "MBTI人格测试（完整版）",
    icon: "🧠",
    description: "200道五级倾向题，保留经典16型结果，同时呈现更细腻的四维偏好强度与人格画像。",
    href: "/mbti",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50",
  },
  {
    title: "IQ智力测试",
    icon: "🧩",
    description: "60道瑞文推理题，20分钟限时挑战，科学评估你的逻辑推理与空间想象能力。",
    href: "/iq",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "职业性格测试",
    icon: "💼",
    description: "10道题目，基于大五人格模型，发现最适合你的职业方向与发展路径。",
    href: "/career",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
  },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] app-shell">
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="app-container">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="section-kicker">人格 · 智力 · 职业倾向</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-6xl sm:leading-[1.05]">
                用更清晰的测试流程，认识你的性格、能力与职业倾向。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                你可以先做 20 题免费 MBTI 快速版，也可以直接进入 200 题完整版，再配合 IQ 与职业测试补全自己的画像。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#tests" className="app-button-primary px-8 py-3 text-base font-medium">
                  开始探索
                </Link>
                <Link href="/history" className="app-button-secondary px-8 py-3 text-base font-medium">
                  查看历史记录
                </Link>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="section-kicker">MBTI</p>
                  <p className="mt-3 text-2xl font-semibold text-violet-700">免费 20 题 + 完整 200 题</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">先快速判断主类型，再按需查看完整版深度画像。</p>
                </div>
                <div className="glass-card-soft rounded-[1.5rem] p-5">
                  <p className="section-kicker">IQ</p>
                  <p className="mt-3 text-2xl font-semibold text-blue-700">20 分钟推理挑战</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">图形推理、分组作答、即时反馈。</p>
                </div>
                <div className="glass-card-soft rounded-[1.5rem] p-5 sm:col-span-2">
                  <p className="section-kicker">职业画像</p>
                  <p className="mt-3 text-2xl font-semibold text-emerald-700">人格维度 × 职业建议</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">从大五人格出发，把结果落到可理解、可行动的职业方向上。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tests" className="py-16 sm:py-20">
        <div className="app-container">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            选择你的测试
          </h2>
          <p className="mx-auto mb-12 mt-4 max-w-lg text-center text-slate-600">
            每项测试都基于经典心理学理论，结果仅供参考与自我探索。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {tests.map((test) => (
              <Link
                key={test.href}
                href={test.href}
                className="group glass-card rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300/80"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${test.bgColor} text-2xl transition-transform group-hover:scale-110`}>
                  {test.icon}
                </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {test.title}
                </h3>
                  <p className="mb-6 leading-relaxed text-slate-600">
                  {test.description}
                </p>
                <span className={`inline-flex items-center gap-1 text-sm font-medium bg-gradient-to-r ${test.color} bg-clip-text text-transparent`}>
                  开始测试
                  <svg className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
