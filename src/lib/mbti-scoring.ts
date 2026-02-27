import { mbtiQuestions } from '@/data/mbti-questions';
import { mbtiTypes } from '@/data/mbti-types';

export function getQuestionScore(questionNo: number, answer: "A" | "B"): string {
  const q = mbtiQuestions.find(q => q.no === questionNo)!;
  return q.answerOptions.find(o => o.type === answer)!.score;
}

export function calculateMBTIType(scores: string[]): { type: string; counts: Record<string, number> } {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  scores.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const type = `${counts.E >= counts.I ? 'E' : 'I'}${counts.S >= counts.N ? 'S' : 'N'}${counts.T >= counts.F ? 'T' : 'F'}${counts.J >= counts.P ? 'J' : 'P'}`;
  return { type, counts };
}

export function getMBTITypeDescription(type: string) {
  return mbtiTypes.find(t => t.type === type);
}
