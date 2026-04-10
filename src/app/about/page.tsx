import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我们 | 礼至测途-在线潜能测试平台",
  description: "了解湖南礼至文化传播有限公司与礼至测途-在线潜能测试平台的理念、服务内容与联系方式。",
};

const services = [
  "MBTI职业性格测试：深入解析 16 种人格类型，帮助你理解行为偏好与决策模式。",
  "专业智商（IQ）评估：多维度测量逻辑推理、空间思维与语言认知潜能。",
  "职业性格与倾向测评：结合兴趣、价值观与技能，推荐更适配的职业领域与发展路径。",
];

export default function AboutPage() {
  return (
    <div className="app-shell py-16 sm:py-20">
      <div className="app-container max-w-4xl space-y-10">
        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <p className="section-kicker">关于我们</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
            关于我们 | 湖南礼至文化传播有限公司
          </h1>
          <p className="mt-4 text-lg font-medium text-violet-700">礼遇潜能 · 至臻未来</p>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-600">
            <p>
              湖南礼至文化传播有限公司，是一家专注于文化产品开发与个人发展服务的创新型机构。我们坚信，每个人内心都蕴藏着独特的潜能与方向，而科学的认知是开启这一切的钥匙。
            </p>
            <p>
              为此，我们打造了礼至测途-在线潜能测试平台——一个专业、可靠的心理与职业发展工具集合。依托心理学、人力资源管理及统计学等多学科理论，我们希望为不同阶段的用户提供更清晰的自我认知入口。
            </p>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">平台提供的测评服务</h2>
          <ul className="mt-6 space-y-4 text-base leading-8 text-slate-600">
            {services.map((service) => (
              <li key={service} className="rounded-2xl bg-slate-50 px-5 py-4">
                {service}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">我们的承诺</h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-600">
            <p>
              我们持续围绕自我认知、能力探索与职业发展场景打磨测试内容与结果呈现，力求提供清晰、易理解、可参考的测评体验。无论你是正在探索职业方向的学生，还是希望突破瓶颈的职场人，这里都希望为你提供一面看清自己的镜子，以及一份走向未来的参考地图。
            </p>
            <p>
              礼至文化，不止于测试。我们以文化产品为载体，以心理性格和职业发展为核心，陪你一起，认识自己，从容成长。
            </p>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">联系信息</h2>
          <div className="mt-6 space-y-3 text-base leading-8 text-slate-600">
            <p>公司名称：湖南礼至文化传播有限公司</p>
            <p>备案号：湘ICP备2024048825号</p>
            <p>邮箱：info@hn1jia1.com</p>
            <p>地址：长沙市开福区通泰街街道中山路589号开福万达广场B区商业综合体21004房</p>
          </div>
        </section>
      </div>
    </div>
  );
}
