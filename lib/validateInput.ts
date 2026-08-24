export interface InputValidationResult {
  isValid: boolean;
  errorCode?: 'INVALID_INPUT' | 'TOO_SHORT' | 'TOO_LONG';
  errorMessage?: string;
}

export function validateInputText(text: unknown, maxLength?: number): InputValidationResult {
  if (typeof text !== 'string') {
    return {
      isValid: false,
      errorCode: 'INVALID_INPUT',
      errorMessage: 'Please paste some text to continue.',
    };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      errorCode: 'INVALID_INPUT',
      errorMessage: 'Please paste some text to continue.',
    };
  }

  if (trimmed.length < 50) {
    return {
      isValid: false,
      errorCode: 'TOO_SHORT',
      errorMessage: 'Your text is too short. Please paste at least 50 characters.',
    };
  }

  if (typeof maxLength === 'number' && trimmed.length > maxLength) {
    return {
      isValid: false,
      errorCode: 'TOO_LONG',
      errorMessage: `Text exceeds the maximum limit of ${maxLength.toLocaleString()} characters.`,
    };
  }

  return { isValid: true };
}
