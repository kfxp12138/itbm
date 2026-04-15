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
  if (score >= 130) return { level: '非常优秀', description: '你的智力水平远超常人，属于极少数的天才级别。' };
  if (score >= 120) return { level: '优秀', description: '你的智力水平非常出色，具有很强的逻辑推理能力。' };
  if (score >= 110) return { level: '中上', description: '你的智力水平高于平均，具有良好的分析和推理能力。' };
  if (score >= 90) return { level: '中等', description: '你的智力水平处于正常范围，与大多数人相当。' };
  if (score >= 80) return { level: '中下', description: '你的智力水平略低于平均，但仍在正常范围内。' };
  return { level: '偏低', description: '你的测试成绩偏低，可能受到测试环境或状态的影响。' };
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
