export type MBTIDimensionKey = 'EI' | 'SN' | 'TF' | 'JP';

export type MBTIPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface MBTIQuestion {
  no: number;
  dimension: MBTIDimensionKey;
  prompt: string;
  leftPole: MBTIPole;
  rightPole: MBTIPole;
  leftLabel: string;
  rightLabel: string;
}

interface MBTIQuestionPair {
  leftLabel: string;
  rightLabel: string;
}

interface MBTIDimensionDefinition {
  key: MBTIDimensionKey;
  sectionTitle: string;
  sectionSubtitle: string;
  leftPole: MBTIPole;
  rightPole: MBTIPole;
  prompts: string[];
  pairs: MBTIQuestionPair[];
}

export const MBTI_DIMENSIONS: MBTIDimensionDefinition[] = [
  {
    key: 'EI',
    sectionTitle: '能量取向',
    sectionSubtitle: '你更常从外部互动中获得能量，还是从内在整理中恢复状态。',
    leftPole: 'E',
    rightPole: 'I',
    prompts: [
      '进入陌生场合时，你通常更接近哪一边？',
      '在团队讨论进行到一半时，你通常更接近哪一边？',
      '经历一整天忙碌之后，你通常更接近哪一边？',
      '周末安排活动时，你通常更接近哪一边？',
      '当你需要快速进入状态时，你通常更接近哪一边？',
    ],
    pairs: [
      { leftLabel: '边聊边想，越互动越有感觉', rightLabel: '先想清楚，再决定要不要表达' },
      { leftLabel: '主动结识新朋友，迅速热起来', rightLabel: '先观察气氛，只和熟悉的人深入聊' },
      { leftLabel: '通过参与现场来整理想法', rightLabel: '通过独处安静地整理想法' },
      { leftLabel: '愿意把感受立刻说出来', rightLabel: '更习惯把感受留到心里慢慢消化' },
      { leftLabel: '喜欢一群人一起推进事情', rightLabel: '更喜欢先独立准备好再加入' },
      { leftLabel: '空下来时会想找人联络或见面', rightLabel: '空下来时会想回到自己的节奏里' },
      { leftLabel: '通过多说多试来确认自己怎么想', rightLabel: '通过少说多想来确认自己怎么想' },
      { leftLabel: '在公开场合表达自己并不费力', rightLabel: '在公开场合表达自己需要先酝酿' },
      { leftLabel: '遇到有趣的人会主动延长交流', rightLabel: '遇到有趣的人也会保留一定边界' },
      { leftLabel: '被热闹场景激活和点燃', rightLabel: '被安静空间安抚和充电' },
    ],
  },
  {
    key: 'SN',
    sectionTitle: '信息关注',
    sectionSubtitle: '你更常关注眼前事实与细节，还是更容易看到趋势、模式与可能性。',
    leftPole: 'S',
    rightPole: 'N',
    prompts: [
      '面对新任务时，你通常更接近哪一边？',
      '听别人讲一件事时，你通常更接近哪一边？',
      '做计划或复盘时，你通常更接近哪一边？',
      '接触陌生信息时，你通常更接近哪一边？',
      '判断一件事值不值得投入时，你通常更接近哪一边？',
    ],
    pairs: [
      { leftLabel: '先看事实、条件和已知步骤', rightLabel: '先看方向、关联和未来可能' },
      { leftLabel: '更容易记住具体细节和原话', rightLabel: '更容易抓住背后的含义和趋势' },
      { leftLabel: '喜欢明确可执行的方法', rightLabel: '喜欢探索多种新颖的可能路径' },
      { leftLabel: '相信经验和验证过的做法', rightLabel: '相信直觉和对全局的预感' },
      { leftLabel: '会把注意力放在眼前真实发生的事', rightLabel: '会把注意力放在事情可能发展成什么' },
      { leftLabel: '更欣赏具体、务实、可落地的表达', rightLabel: '更欣赏抽象、跳跃、有启发的表达' },
      { leftLabel: '做事时更重视稳定与准确', rightLabel: '做事时更重视创意与突破' },
      { leftLabel: '喜欢按现实资源来推演方案', rightLabel: '喜欢先构想理想蓝图再反推现实' },
      { leftLabel: '遇到问题会先回到既有经验', rightLabel: '遇到问题会先尝试全新的解释' },
      { leftLabel: '更容易被看得见的成果说服', rightLabel: '更容易被看不见但有潜力的方向吸引' },
    ],
  },
  {
    key: 'TF',
    sectionTitle: '决策偏好',
    sectionSubtitle: '你更常依据逻辑与一致性做判断，还是更重视关系影响与人的感受。',
    leftPole: 'T',
    rightPole: 'F',
    prompts: [
      '需要做决定时，你通常更接近哪一边？',
      '处理分歧或冲突时，你通常更接近哪一边？',
      '评价一个方案是否合理时，你通常更接近哪一边？',
      '面对需要取舍的局面时，你通常更接近哪一边？',
      '当别人向你寻求意见时，你通常更接近哪一边？',
    ],
    pairs: [
      { leftLabel: '先判断是否合逻辑、讲得通', rightLabel: '先判断会不会伤人、是否照顾到人' },
      { leftLabel: '愿意指出问题，即使话不好听', rightLabel: '会先照顾接受者感受再表达问题' },
      { leftLabel: '更看重规则是否一致适用', rightLabel: '更看重个体处境是否值得体谅' },
      { leftLabel: '更容易被清晰证据说服', rightLabel: '更容易被真实需求和情感说服' },
      { leftLabel: '习惯把事情拆开分析利弊', rightLabel: '习惯把事情放回人际关系里衡量' },
      { leftLabel: '你希望结论经得起推敲', rightLabel: '你希望结论让人愿意接受' },
      { leftLabel: '你会优先确保公平和标准统一', rightLabel: '你会优先确保善意和关系稳定' },
      { leftLabel: '面对错误会先纠正逻辑与做法', rightLabel: '面对错误会先理解动机与压力' },
      { leftLabel: '你更认可直白、精准的反馈', rightLabel: '你更认可温和、共情的反馈' },
      { leftLabel: '做决定时更像裁判，拉开距离看局势', rightLabel: '做决定时更像协调者，关心每个人感受' },
    ],
  },
  {
    key: 'JP',
    sectionTitle: '生活节奏',
    sectionSubtitle: '你更常偏好确定、有计划的推进方式，还是灵活、开放、边走边调。',
    leftPole: 'J',
    rightPole: 'P',
    prompts: [
      '安排日程与任务时，你通常更接近哪一边？',
      '面对变化和临时情况时，你通常更接近哪一边？',
      '推进一个长期目标时，你通常更接近哪一边？',
      '在生活琐事与合作场景里，你通常更接近哪一边？',
      '当事情接近截止时间时，你通常更接近哪一边？',
    ],
    pairs: [
      { leftLabel: '喜欢先定计划，再按步骤推进', rightLabel: '喜欢保留弹性，边做边调整' },
      { leftLabel: '事情落定会让你安心', rightLabel: '保留选择空间会让你安心' },
      { leftLabel: '倾向于提早完成，避免临时赶工', rightLabel: '倾向于临近节点集中爆发完成' },
      { leftLabel: '更喜欢明确分工和时间表', rightLabel: '更喜欢顺着现场变化自由协作' },
      { leftLabel: '会主动收口，推动事情尽快定下来', rightLabel: '会继续观察，避免过早下结论' },
      { leftLabel: '习惯把待办拆细并安排顺序', rightLabel: '习惯先抓最有感觉的部分开始' },
      { leftLabel: '对突发变动会先想怎么恢复秩序', rightLabel: '对突发变动会先顺势寻找新机会' },
      { leftLabel: '你偏好整洁、稳定、可预期的节奏', rightLabel: '你偏好多样、流动、可探索的节奏' },
      { leftLabel: '更容易因为未完成事项而挂心', rightLabel: '更容易因为限制太多而感到压抑' },
      { leftLabel: '通常会先做决定再行动', rightLabel: '通常会先行动再逐步形成决定' },
    ],
  },
];

function buildQuestions(): MBTIQuestion[] {
  let no = 1;

  return MBTI_DIMENSIONS.flatMap((dimension) =>
    dimension.prompts.flatMap((prompt) =>
      dimension.pairs.map((pair) => ({
        no: no++,
        dimension: dimension.key,
        prompt,
        leftPole: dimension.leftPole,
        rightPole: dimension.rightPole,
        leftLabel: pair.leftLabel,
        rightLabel: pair.rightLabel,
      }))
    )
  );
}

export const mbtiQuestions: MBTIQuestion[] = buildQuestions();
