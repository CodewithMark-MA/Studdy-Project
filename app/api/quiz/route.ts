import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

import { safeParseAiJson } from '../../../lib/cleanJson';
import { checkRateLimit } from '../../../lib/rateLimit';
import { QuizResponseSchema } from '../../../lib/schemas/quizSchema';
import type { ApiErrorPayload } from '../../../lib/types';
import { validateInputText } from '../../../lib/validateInput';

const QUIZ_SYSTEM_PROMPT = `
You are an expert educational assessment generator.
Create a quiz based only on the provided source text.
Return valid JSON only in this structure:
{
  "title": string,
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
Requirements:
- Exactly 10 questions total.
- Exactly 4 multiple choice, 3 true/false, and 3 short answer.
- Each multiple choice question must have exactly 4 options.
- Each true/false question must not include an options array.
- Each short answer question must not include an options array.
- Use only the source text to inform the questions.
- Ensure answers are accurate and strings are not empty.
`;

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
    const validationResult = validateInputText(text, 10000);

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse('INTERNAL_ERROR', 'Gemini API key is not configured.', 500);
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `${QUIZ_SYSTEM_PROMPT}\n\nUser notes:\n${text}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = typeof result?.text === 'string' ? result.text : '';
    if (!rawText.trim()) {
      return errorResponse('AI_GENERATION_FAILED', 'The AI response was empty.', 500);
    }

    let parsed: unknown;
    try {
      parsed = safeParseAiJson<unknown>(rawText);
    } catch {
      return errorResponse('AI_GENERATION_FAILED', 'The AI returned malformed JSON.', 500);
    }

    const parseResult = QuizResponseSchema.safeParse(parsed);
    if (!parseResult.success) {
      return errorResponse('INVALID_INPUT', parseResult.error.issues[0]?.message || 'Quiz schema validation failed.', 400);
    }

    return NextResponse.json({ success: true, data: parseResult.data }, { status: 200 });
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unexpected server error.',
      500,
    );
  }
}
