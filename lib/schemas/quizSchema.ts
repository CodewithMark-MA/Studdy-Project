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
  questions: z.array(QuizQuestionSchema).length(10, "Must contain exactly 10 questions")
}).refine((data) => {
  const mc = data.questions.filter(q => q.type === 'multiple_choice').length;
  const tf = data.questions.filter(q => q.type === 'true_false').length;
  const sa = data.questions.filter(q => q.type === 'short_answer').length;
  return mc === 4 && tf === 3 && sa === 3;
}, {
  message: "Quiz must contain exactly 4 Multiple Choice, 3 True/False, and 3 Short Answer questions"
});

export type ValidatedQuizResponse = z.infer<typeof QuizResponseSchema>;
