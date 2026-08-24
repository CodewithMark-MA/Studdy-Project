import { describe, it, expect } from 'vitest';
import { QuizResponseSchema } from '../lib/schemas/quizSchema';

describe('Quiz Schema Validation Tests', () => {
  const makeValidQuiz = () => ({
    title: 'Cellular Biology Practice Quiz',
    questions: Array.from({ length: 50 }, (_, index) => {
      const id = index + 1;
      if (index < 20) {
        return { id, type: 'multiple_choice' as const, question: `MC Q${id}`, options: ['A', 'B', 'C', 'D'] as [string, string, string, string], answer: 'A' };
      }
      if (index < 35) {
        return { id, type: 'true_false' as const, question: `TF Q${id}`, answer: 'True' as const };
      }
      return { id, type: 'short_answer' as const, question: `SA Q${id}`, answer: `Answer ${id}` };
    })
  });

  it('accepts a valid 50-question payload with an exact 20/15/15 split', () => {
    const parseResult = QuizResponseSchema.safeParse(makeValidQuiz());
    expect(parseResult.success).toBe(true);
  });

  it('rejects a quiz with fewer than 50 questions', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions = invalidQuiz.questions.slice(0, 49);
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a quiz with more than 50 questions', () => {
    const invalidQuiz = makeValidQuiz();
    invalidQuiz.questions.push({
      id: 51,
      type: 'short_answer',
      question: 'Extra question',
      answer: 'Extra answer',
    });
    const parseResult = QuizResponseSchema.safeParse(invalidQuiz);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a quiz with the wrong 20/15/15 distribution', () => {
    const invalidQuiz = makeValidQuiz();
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
