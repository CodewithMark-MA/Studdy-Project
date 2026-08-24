'use client';

import React, { useState } from 'react';
import { QuizForm } from '../../components/quiz/QuizForm';
import { QuizList } from '../../components/quiz/QuizList';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import type { QuizQuestion, QuizSuccessResponsePayload } from '../../lib/types';
import styles from './page.module.css';

const MIN_LENGTH = 50;
export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (notes: string) => {
    const trimmed = notes.trim();

    if (!trimmed) {
      throw new Error('Please paste some text to continue.');
    }

    if (trimmed.length < MIN_LENGTH) {
      throw new Error('Your text is too short. Please paste at least 50 characters.');
    }

    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmed }),
    });

    const payload = (await response.json()) as QuizSuccessResponsePayload | { success: false; error: { message: string } };

    if (!response.ok || !('success' in payload) || payload.success !== true) {
      const message = payload && 'error' in payload && typeof payload.error?.message === 'string'
        ? payload.error.message
        : 'Unable to generate your quiz right now.';
      throw new Error(message);
    }

    setError(null);
    setQuestions(payload.data.questions);
  };

  const handleReset = () => {
    setQuestions([]);
    setError(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {!questions.length ? (
          <QuizForm onSubmit={handleSubmit} />
        ) : (
          <QuizList questions={questions} onReset={handleReset} />
        )}

        {error ? <ErrorBanner title="Quiz generation failed" message={error} variant="error" /> : null}
      </div>
    </main>
  );
}
