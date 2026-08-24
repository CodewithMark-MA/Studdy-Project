import { NextResponse } from 'next/server';
import { z } from 'zod';

import { safeParseAiJson } from '../../../lib/cleanJson';
import { checkRateLimit } from '../../../lib/rateLimit';
import { QuizQuestionSchema, QuizResponseSchema } from '../../../lib/schemas/quizSchema';
import type { ApiErrorPayload } from '../../../lib/types';
import { validateInputText } from '../../../lib/validateInput';
import { QUIZ_MAX_INPUT_LENGTH } from '../../../lib/quiz/constants';

const QUIZ_SYSTEM_PROMPT = `
You are an expert educational assessment generator.
Create one batch of study questions based only on the provided source text.
Return valid JSON only in this structure:
{
  "questions": [
    {
      "id": number,
      "type": "multiple_choice",
      "question": string,
      "options": [string, string, string, string],
      "answer": string,
      "explanation": string
    },
    {
      "id": number,
      "type": "true_false",
      "question": string,
      "answer": "True" | "False",
      "explanation": string
    },
    {
      "id": number,
      "type": "short_answer",
      "question": string,
      "answer": string,
      "explanation": string
    }
  ]
}
Requirements for this batch:
- Follow the exact question count and type distribution specified by the user message.
- Each multiple choice question must have exactly 4 options.
- Each true/false question must not include an options array.
- Each short answer question must not include an options array.
- Use only the source text to inform the questions.
- Cover the source material broadly with a mixture of recall, comprehension, and application questions.
- Avoid duplicate or substantially similar questions.
- Include easy, medium, and challenging questions.
- Keep questions, options, and answers concise so all 50 questions fit in one response.
- Explanations are optional; omit them or keep them to one short sentence.
- Ensure answers are accurate and strings are not empty.
`;

const BATCHES = [
  { label: 'Batch 1', multipleChoice: 10, trueFalse: 8, shortAnswer: 7 },
  { label: 'Batch 2', multipleChoice: 10, trueFalse: 7, shortAnswer: 8 },
] as const;
const MAX_COMPLETION_TOKENS = 4096;
const BatchResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(25, 'Each batch must contain exactly 25 questions'),
});

class GroqRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Groq API request failed with status ${status}.`);
  }
}

const errorResponse = (code: ApiErrorPayload['error']['code'], message: string, status: number) =>
  NextResponse.json({ success: false, error: { code, message } }, { status });

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_INPUT', 'Request body must be valid JSON.', 400);
    }

    const text = typeof body === 'object' && body !== null && 'text' in body ? (body as { text?: unknown }).text : undefined;
    const validationResult = validateInputText(text, QUIZ_MAX_INPUT_LENGTH);

    if (!validationResult.isValid) {
      return errorResponse(
        validationResult.errorCode === 'TOO_SHORT' ? 'TOO_SHORT' : validationResult.errorCode === 'TOO_LONG' ? 'TOO_LONG' : 'INVALID_INPUT',
        validationResult.errorMessage ?? 'Invalid input.',
        validationResult.errorCode === 'TOO_SHORT' || validationResult.errorCode === 'TOO_LONG' ? 400 : 400,
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (rateLimit.isLimited) {
      return errorResponse('RATE_LIMITED', 'Too many quiz requests. Please wait a moment and try again.', 429);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return errorResponse('INTERNAL_ERROR', 'Groq API key is not configured.', 500);
    }

    const batchResults = await Promise.all(BATCHES.map(async (batch) => {
      const result = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          messages: [
            { role: 'system', content: QUIZ_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `User notes:\n${text}\n\nGenerate exactly 25 questions for ${batch.label}: ${batch.multipleChoice} multiple_choice, ${batch.trueFalse} true_false, and ${batch.shortAnswer} short_answer. Avoid duplicates across this batch and keep fields concise.`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!result.ok) {
        throw new GroqRequestError(result.status);
      }

      const completion = (await result.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const rawText = typeof completion.choices?.[0]?.message?.content === 'string'
        ? completion.choices[0].message.content
        : '';
      if (!rawText.trim()) throw new Error('The AI response was empty.');

      const parsed = safeParseAiJson<unknown>(rawText);
      const batchParse = BatchResponseSchema.safeParse(parsed);
      if (!batchParse.success) {
        throw new Error(`BATCH_VALIDATION: ${batchParse.error.issues[0]?.message || `${batch.label} validation failed.`}`);
      }

      const counts = batchParse.data.questions.reduce((result, question) => {
        result[question.type] += 1;
        return result;
      }, { multiple_choice: 0, true_false: 0, short_answer: 0 });
      if (counts.multiple_choice !== batch.multipleChoice || counts.true_false !== batch.trueFalse || counts.short_answer !== batch.shortAnswer) {
        throw new Error(`BATCH_VALIDATION: ${batch.label} has an invalid question distribution.`);
      }
      return batchParse.data.questions;
    }));

    const combined = {
      title: 'Study Practice Quiz',
      questions: batchResults.flat().map((question, index) => ({ ...question, id: index + 1 })),
    };
    const parseResult = QuizResponseSchema.safeParse(combined);
    if (!parseResult.success) {
      return errorResponse('INVALID_INPUT', parseResult.error.issues[0]?.message || 'Quiz schema validation failed.', 400);
    }

    return NextResponse.json({ success: true, data: parseResult.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Quiz generation failed.';
    if (message.startsWith('BATCH_VALIDATION:')) {
      return errorResponse('INVALID_INPUT', message.replace('BATCH_VALIDATION: ', ''), 400);
    }
    if (error instanceof GroqRequestError && error.status === 429) {
      return errorResponse('RATE_LIMITED', 'The quiz service is temporarily busy. Please wait a minute and try again.', 429);
    }
    return errorResponse('AI_GENERATION_FAILED', message, 500);
  }
}
