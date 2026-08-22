import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Spinner } from '../ui/Spinner';
import { TextArea } from '../ui/TextArea';
import styles from './QuizForm.module.css';

export interface QuizFormProps {
  onSubmit: (notes: string) => Promise<void>;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 10000;

export function QuizForm({ onSubmit }: QuizFormProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateNotes = (value: string) => {
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
    setNotes(nextValue);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateNotes(notes);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(notes.trim());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to generate your quiz right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationError = validateNotes(notes);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Study notes</p>
          <h2 className={styles.title}>Generate a practice quiz</h2>
        </div>

        {isSubmitting ? (
          <div className={styles.loading} aria-live="polite">
            <Spinner size="sm" label="Generating your quiz" />
            <span>Generating your quiz…</span>
          </div>
        ) : null}
      </div>

      <TextArea
        id="quiz-notes"
        label="Paste your class notes, chapters, or study text"
        placeholder="Paste your notes here..."
        value={notes}
        onChange={handleChange}
        minLength={MIN_LENGTH}
        maxLength={MAX_LENGTH}
        error={error || (notes.trim() && validationError ? validationError : undefined)}
        charCount={notes.length}
      />

      <div className={styles.footer}>
        <p className={styles.helper}>Minimum {MIN_LENGTH} characters. Maximum {MAX_LENGTH.toLocaleString()} characters.</p>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Generate Quiz
        </Button>
      </div>

      {error ? <ErrorBanner title="Quiz generation failed" message={error} variant="error" /> : null}
    </form>
  );
}
