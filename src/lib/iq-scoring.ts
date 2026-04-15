import { CORRECT_ANSWERS, SCORE_TO_IQ_MAP } from '@/data/iq-data';

export function calculateIQScore(answers: (number | null)[], age: number): { score: number; correctCount: number } {
  let correctCount = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] !== null && answers[i]! + 1 === CORRECT_ANSWERS[i]) {
      correctCount++;
    }
  }
  
  const baseScore = SCORE_TO_IQ_MAP[correctCount] ?? 60;
  
  let ageQuotient = 100;
  if (age > 55) ageQuotient = 70;
  else if (age > 50) ageQuotient = 76;
  else if (age > 45) ageQuotient = 82;
  else if (age > 40) ageQuotient = 88;
  else if (age > 35) ageQuotient = 93;
  else if (age > 30) ageQuotient = 97;
  
  const score = Math.floor(baseScore / 100 * ageQuotient);
  return { score, correctCount };
}

export function getIQDescription(score: number): { level: string; description: string } {
  if (score >= 130) return { level: '非常优秀', description: '你的表现非常突出，说明你在这次测试中的抽象推理与图形规律识别能力处于较高水平。' };
  if (score >= 120) return { level: '优秀', description: '你的表现较为出色，说明你在图形推理和模式识别方面有不错的稳定性。' };
  if (score >= 110) return { level: '中上', description: '你的表现高于常见中位区间，展现出较好的分析、比较和归纳能力。' };
  if (score >= 90) return { level: '中等', description: '你的表现处于常见区间，整体推理节奏和大多数测试者接近。' };
  if (score >= 80) return { level: '中下', description: '你的表现略低于常见中位区间，这类结果也可能受到年龄换算、作答节奏和当时状态影响。' };
  return { level: '偏低', description: '这次测试结果偏低，建议把它理解为一次阶段性表现，而不是对个人能力的固定结论。' };
}

export interface IQRangeStat {
  min: number;
  max: number;
  label: string;
  percent: string;
}

export const IQ_POPULATION_RANGES: IQRangeStat[] = [
  { min: 130, max: 200, label: '非常优秀', percent: '2.2%' },
  { min: 120, max: 129, label: '优秀', percent: '6.7%' },
  { min: 110, max: 119, label: '中上', percent: '16.1%' },
  { min: 90, max: 109, label: '中等', percent: '50%' },
  { min: 80, max: 89, label: '中下', percent: '16.1%' },
  { min: 70, max: 79, label: '边缘', percent: '6.7%' },
  { min: 0, max: 69, label: '需关注', percent: '2.2%' },
];

export function getIQPopulationRange(score: number): IQRangeStat {
  return IQ_POPULATION_RANGES.find(range => score >= range.min && score <= range.max) || IQ_POPULATION_RANGES[IQ_POPULATION_RANGES.length - 1];
}
