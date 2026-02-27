import { mbtiCareers, FFM_TRAITS } from '@/data/career-data';

export interface FFMResult {
  trait: string;
  percentage: number;
}

export interface CareerResult {
  ffmScores: FFMResult[];
  mbtiType: string;
  mbtiTypeName: string;
  careers: string[];
}

export function calculateCareerResult(answers: number[]): CareerResult {
  const processedAnswers = answers.map((value, index) => {
    if (index < 5) return 6 - value;
    return value;
  });

  const ffmScores: FFMResult[] = [];
  for (let i = 0; i < 5; i++) {
    const sum = processedAnswers[i] + processedAnswers[i + 5];
    ffmScores.push({
      trait: FFM_TRAITS[i],
      percentage: sum * 10,
    });
  }

  let mbtiType = '';
  mbtiType += processedAnswers[2] > processedAnswers[7] ? 'E' : 'I';
  mbtiType += processedAnswers[0] > processedAnswers[5] ? 'N' : 'S';
  mbtiType += processedAnswers[3] > processedAnswers[8] ? 'F' : 'T';
  mbtiType += processedAnswers[1] > processedAnswers[6] ? 'J' : 'P';

  const careerMatch = mbtiCareers.find(c => c.type === mbtiType);
  
  return {
    ffmScores,
    mbtiType,
    mbtiTypeName: careerMatch?.typeName ?? '',
    careers: careerMatch?.professions ?? [],
  };
}
