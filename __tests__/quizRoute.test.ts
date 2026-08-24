import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../app/api/quiz/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockGroqResponse = (content: string) => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  });
};

const mockBatchResponses = (first: string, second: string) => {
  mockFetch
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: first } }] }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: second } }] }) });
};

const VALID_TEXT = 'A'.repeat(500);

const validQuestionPayload = {
  title: 'Cellular Biology Practice Quiz',
  questions: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'Which organelle makes ATP?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'],
      answer: 'Mitochondria',
      explanation: 'Mitochondria generate ATP through cellular respiration.',
    },
    {
      id: 2,
      type: 'multiple_choice',
      question: 'Which process converts glucose to pyruvate?',
      options: ['Photosynthesis', 'Glycolysis', 'Fermentation', 'Diffusion'],
      answer: 'Glycolysis',
      explanation: 'Glycolysis splits glucose into pyruvate in the cytosol.',
    },
    {
      id: 3,
      type: 'multiple_choice',
      question: 'Which phase of mitosis has chromosomes aligned in the center?',
      options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
      answer: 'Metaphase',
      explanation: 'Metaphase lines chromosomes at the metaphase plate.',
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'Which molecule carries genetic instructions?',
      options: ['RNA', 'DNA', 'Protein', 'Lipid'],
      answer: 'DNA',
      explanation: 'DNA stores the hereditary instructions for cells.',
    },
    {
      id: 5,
      type: 'true_false',
      question: 'Cells need energy to maintain homeostasis.',
      answer: 'True',
      explanation: 'Homeostasis requires cellular work and energy use.',
    },
    {
      id: 6,
      type: 'true_false',
      question: 'Osmosis requires a membrane-bound transport protein.',
      answer: 'False',
      explanation: 'Osmosis is passive movement of water across a membrane.',
    },
    {
      id: 7,
      type: 'true_false',
      question: 'Enzymes are consumed during chemical reactions.',
      answer: 'False',
      explanation: 'Enzymes catalyze reactions without being permanently used up.',
    },
    {
      id: 8,
      type: 'short_answer',
      question: 'What is the main function of ribosomes?',
      answer: 'Protein synthesis',
      explanation: 'Ribosomes build proteins from amino acids.',
    },
    {
      id: 9,
      type: 'short_answer',
      question: 'Name one difference between plant and animal cells.',
      answer: 'Plant cells have a cell wall',
      explanation: 'Plant cells usually contain a cell wall and chloroplasts.',
    },
    {
      id: 10,
      type: 'short_answer',
      question: 'Define diffusion in one sentence.',
      answer: 'Diffusion is the movement of particles from high to low concentration.',
      explanation: 'Diffusion is passive movement driven by a concentration gradient.',
    },
  ],
};

validQuestionPayload.questions.push(
  ...Array.from({ length: 16 }, (_, index) => ({
    id: index + 11,
    type: 'multiple_choice',
    question: `Additional multiple choice question ${index + 1}?`,
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    explanation: 'The source text supports this answer.',
  })),
  ...Array.from({ length: 12 }, (_, index) => ({
    id: index + 27,
    type: 'true_false',
    question: `Additional true false question ${index + 1}?`,
    answer: 'True',
    explanation: 'The source text supports this answer.',
  })),
  ...Array.from({ length: 12 }, (_, index) => ({
    id: index + 39,
    type: 'short_answer',
    question: `Additional short answer question ${index + 1}?`,
    answer: 'Answer from the source text',
    explanation: 'The source text supports this answer.',
  })),
);

const validBatchOne = {
  questions: [
    ...validQuestionPayload.questions.filter((question) => question.type === 'multiple_choice').slice(0, 10),
    ...validQuestionPayload.questions.filter((question) => question.type === 'true_false').slice(0, 8),
    ...validQuestionPayload.questions.filter((question) => question.type === 'short_answer').slice(0, 7),
  ],
};
const validBatchTwo = {
  questions: [
    ...validQuestionPayload.questions.filter((question) => question.type === 'multiple_choice').slice(10, 20),
    ...validQuestionPayload.questions.filter((question) => question.type === 'true_false').slice(8, 15),
    ...validQuestionPayload.questions.filter((question) => question.type === 'short_answer').slice(7, 15),
  ],
};

async function makeRequest(text: string, headers: Record<string, string> = {}) {
  return POST(
    new Request('http://localhost/api/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ text }),
    }),
  );
}

describe('Quiz API route', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFetch.mockReset();
  });

  it('accepts valid input and returns a validated quiz', async () => {
    mockBatchResponses(JSON.stringify(validBatchOne), JSON.stringify(validBatchTwo));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.questions).toHaveLength(50);
    expect(body.data.questions.filter((q: any) => q.type === 'multiple_choice')).toHaveLength(20);
    expect(body.data.questions.filter((q: any) => q.type === 'true_false')).toHaveLength(15);
    expect(body.data.questions.filter((q: any) => q.type === 'short_answer')).toHaveLength(15);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        body: expect.stringContaining('"max_completion_tokens":8192'),
      }),
    );
  });

  it('rejects input shorter than 50 characters', async () => {
    const response = await makeRequest('too short');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('TOO_SHORT');
  });

  it('accepts input longer than the former 10000-character limit', async () => {
    mockBatchResponses(JSON.stringify(validBatchOne), JSON.stringify(validBatchTwo));

    const response = await makeRequest('A'.repeat(10001));

    expect(response.status).toBe(200);
  });

  it('rejects rate-limited requests', async () => {
    for (let i = 0; i < 11; i += 1) {
      mockBatchResponses(JSON.stringify(validBatchOne), JSON.stringify(validBatchTwo));

      const response = await makeRequest(VALID_TEXT, { 'x-forwarded-for': '10.0.0.100' });

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

  it('rejects malformed AI JSON', async () => {
    mockBatchResponses('```json\n{ invalid json', JSON.stringify(validBatchTwo));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('AI_GENERATION_FAILED');
  });

  it('rejects invalid schema output', async () => {
    mockBatchResponses(JSON.stringify({ questions: [{ id: 1, type: 'multiple_choice', question: 'Question?', options: ['A', 'B'], answer: 'A' }] }), JSON.stringify(validBatchTwo));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('rejects invalid question distribution', async () => {
    const wrongBatch = {
      questions: validBatchOne.questions.map((question, index) => index === 0
        ? { ...question, type: 'true_false', answer: 'True', options: undefined }
        : question),
    };
    mockBatchResponses(JSON.stringify(wrongBatch), JSON.stringify(validBatchTwo));

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('returns a clean error when either Groq batch fails', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Groq unavailable'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(validBatchTwo) } }] }) });

    const response = await makeRequest(VALID_TEXT);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: { code: 'AI_GENERATION_FAILED', message: 'Groq unavailable' } });
  });
});
