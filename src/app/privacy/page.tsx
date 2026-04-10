import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 | 礼至测途-在线潜能测试平台",
  description: "查看礼至测途-在线潜能测试平台的用户隐私政策与个人信息保护说明。",
};

const sections = [
  {
    title: "1. 我们收集的信息",
    items: [
      "您主动提供的信息：昵称、年龄、性别、邮箱（用于接收报告时）以及您在测评过程中提交的答案。",
      "在网站运行过程中，服务器可能记录浏览器类型、访问时间等基础访问日志，用于保障服务正常运行与排查异常。",
    ],
  },
  {
    title: "2. 信息的使用",
    items: [
      "生成您的测评报告及个性化建议。",
      "改进测试题目的准确性与平台体验。",
      "在完成邮件发送、基础技术运维等必要环节中处理相关信息；除法律法规要求外，我们不会主动对外出售您的个人信息。",
    ],
  },
  {
    title: "3. 信息的存储与保护",
    items: [
      "我们会采取合理的管理与技术措施，尽力保护您在使用服务过程中提供的信息安全。",
      "测评结果可能保存在您当前使用设备的浏览器本地存储中，请您妥善保管自己的设备与浏览器环境。",
      "如因业务调整导致存储方式发生明显变化，我们会通过页面公告同步说明。",
    ],
  },
  {
    title: "4. 您的权利",
    items: [
      "如您对个人信息处理有疑问，或希望更正、删除您主动提交的信息，可通过 info@hn1jia1.com 与我们联系。",
      "对于保存在您当前浏览器中的测评记录，您也可以通过清理浏览器本地存储自行删除。",
    ],
  },
  {
    title: "5. 未成年人保护",
    items: [
      "未满 14 周岁的用户请在监护人指导下使用，我们不会故意收集儿童个人信息。",
    ],
  },
  {
    title: "6. 政策变更",
    items: [
      "如本政策发生更新，我们将通过网站页面发布最新版本。",
    ],
  },
  {
    title: "7. 联系我们",
    items: [
      "邮箱：info@hn1jia1.com",
      "地址：长沙市开福区通泰街街道中山路589号开福万达广场B区商业综合体21004房",
      "公司：湖南礼至文化传播有限公司",
      "备案号：湘ICP备2024048825号",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="app-shell py-16 sm:py-20">
      <div className="app-container max-w-4xl space-y-10">
        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <p className="section-kicker">用户隐私政策</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">礼至测途-在线潜能测试平台隐私政策</h1>
          <div className="mt-6 space-y-3 text-base leading-8 text-slate-600">
            <p>更新日期：2026年4月9日</p>
            <p>
              湖南礼至文化传播有限公司（以下简称“我们”）尊重并保护您的隐私。您使用本网站（礼至测途-在线潜能测试平台）即表示同意本政策。
            </p>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="glass-card rounded-[2rem] p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-6 space-y-4 text-base leading-8 text-slate-600">
              {section.items.map((item) => (
                <li key={item} className="rounded-2xl bg-slate-50 px-5 py-4">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
