import { z } from 'zod';

export const MultipleChoiceQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('multiple_choice'),
  question: z.string().min(1),
  options: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1)
  ]),
  answer: z.string().min(1),
  explanation: z.string().optional()
});

export const TrueFalseQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('true_false'),
  question: z.string().min(1),
  options: z.undefined().optional(),
  answer: z.enum(['True', 'False']),
  explanation: z.string().optional()
});

export const ShortAnswerQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('short_answer'),
  question: z.string().min(1),
  options: z.undefined().optional(),
  answer: z.string().min(1),
  explanation: z.string().optional()
});

export const QuizQuestionSchema = z.union([
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  ShortAnswerQuestionSchema
]).refine((question) => {
  if (question.type === 'multiple_choice') {
    return question.options.includes(question.answer);
  }

  return true;
}, {
  message: 'Multiple choice answer must match one of the four options.',
  path: ['answer']
});

export const QuizResponseSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuizQuestionSchema).length(50, "Must contain exactly 50 questions")
}).refine((data) => {
  const mc = data.questions.filter(q => q.type === 'multiple_choice').length;
  const tf = data.questions.filter(q => q.type === 'true_false').length;
  const sa = data.questions.filter(q => q.type === 'short_answer').length;
  return mc === 20 && tf === 15 && sa === 15;
}, {
  message: "Quiz must contain exactly 20 Multiple Choice, 15 True/False, and 15 Short Answer questions"
});

export type ValidatedQuizResponse = z.infer<typeof QuizResponseSchema>;
