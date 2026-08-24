import type { QuizQuestion } from '../../lib/types';

export type QuizAnswers = Record<number, string>;

export interface QuizQuestionResult {
  index: number;
  question: QuizQuestion;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizGradingResult {
  score: number;
  total: number;
  percentage: number;
  results: QuizQuestionResult[];
}

export function normalizeShortAnswer(answer: string): string {
  return answer
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, ' ');
}

function answersMatch(question: QuizQuestion, userAnswer: string): boolean {
  if (!userAnswer.trim()) {
    return false;
  }

  if (question.type === 'short_answer') {
    return normalizeShortAnswer(userAnswer) === normalizeShortAnswer(question.answer);
  }

  return userAnswer === question.answer;
}

export function gradeQuiz(questions: QuizQuestion[], answers: QuizAnswers): QuizGradingResult {
  const results = questions.map((question, index) => {
    const userAnswer = answers[question.id] ?? '';

    return {
      index,
      question,
      userAnswer,
      correctAnswer: question.answer,
      isCorrect: answersMatch(question, userAnswer),
    };
  });

  const score = results.filter((result) => result.isCorrect).length;

  return {
    score,
    total: questions.length,
    percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
    results,
  };
}
