import React, { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Spinner } from '../ui/Spinner';
import { TextArea } from '../ui/TextArea';
import styles from './QuizForm.module.css';
import { QUIZ_MAX_INPUT_LENGTH, QUIZ_MIN_INPUT_LENGTH } from '../../lib/quiz/constants';

export interface QuizFormProps {
  onSubmit: (notes: string) => Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = '.txt,.pdf,.docx';

export function QuizForm({ onSubmit }: QuizFormProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateNotes = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Please paste some text to continue.';
    }

    if (trimmed.length < QUIZ_MIN_INPUT_LENGTH) {
      return 'Your text is too short. Please paste at least 50 characters.';
    }

    if (trimmed.length > QUIZ_MAX_INPUT_LENGTH) {
      return `Text exceeds the maximum limit of ${QUIZ_MAX_INPUT_LENGTH.toLocaleString()} characters.`;
    }

    return null;
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setNotes(nextValue);
    setSelectedFile(null);
    if (error) {
      setError(null);
    }
  };

  const processFile = async (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    if (file.size === 0) {
      setError('The selected file is empty.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Files must be 5 MB or smaller.');
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/extract', { method: 'POST', body: formData });
      const payload = (await response.json()) as { success: boolean; text?: string; error?: { message?: string } };
      if (!response.ok || !payload.success || typeof payload.text !== 'string') {
        throw new Error(payload.error?.message || 'We could not extract text from that file.');
      }
      setNotes(payload.text);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : 'We could not extract text from that file.');
      setNotes('');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await processFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isExtracting && !isSubmitting) setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) setIsDragActive(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (!isExtracting && !isSubmitting) await processFile(event.dataTransfer.files[0]);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setNotes('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        minLength={QUIZ_MIN_INPUT_LENGTH}
        maxLength={QUIZ_MAX_INPUT_LENGTH}
        error={error || (notes.trim() && validationError ? validationError : undefined)}
        charCount={notes.length}
      />

      <div
        className={`${styles.uploadSection} ${isDragActive ? styles.dragActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className={styles.uploadLabel} htmlFor="quiz-file">Upload your study material</label>
        <p className={styles.uploadHelper}>PDF, DOCX, or TXT · Max file size: 5 MB</p>
        <p className={styles.dropHint}>Drop a file here or choose one below.</p>
        <input
          ref={fileInputRef}
          id="quiz-file"
          className={styles.fileInput}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          disabled={isExtracting || isSubmitting}
          aria-describedby="quiz-file-help"
        />
        <span id="quiz-file-help" className={styles.srOnly}>Uploading a file replaces pasted text.</span>
        {selectedFile ? (
          <div className={styles.fileDetails} aria-live="polite">
            <span><strong>{selectedFile.name}</strong> · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={isExtracting || isSubmitting}>Remove file</Button>
          </div>
        ) : null}
        {isExtracting ? <div className={styles.extractionStatus} aria-live="polite"><Spinner size="sm" label="Extracting text" /> Extracting text...</div> : null}
      </div>

      <div className={styles.footer}>
        <p className={styles.helper}>Minimum {QUIZ_MIN_INPUT_LENGTH} characters. Maximum {QUIZ_MAX_INPUT_LENGTH.toLocaleString()} characters.</p>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Generate Quiz
        </Button>
      </div>

      {error ? <ErrorBanner title="Quiz generation failed" message={error} variant="error" /> : null}
    </form>
  );
}
