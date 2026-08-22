import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Spinner } from '../ui/Spinner';
import { TextArea } from '../ui/TextArea';
import styles from './ExplainForm.module.css';

export interface ExplainFormProps {
  onSubmit: (text: string) => Promise<void>;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

export function ExplainForm({ onSubmit }: ExplainFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateText = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Please paste some text to continue.';
    }

    if (trimmed.length < MIN_LENGTH) {
      return 'Your text is too short. Please paste at least 50 characters.';
    }

    if (trimmed.length > MAX_LENGTH) {
      return `Text exceeds the maximum limit of ${MAX_LENGTH.toLocaleString()} characters.`;
    }

    return null;
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setText(nextValue);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateText(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(text.trim());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to explain the text right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationError = validateText(text);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Study text</p>
          <h2 className={styles.title}>Explain difficult text</h2>
        </div>

        {isSubmitting ? (
          <div className={styles.loading} aria-live="polite">
            <Spinner size="sm" label="Generating your explanation" />
            <span>Generating your explanation…</span>
          </div>
        ) : null}
      </div>

      <TextArea
        id="explain-text"
        label="Paste the text you want explained"
        placeholder="Paste the text you want explained..."
        value={text}
        onChange={handleChange}
        minLength={MIN_LENGTH}
        maxLength={MAX_LENGTH}
        error={error || (text.trim() && validationError ? validationError : undefined)}
        charCount={text.length}
      />

      <div className={styles.footer}>
        <p className={styles.helper}>Minimum {MIN_LENGTH} characters. Maximum {MAX_LENGTH.toLocaleString()} characters.</p>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Explain Text
        </Button>
      </div>

      {error ? <ErrorBanner title="Explanation failed" message={error} variant="error" /> : null}
    </form>
  );
}
