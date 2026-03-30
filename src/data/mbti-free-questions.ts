import { mbtiQuestions, type MBTIQuestion } from '@/data/mbti-questions';

export interface MBTIFreeQuestion extends Omit<MBTIQuestion, 'no'> {
  no: number;
  sourceNo: number;
}

const FREE_QUESTION_INDEXES_BY_DIMENSION = [0, 12, 24, 36, 48] as const;

export const mbtiFreeQuestions: MBTIFreeQuestion[] = ['EI', 'SN', 'TF', 'JP'].flatMap((dimensionKey, dimensionIndex) => {
  const dimensionQuestions = mbtiQuestions.filter((question) => question.dimension === dimensionKey);

  return FREE_QUESTION_INDEXES_BY_DIMENSION.map((questionIndex, localIndex) => {
    const sourceQuestion = dimensionQuestions[questionIndex];

    return {
      ...sourceQuestion,
      no: dimensionIndex * FREE_QUESTION_INDEXES_BY_DIMENSION.length + localIndex + 1,
      sourceNo: sourceQuestion.no,
    };
  });
});
