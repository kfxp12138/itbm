import Link from "next/link";

const tests = [
  {
    title: "MBTI人格测试",
    icon: "🧠",
    description: "70道题目，探索你的16种人格类型，深入了解自己的性格特征、优势与成长方向。",
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
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6">
            探索你的内心世界
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            通过科学的心理测评工具，深入了解自己的人格特质、智力水平和职业倾向，找到属于你的独特定位。
          </p>
          <Link
            href="#tests"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
          >
            开始探索
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Test Cards */}
      <section id="tests" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            选择你的测试
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            每项测试都基于经典心理学理论，结果仅供参考与自我探索。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tests.map((test) => (
              <Link
                key={test.href}
                href={test.href}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${test.bgColor} rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  {test.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {test.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-6">
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
