import { describe, expect, it } from 'vitest';

import { gradeQuiz, normalizeShortAnswer } from '../lib/quiz/grading';
import type { QuizQuestion } from '../lib/types';

const multipleChoice: QuizQuestion = {
  id: 1,
  type: 'multiple_choice',
  question: 'Which color is primary?',
  options: ['Red', 'Green', 'Black', 'White'],
  answer: 'Red',
};

const trueFalse: QuizQuestion = {
  id: 2,
  type: 'true_false',
  question: 'The sky is blue.',
  answer: 'True',
};

const shortAnswer: QuizQuestion = {
  id: 3,
  type: 'short_answer',
  question: 'What absorbs light energy?',
  answer: 'Chlorophyll absorbs light energy.',
};

describe('normalizeShortAnswer', () => {
  it('normalizes case, whitespace, and insignificant punctuation', () => {
    expect(normalizeShortAnswer('  CHLOROPHYLL   absorbs light energy! ')).toBe('chlorophyll absorbs light energy');
  });
});

describe('gradeQuiz', () => {
  it('grades multiple choice answers as correct, incorrect, or unanswered', () => {
    const result = gradeQuiz([multipleChoice], { 1: 'Red' });
    expect(result.results[0]?.isCorrect).toBe(true);
    expect(gradeQuiz([multipleChoice], { 1: 'Green' }).score).toBe(0);
    expect(gradeQuiz([multipleChoice], {}).results[0]?.userAnswer).toBe('');
  });

  it('grades true/false answers with the schema casing', () => {
    expect(gradeQuiz([trueFalse], { 2: 'True' }).score).toBe(1);
    expect(gradeQuiz([trueFalse], { 2: 'False' }).score).toBe(0);
    expect(gradeQuiz([trueFalse], {}).results[0]?.isCorrect).toBe(false);
  });

  it('grades normalized short answers without semantic guessing', () => {
    expect(gradeQuiz([shortAnswer], { 3: 'chlorophyll absorbs light energy' }).score).toBe(1);
    expect(gradeQuiz([shortAnswer], { 3: 'Chlorophyll   absorbs light energy.' }).score).toBe(1);
    expect(gradeQuiz([shortAnswer], { 3: 'Green pigment absorbs light' }).score).toBe(0);
    expect(gradeQuiz([shortAnswer], {}).score).toBe(0);
  });

  it('calculates overall score, percentage, and result order', () => {
    const result = gradeQuiz([multipleChoice, trueFalse, shortAnswer], {
      1: 'Red',
      2: 'False',
      3: 'CHLOROPHYLL absorbs light energy!',
    });

    expect(result.score).toBe(2);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67);
    expect(result.results.map((item) => item.index)).toEqual([0, 1, 2]);
    expect(result.results.map((item) => item.correctAnswer)).toEqual(['Red', 'True', 'Chlorophyll absorbs light energy.']);
  });

  it('supports perfect, empty, and unanswered ten-question quizzes', () => {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      ...multipleChoice,
      id: index + 1,
    }));

    expect(gradeQuiz(questions, Object.fromEntries(questions.map((question) => [question.id, 'Red']))).percentage).toBe(100);
    expect(gradeQuiz(questions, {}).score).toBe(0);
    expect(gradeQuiz(questions, { 1: 'Red', 2: 'Red' }).results.filter((item) => !item.isCorrect)).toHaveLength(8);
  });
});
