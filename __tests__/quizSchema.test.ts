import { describe, it, expect } from 'vitest';
import { QuizResponseSchema } from '../lib/schemas/quizSchema';

describe('Quiz Schema Validation Tests', () => {
  const makeValidQuiz = () => ({
    title: 'Cellular Biology Practice Quiz',
    questions: [
      { id: 1, type: 'multiple_choice', question: 'MC Q1', options: ['A', 'B', 'C', 'D'], answer: 'A' },
      { id: 2, type: 'multiple_choice', question: 'MC Q2', options: ['A', 'B', 'C', 'D'], answer: 'B' },
      { id: 3, type: 'multiple_choice', question: 'MC Q3', options: ['A', 'B', 'C', 'D'], answer: 'C' },
      { id: 4, type: 'multiple_choice', question: 'MC Q4', options: ['A', 'B', 'C', 'D'], answer: 'D' },
      { id: 5, type: 'true_false', question: 'TF Q1', answer: 'True' },
      { id: 6, type: 'true_false', question: 'TF Q2', answer: 'False' },
      { id: 7, type: 'true_false', question: 'TF Q3', answer: 'True' },
      { id: 8, type: 'short_answer', question: 'SA Q1', answer: 'Answer 1' },
      { id: 9, type: 'short_answer', question: 'SA Q2', answer: 'Answer 2' },
      { id: 10, type: 'short_answer', question: 'SA Q3', answer: 'Answer 3' }
    ]
  });

  it('accepts a valid 10-question payload with an exact 4/3/3 split', () => {
    const parseResult = QuizResponseSchema.safeParse(makeValidQuiz());
    expect(parseResult.success).toBe(true);
  });

  it('rejects a quiz with fewer than 10 questions', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions = invalidQuiz.questions.slice(0, 9);
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a quiz with the wrong 4/3/3 distribution', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions = invalidQuiz.questions.slice(0, 10);
    invalidQuiz.questions[0] = { ...invalidQuiz.questions[0], type: 'true_false', answer: 'True' };
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a multiple_choice question with 3 options instead of 4', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[0] = { ...invalidQuiz.questions[0], options: ['A', 'B', 'C'] } as typeof invalidQuiz.questions[0];
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a multiple_choice question whose answer is not one of the options', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[0] = { ...invalidQuiz.questions[0], answer: 'Z' };
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a true_false question with an invalid answer value', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[4] = { ...invalidQuiz.questions[4], answer: 'Maybe' };
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a true_false question that includes options', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[4] = { ...invalidQuiz.questions[4], options: ['True', 'False'] } as typeof invalidQuiz.questions[4];
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a short_answer question with an empty answer', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[8] = { ...invalidQuiz.questions[8], answer: '' };
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a short_answer question that includes options', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions[8] = { ...invalidQuiz.questions[8], options: ['A', 'B'] } as typeof invalidQuiz.questions[8];
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });
});
