import { describe, it, expect } from 'vitest';
import { validateInputText } from '../lib/validateInput';

describe('Input Validation Tests', () => {
  it('rejects empty text', () => {
    const result = validateInputText('', 5000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  it('rejects non-string input', () => {
    const result = validateInputText(null, 5000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  it('rejects whitespace-only text', () => {
    const result = validateInputText('   \n\t  ', 5000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  it('rejects text shorter than 50 characters (e.g. 49 chars)', () => {
    const text49 = 'A'.repeat(49);
    const result = validateInputText(text49, 5000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('TOO_SHORT');
  });

  it('accepts text with exactly 50 characters', () => {
    const text50 = 'A'.repeat(50);
    const result = validateInputText(text50, 5000);
    expect(result.isValid).toBe(true);
  });

  it('accepts text at the explain limit of 5,000 characters', () => {
    const text5000 = 'A'.repeat(5000);
    const result = validateInputText(text5000, 5000);
    expect(result.isValid).toBe(true);
  });

  it('rejects text one character above the explain limit', () => {
    const text5001 = 'A'.repeat(5001);
    const result = validateInputText(text5001, 5000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('TOO_LONG');
  });

  it('accepts text at the quiz limit of 10,000 characters', () => {
    const text10000 = 'A'.repeat(10000);
    const result = validateInputText(text10000, 10000);
    expect(result.isValid).toBe(true);
  });

  it('rejects text one character above the quiz limit', () => {
    const text10001 = 'A'.repeat(10001);
    const result = validateInputText(text10001, 10000);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('TOO_LONG');
  });
});
