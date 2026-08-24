import { describe, expect, it } from 'vitest';

import { POST } from '../app/api/extract/route';

const validText = 'This is a sufficiently long study document with more than fifty characters.';

async function makeRequest(name: string, content: string, type: string) {
  const file = {
    name,
    size: Buffer.byteLength(content),
    type,
    arrayBuffer: async () => Buffer.from(content),
  };
  return POST({ formData: async () => new Map([['file', file]]) } as unknown as Request);
}

describe('Extract API route', () => {
  it('extracts text from a TXT file', async () => {
    const response = await makeRequest('notes.txt', validText, 'text/plain');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, text: validText });
  });

  it('accepts PDF and DOCX file types for processing', async () => {
    for (const [name, type] of [
      ['notes.pdf', 'application/pdf'],
      ['notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ]) {
      const response = await makeRequest(name, 'not a real document', type);
      expect(response.status).toBe(422);
    }
  });

  it('rejects unsupported file types', async () => {
    const response = await makeRequest('notes.csv', 'content', 'text/csv');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toMatch(/unsupported file/i);
  });

  it('rejects empty files', async () => {
    const response = await makeRequest('empty.txt', '', 'text/plain');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toMatch(/empty/i);
  });

  it('still rejects extracted text below the minimum', async () => {
    const shortResponse = await makeRequest('notes.txt', 'too short', 'text/plain');

    expect((await shortResponse.json()).error.message).toMatch(/at least 50/i);
  });

  it('accepts extracted text above the former 10000-character limit', async () => {
    const response = await makeRequest('notes.txt', 'A'.repeat(10001), 'text/plain');

    expect(response.status).toBe(200);
  });
});
