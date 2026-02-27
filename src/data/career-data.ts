export interface CareerQuestion {
  no: number;
  text: string;
  trait: string;
  reversed: boolean;
}

export const careerQuestions: CareerQuestion[] = [
  { no: 1, text: "我觉得自己是一个对艺术兴趣不大的人", trait: "开放性", reversed: true },
  { no: 2, text: "我觉得自己是一个容易偷懒的人", trait: "尽责性", reversed: true },
  { no: 3, text: "我觉得自己是一个比较内向的人", trait: "外向性", reversed: true },
  { no: 4, text: "我觉得自己是一个容易挑剔别人的人", trait: "宜人性", reversed: true },
  { no: 5, text: "我觉得自己是一个能很好地应对压力的人", trait: "神经质", reversed: true },
  { no: 6, text: "我觉得自己是一个想象力丰富的人", trait: "开放性", reversed: false },
  { no: 7, text: "我觉得自己是一个做事认真细致的人", trait: "尽责性", reversed: false },
  { no: 8, text: "我觉得自己是一个外向且善于社交的人", trait: "外向性", reversed: false },
  { no: 9, text: "我觉得自己是一个通常信任他人的人", trait: "宜人性", reversed: false },
  { no: 10, text: "我觉得自己是一个容易紧张的人", trait: "神经质", reversed: false },
];

export const FFM_TRAITS = ["开放性", "尽责性", "外向性", "宜人性", "神经质"] as const;

export interface MBTICareer {
  type: string;
  typeName: string;
  professions: string[];
}

export const mbtiCareers: MBTICareer[] = [
  { type: "ISTJ", typeName: "检查员", professions: ["会计师", "行政管理人员", "公务员", "金融分析师", "军官", "项目经理"] },
  { type: "ISFJ", typeName: "保护者", professions: ["小学教师", "图书管理员", "护士", "药剂师", "社会工作者", "人力资源经理"] },
  { type: "INFJ", typeName: "咨询师", professions: ["心理学家", "咨询师", "作家", "社会科学家", "设计师", "非营利组织经理"] },
  { type: "INTJ", typeName: "策划者", professions: ["首席执行官", "科学家", "战略师", "IT经理", "建筑师", "投资银行家"] },
  { type: "ISTP", typeName: "手艺人", professions: ["机械师", "飞行员", "法医科学家", "木匠", "运动员", "厨师"] },
  { type: "ISFP", typeName: "作曲家", professions: ["艺术家", "音乐家", "厨师", "时装设计师", "摄影师", "公园管理员"] },
  { type: "INFP", typeName: "治愈者", professions: ["作家", "艺术家", "咨询师", "社会工作者", "非营利组织经理", "心理学家"] },
  { type: "INTP", typeName: "建筑师", professions: ["科学家", "建筑师", "软件开发工程师", "工程师", "数学家", "研究员"] },
  { type: "ESTP", typeName: "推销者", professions: ["销售人员", "企业家", "运动员", "急救人员", "消防员", "警察"] },
  { type: "ESFP", typeName: "表演者", professions: ["演员", "艺人", "销售人员", "公关专员", "活动策划师", "私人教练"] },
  { type: "ENFP", typeName: "优胜者", professions: ["作家", "演员", "教师", "非营利组织经理", "市场营销经理", "心理学家"] },
  { type: "ENTP", typeName: "发明家", professions: ["律师", "企业家", "发明家", "市场营销经理", "管理咨询师", "记者"] },
  { type: "ESTJ", typeName: "监督者", professions: ["警察", "军官", "企业高管", "项目经理", "会计师", "金融分析师"] },
  { type: "ESFJ", typeName: "供给者", professions: ["教师", "护士", "活动策划师", "公关专员", "客服代表", "人力资源经理"] },
  { type: "ENFJ", typeName: "教师", professions: ["咨询师", "教师", "人力资源经理", "非营利组织经理", "销售经理", "活动策划师"] },
  { type: "ENTJ", typeName: "元帅", professions: ["首席执行官", "企业家", "军官", "政治家", "投资银行家", "管理咨询师"] },
];
