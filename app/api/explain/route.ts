import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

import { safeParseAiJson } from '../../../lib/cleanJson';
import { checkRateLimit } from '../../../lib/rateLimit';
import { ExplainResponseSchema } from '../../../lib/schemas/explainSchema';
import type { ApiErrorPayload } from '../../../lib/types';
import { validateInputText } from '../../../lib/validateInput';

const EXPLAIN_SYSTEM_PROMPT = `
You are a clear-language assistant, not a legal or financial advisor.
Explain the supplied text in simpler language and identify important issues that deserve attention.
Return valid JSON only in this structure:
{
  "summary": string,
  "detailedExplanation": string,
  "watchOutFor": [
    {
      "id": number,
      "category": "fee" | "deadline" | "penalty" | "auto_renewal" | "obligation" | "restriction" | "liability",
      "title": string,
      "description": string
    }
  ]
}
Requirements:
- summary is a short 1-2 sentence overview.
- detailedExplanation is a clear plain-language breakdown.
- watchOutFor is an array of important flagged items, and it may be empty if nothing stands out.
- Do not provide legal, financial, or professional advice.
- Use only the supplied text to inform the explanation.
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
    const validationResult = validateInputText(text, 5000);

    if (!validationResult.isValid) {
      return errorResponse(
        validationResult.errorCode === 'TOO_SHORT' ? 'TOO_SHORT' : validationResult.errorCode === 'TOO_LONG' ? 'TOO_LONG' : 'INVALID_INPUT',
        validationResult.errorMessage ?? 'Invalid input.',
        400,
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (rateLimit.isLimited) {
      return errorResponse('RATE_LIMITED', 'Too many explain requests. Please wait a moment and try again.', 429);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse('INTERNAL_ERROR', 'Gemini API key is not configured.', 500);
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: `${EXPLAIN_SYSTEM_PROMPT}\n\nUser text:\n${text}`,
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

    const parseResult = ExplainResponseSchema.safeParse(parsed);
    if (!parseResult.success) {
      return errorResponse('INVALID_INPUT', parseResult.error.issues[0]?.message || 'Explain schema validation failed.', 400);
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
