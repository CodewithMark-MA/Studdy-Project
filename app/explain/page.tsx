'use client';

import React, { useState } from 'react';

import { ExplainForm } from '../../components/explain/ExplainForm';
import { ExplainResult } from '../../components/explain/ExplainResult';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import type { ExplainSuccessResponsePayload } from '../../lib/types';
import styles from './page.module.css';

export default function ExplainPage() {
  const [result, setResult] = useState<ExplainSuccessResponsePayload['data'] | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) {
      throw new Error('Please paste some text to continue.');
    }

    if (trimmed.length < 50) {
      throw new Error('Your text is too short. Please paste at least 50 characters.');
    }

    if (trimmed.length > 5000) {
      throw new Error('Text exceeds the maximum limit of 5,000 characters.');
    }

    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmed }),
    });

    const payload = (await response.json()) as
      | ExplainSuccessResponsePayload
      | { success: false; error: { message: string } };

    if (!response.ok || !('success' in payload) || payload.success !== true) {
      const message =
        payload && 'error' in payload && typeof payload.error?.message === 'string'
          ? payload.error.message
          : 'Unable to explain the text right now.';
      throw new Error(message);
    }

    setOriginalText(trimmed);
    setResult(payload.data);
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setOriginalText('');
    setError(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {!result ? (
          <ExplainForm onSubmit={handleSubmit} />
        ) : (
          <ExplainResult originalText={originalText} result={result} onReset={handleReset} />
        )}

        {error ? <ErrorBanner title="Explanation failed" message={error} variant="error" /> : null}
      </div>
    </main>
  );
}
