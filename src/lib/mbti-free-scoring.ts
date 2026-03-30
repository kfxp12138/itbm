import { MBTI_DIMENSIONS, type MBTIDimensionKey, type MBTIPole } from '@/data/mbti-questions';
import type { MBTIFreeQuestion } from '@/data/mbti-free-questions';
import type { MBTIAnswerValue } from '@/lib/mbti-scoring';

export interface MBTIFreeAxisResult {
  key: MBTIDimensionKey;
  leftPole: MBTIPole;
  rightPole: MBTIPole;
  dominantPole: MBTIPole;
  leftPercentage: number;
  rightPercentage: number;
  margin: number;
}

export interface MBTIFreeResult {
  variant: 'free-20';
  type: string;
  nearbyTypes: string[];
  counts: Record<MBTIPole, number>;
  axes: MBTIFreeAxisResult[];
  completedQuestions: number;
  totalQuestions: number;
  completedAt: number;
}

type MBTICounts = Record<MBTIPole, number>;

const ANSWER_WEIGHTS: Record<MBTIAnswerValue, -2 | -1 | 0 | 1 | 2> = {
  1: -2,
  2: -1,
  3: 0,
  4: 1,
  5: 2,
};

const DIMENSION_ORDER: MBTIDimensionKey[] = ['EI', 'SN', 'TF', 'JP'];

function createEmptyCounts(): MBTICounts {
  return { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
}

function buildTypeFromCounts(counts: MBTICounts): string {
  return `${counts.E >= counts.I ? 'E' : 'I'}${counts.S >= counts.N ? 'S' : 'N'}${counts.T >= counts.F ? 'T' : 'F'}${counts.J >= counts.P ? 'J' : 'P'}`;
}

function flipLetter(type: string, axisKey: MBTIDimensionKey): string {
  const index = DIMENSION_ORDER.indexOf(axisKey);

  if (index === -1) {
    return type;
  }

  const dimension = MBTI_DIMENSIONS.find((item) => item.key === axisKey);

  if (!dimension) {
    return type;
  }

  const letters = type.split('');
  letters[index] = letters[index] === dimension.leftPole ? dimension.rightPole : dimension.leftPole;
  return letters.join('');
}

function buildNearbyTypes(type: string, axes: MBTIFreeAxisResult[]): string[] {
  const ranked = [...axes].sort((first, second) => first.margin - second.margin);
  const candidates: string[] = [];

  ranked.forEach((axis) => {
    const candidate = flipLetter(type, axis.key);
    if (candidate !== type && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  if (ranked.length >= 2) {
    const flippedTwice = flipLetter(flipLetter(type, ranked[0].key), ranked[1].key);
    if (flippedTwice !== type && !candidates.includes(flippedTwice)) {
      candidates.push(flippedTwice);
    }
  }

  return candidates.slice(0, 3);
}

export function calculateFreeMBTIResult(
  answers: Array<MBTIAnswerValue | null | undefined>,
  questions: MBTIFreeQuestion[]
): MBTIFreeResult {
  const counts = createEmptyCounts();

  questions.forEach((question, index) => {
    const answer = answers[index];
    if (!answer) {
      return;
    }

    const weight = ANSWER_WEIGHTS[answer];
    if (weight < 0) {
      counts[question.leftPole] += Math.abs(weight);
    } else if (weight > 0) {
      counts[question.rightPole] += weight;
    }
  });

  const axes = MBTI_DIMENSIONS.map((dimension) => {
    const leftScore = counts[dimension.leftPole];
    const rightScore = counts[dimension.rightPole];
    const total = leftScore + rightScore;
    const leftPercentage = total > 0 ? Math.round((leftScore / total) * 100) : 50;
    const rightPercentage = 100 - leftPercentage;

    return {
      key: dimension.key,
      leftPole: dimension.leftPole,
      rightPole: dimension.rightPole,
      dominantPole: leftScore >= rightScore ? dimension.leftPole : dimension.rightPole,
      leftPercentage,
      rightPercentage,
      margin: Math.abs(leftPercentage - rightPercentage),
    };
  });

  const type = buildTypeFromCounts(counts);

  return {
    variant: 'free-20',
    type,
    nearbyTypes: buildNearbyTypes(type, axes),
    counts,
    axes,
    completedQuestions: answers.filter((answer) => answer !== null && answer !== undefined).length,
    totalQuestions: questions.length,
    completedAt: Date.now(),
  };
}

export function normalizeFreeMBTIResult(raw: unknown): MBTIFreeResult | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<MBTIFreeResult>;

  if (candidate.variant !== 'free-20' || typeof candidate.type !== 'string' || !Array.isArray(candidate.nearbyTypes)) {
    return null;
  }

  const counts = createEmptyCounts();
  if (candidate.counts && typeof candidate.counts === 'object') {
    (Object.keys(counts) as MBTIPole[]).forEach((pole) => {
      const value = (candidate.counts as Partial<Record<MBTIPole, unknown>>)[pole];
      counts[pole] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    });
  }

  const axes = Array.isArray(candidate.axes)
    ? candidate.axes.filter((axis): axis is MBTIFreeAxisResult => Boolean(axis && typeof axis === 'object' && typeof axis.key === 'string'))
    : [];

  return {
    variant: 'free-20',
    type: candidate.type,
    nearbyTypes: candidate.nearbyTypes.filter((item): item is string => typeof item === 'string').slice(0, 3),
    counts,
    axes,
    completedQuestions: typeof candidate.completedQuestions === 'number' ? candidate.completedQuestions : 0,
    totalQuestions: typeof candidate.totalQuestions === 'number' ? candidate.totalQuestions : 20,
    completedAt: typeof candidate.completedAt === 'number' ? candidate.completedAt : Date.now(),
  };
}
