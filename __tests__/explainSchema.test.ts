import { describe, it, expect } from 'vitest';
import { ExplainResponseSchema } from '../lib/schemas/explainSchema';

describe('Explain Schema Validation Tests', () => {
  const validPayload = {
    summary: 'This lease automatically renews annually unless canceled 60 days in advance.',
    detailedExplanation: 'Your lease contract extends for another full year if notice is not given on time.',
    watchOutFor: [
      {
        id: 1,
        category: 'auto_renewal',
        title: 'Auto-Renewal Clause',
        description: 'Requires 60 days prior written notice to avoid automatic 12-month extension.'
      }
    ]
  };

  it('accepts a valid explanation payload with populated watchOutFor items', () => {
    const parseResult = ExplainResponseSchema.safeParse(validPayload);
    expect(parseResult.success).toBe(true);
  });

  it('accepts a valid explanation payload with an empty watchOutFor array', () => {
    const payloadNoWarnings = {
      ...validPayload,
      watchOutFor: []
    };
    const parseResult = ExplainResponseSchema.safeParse(payloadNoWarnings);
    expect(parseResult.success).toBe(true);
  });

  it('accepts a valid explanation payload with multiple watchOutFor entries', () => {
    const payloadWithMultipleWarnings = {
      ...validPayload,
      watchOutFor: [
        ...validPayload.watchOutFor,
        {
          id: 2,
          category: 'deadline',
          title: 'Notice Deadline',
          description: 'Missing the notice period may lock in a new term.'
        }
      ]
    };
    const parseResult = ExplainResponseSchema.safeParse(payloadWithMultipleWarnings);
    expect(parseResult.success).toBe(true);
  });

  it('rejects a payload missing the summary field', () => {
    const invalidPayload = {
      detailedExplanation: 'Summary text',
      watchOutFor: []
    };
    const parseResult = ExplainResponseSchema.safeParse(invalidPayload);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a payload missing the detailedExplanation field', () => {
    const invalidPayload = {
      summary: 'Summary text',
      watchOutFor: []
    };
    const parseResult = ExplainResponseSchema.safeParse(invalidPayload);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a payload missing watchOutFor entirely', () => {
    const invalidPayload = {
      summary: 'Summary text',
      detailedExplanation: 'The explanation.'
    };
    const parseResult = ExplainResponseSchema.safeParse(invalidPayload);
    expect(parseResult.success).toBe(false);
  });

  it('rejects watchOutFor items with invalid category enums', () => {
    const invalidPayload = {
      ...validPayload,
      watchOutFor: [
        {
          id: 1,
          category: 'invalid_category_name',
          title: 'Title',
          description: 'Detail'
        }
      ]
    };
    const parseResult = ExplainResponseSchema.safeParse(invalidPayload);
    expect(parseResult.success).toBe(false);
  });

  it('rejects malformed watchOutFor items with missing description', () => {
    const invalidPayload = {
      ...validPayload,
      watchOutFor: [
        {
          id: 1,
          category: 'fee',
          title: 'Fee Watch'
        }
      ]
    };
    const parseResult = ExplainResponseSchema.safeParse(invalidPayload);
    expect(parseResult.success).toBe(false);
  });
});
