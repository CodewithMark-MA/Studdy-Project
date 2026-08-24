import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../app/api/explain/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockGroqResponse = (content: string) => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  });
};

const VALID_TEXT = 'A'.repeat(500);

const validExplainPayload = {
  summary: 'This lease renews automatically unless you provide notice in time.',
  detailedExplanation: 'Your contract extends for another full year if you miss the cancellation deadline. The terms can be confusing, but the key point is that the renewal happens automatically unless you act before the deadline.',
  watchOutFor: [
    {
      id: 1,
      category: 'auto_renewal',
      title: 'Automatic renewal',
      description: 'The contract renews without additional approval if notice is not given.',
    },
  ],
};

async function makeRequest(text: string, headers: Record<string, string> = {}) {
  return POST(
    new Request('http://localhost/api/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ text }),
    }),
  );
}

describe('Explain API route', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFetch.mockReset();
  });

  it('accepts valid input and returns a validated explanation', async () => {
    mockGroqResponse(JSON.stringify(validExplainPayload));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary).toBe(validExplainPayload.summary);
    expect(body.data.watchOutFor).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        body: expect.stringContaining('"model":"openai/gpt-oss-120b"'),
      }),
    );
  });

  it('rejects input shorter than 50 characters', async () => {
    const response = await makeRequest('too short');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('TOO_SHORT');
  });

  it('accepts input longer than the former 5000-character limit', async () => {
    mockGroqResponse(JSON.stringify(validExplainPayload));

    const response = await makeRequest('A'.repeat(5001));

    expect(response.status).toBe(200);
  });

  it('accepts valid explain payload with empty watchOutFor array', async () => {
    mockGroqResponse(JSON.stringify({
        ...validExplainPayload,
        watchOutFor: [],
      }));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.watchOutFor).toEqual([]);
  });

  it('rejects malformed AI JSON', async () => {
    mockGroqResponse('```json\n{ invalid json');

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('AI_GENERATION_FAILED');
  });

  it('rejects invalid schema response', async () => {
    mockGroqResponse(JSON.stringify({
        summary: 'Summary only',
      }));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('rejects rate-limited requests', async () => {
    for (let i = 0; i < 11; i += 1) {
      mockGroqResponse(JSON.stringify(validExplainPayload));

      const response = await makeRequest(VALID_TEXT, { 'x-forwarded-for': '10.0.0.20' });

      if (i < 10) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
        const body = await response.json();
        expect(body.error.code).toBe('RATE_LIMITED');
        return;
      }
    }

    throw new Error('Expected rate limit rejection');
  });

  it('returns structured errors when JSON is invalid', async () => {
    const response = await POST(
      new Request('http://localhost/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad json',
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });
});
