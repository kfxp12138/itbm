import { MBTI_DIMENSIONS, mbtiQuestions, type MBTIDimensionKey, type MBTIPole } from '@/data/mbti-questions';
import { mbtiTypes } from '@/data/mbti-types';

export type MBTIAnswerValue = 1 | 2 | 3 | 4 | 5;

export interface MBTIDimensionResult {
  key: MBTIDimensionKey;
  title: string;
  subtitle: string;
  leftPole: MBTIPole;
  rightPole: MBTIPole;
  leftLabel: string;
  rightLabel: string;
  leftScore: number;
  rightScore: number;
  leftPercentage: number;
  rightPercentage: number;
  dominantPole: MBTIPole;
  strengthPercentage: number;
  answeredQuestions: number;
}

export interface MBTIResult {
  version: 2;
  type: string;
  counts: Record<MBTIPole, number>;
  dimensions: MBTIDimensionResult[];
  completedQuestions: number;
  totalQuestions: number;
}

type MBTICounts = Record<MBTIPole, number>;

const ANSWER_WEIGHTS: Record<MBTIAnswerValue, -2 | -1 | 0 | 1 | 2> = {
  1: -2,
  2: -1,
  3: 0,
  4: 1,
  5: 2,
};

function createEmptyCounts(): MBTICounts {
  return { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
}

function isMBTIResult(value: unknown): value is MBTIResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MBTIResult>;

  return typeof candidate.type === 'string' && typeof candidate.completedQuestions === 'number' && typeof candidate.totalQuestions === 'number' && Array.isArray(candidate.dimensions) && typeof candidate.counts === 'object' && candidate.counts !== null;
}

function normalizeCounts(rawCounts: unknown): MBTICounts {
  const counts = createEmptyCounts();

  if (!rawCounts || typeof rawCounts !== 'object') {
    return counts;
  }

  for (const pole of Object.keys(counts) as MBTIPole[]) {
    const value = (rawCounts as Record<string, unknown>)[pole];
    counts[pole] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  return counts;
}

function buildDimensionResultsFromCounts(counts: MBTICounts): MBTIDimensionResult[] {
  return MBTI_DIMENSIONS.map((dimension) => {
    const leftScore = counts[dimension.leftPole] ?? 0;
    const rightScore = counts[dimension.rightPole] ?? 0;
    const total = leftScore + rightScore;
    const leftPercentage = total > 0 ? Math.round((leftScore / total) * 100) : 50;
    const rightPercentage = 100 - leftPercentage;
    const dominantPole = leftScore >= rightScore ? dimension.leftPole : dimension.rightPole;
    const dominantPercentage = dominantPole === dimension.leftPole ? leftPercentage : rightPercentage;

    return {
      key: dimension.key,
      title: dimension.sectionTitle,
      subtitle: dimension.sectionSubtitle,
      leftPole: dimension.leftPole,
      rightPole: dimension.rightPole,
      leftLabel: `${dimension.leftPole} 倾向`,
      rightLabel: `${dimension.rightPole} 倾向`,
      leftScore,
      rightScore,
      leftPercentage,
      rightPercentage,
      dominantPole,
      strengthPercentage: dominantPercentage,
      answeredQuestions: total,
    };
  });
}

export function calculateMBTIResult(answers: Array<MBTIAnswerValue | null | undefined>): MBTIResult {
  const counts = createEmptyCounts();
  const answeredQuestions = answers.filter((answer) => answer !== null && answer !== undefined).length;

  for (const question of mbtiQuestions) {
    const answer = answers[question.no - 1];

    if (!answer) {
      continue;
    }

    const weight = ANSWER_WEIGHTS[answer];

    if (weight < 0) {
      counts[question.leftPole] += Math.abs(weight);
    } else if (weight > 0) {
      counts[question.rightPole] += weight;
    }
  }

  const dimensions = buildDimensionResultsFromCounts(counts);
  const type = `${counts.E >= counts.I ? 'E' : 'I'}${counts.S >= counts.N ? 'S' : 'N'}${counts.T >= counts.F ? 'T' : 'F'}${counts.J >= counts.P ? 'J' : 'P'}`;

  return {
    version: 2,
    type,
    counts,
    dimensions,
    completedQuestions: answeredQuestions,
    totalQuestions: mbtiQuestions.length,
  };
}

export function normalizeMBTIResult(raw: unknown): MBTIResult | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  if (isMBTIResult(raw)) {
    return {
      ...raw,
      counts: normalizeCounts(raw.counts),
      dimensions: buildDimensionResultsFromCounts(normalizeCounts(raw.counts)).map((dimension, index) => {
        const original = raw.dimensions[index];

        if (!original) {
          return dimension;
        }

        return {
          ...dimension,
          ...original,
          leftScore: typeof original.leftScore === 'number' ? original.leftScore : dimension.leftScore,
          rightScore: typeof original.rightScore === 'number' ? original.rightScore : dimension.rightScore,
          leftPercentage: typeof original.leftPercentage === 'number' ? original.leftPercentage : dimension.leftPercentage,
          rightPercentage: typeof original.rightPercentage === 'number' ? original.rightPercentage : dimension.rightPercentage,
          strengthPercentage: typeof original.strengthPercentage === 'number' ? original.strengthPercentage : dimension.strengthPercentage,
          answeredQuestions: typeof original.answeredQuestions === 'number' ? original.answeredQuestions : dimension.answeredQuestions,
        };
      }),
    };
  }

  const candidate = raw as { type?: unknown; counts?: unknown };

  if (typeof candidate.type !== 'string') {
    return null;
  }

  const counts = normalizeCounts(candidate.counts);
  const dimensions = buildDimensionResultsFromCounts(counts);
  const completedQuestions = dimensions.reduce((sum, dimension) => sum + dimension.answeredQuestions, 0);

  return {
    version: 2,
    type: candidate.type,
    counts,
    dimensions,
    completedQuestions,
    totalQuestions: completedQuestions,
  };
}

export function getMBTITypeDescription(type: string) {
  return mbtiTypes.find((item) => item.type === type);
}
