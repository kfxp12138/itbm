export const CORRECT_ANSWERS = [4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5, 2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5, 8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2, 3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6, 7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5];

export const SCORE_TO_IQ_MAP: (number | null)[] = [
  ...Array(15).fill(null),
  62, 65, 65, 66, 67, 69, 70, 71, 72, 73, 75, 76, 77, 79, 80, 82, 83, 84, 86, 87, 88, 90, 91, 92, 94, 95, 96, 98, 99, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 140
];

export const SETS = ['A', 'B', 'C', 'D', 'E'] as const;
export const QUESTIONS_PER_SET = 12;
export const ANSWER_COUNTS = [6, 6, 8, 8, 8];
export const TEST_DURATION_SECONDS = 20 * 60;

export function getQuestionImagePath(questionIndex: number): string {
  const setIndex = Math.floor(questionIndex / 12);
  const questionInSet = (questionIndex % 12) + 1;
  return `/iq-images/${SETS[setIndex]}-${questionInSet}.png`;
}

export function getAnswerCount(questionIndex: number): number {
  const setIndex = Math.floor(questionIndex / 12);
  return ANSWER_COUNTS[setIndex];
}
