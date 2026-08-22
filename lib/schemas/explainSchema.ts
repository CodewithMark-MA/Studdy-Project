import { z } from 'zod';

export const WatchOutCategorySchema = z.enum([
  'fee',
  'deadline',
  'penalty',
  'auto_renewal',
  'obligation',
  'restriction',
  'liability'
]);

export const WatchOutItemSchema = z.object({
  id: z.number(),
  category: WatchOutCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1)
});

export const ExplainResponseSchema = z.object({
  summary: z.string().min(1),
  detailedExplanation: z.string().min(1),
  watchOutFor: z.array(WatchOutItemSchema)
});

export type ValidatedExplainResponse = z.infer<typeof ExplainResponseSchema>;
