import React, { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Spinner } from '../ui/Spinner';
import { TextArea } from '../ui/TextArea';
import styles from './ExplainForm.module.css';

export interface ExplainFormProps {
  onSubmit: (text: string) => Promise<void>;
}

const MIN_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = '.txt,.pdf,.docx';

export function ExplainForm({ onSubmit }: ExplainFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateText = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Please paste some text to continue.';
    }

    if (trimmed.length < MIN_LENGTH) {
      return 'Your text is too short. Please paste at least 50 characters.';
    }

    return null;
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setText(nextValue);
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
      setText(payload.text);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : 'We could not extract text from that file.');
      setText('');
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
    setText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        error={error || (text.trim() && validationError ? validationError : undefined)}
        charCount={text.length}
      />

      <div
        className={`${styles.uploadSection} ${isDragActive ? styles.dragActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className={styles.uploadLabel} htmlFor="explain-file">Upload your study material</label>
        <p className={styles.uploadHelper}>PDF, DOCX, or TXT · Max file size: 5 MB</p>
        <p className={styles.dropHint}>Drop a file here or choose one below.</p>
        <input
          ref={fileInputRef}
          id="explain-file"
          className={styles.fileInput}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          disabled={isExtracting || isSubmitting}
          aria-describedby="explain-file-help"
        />
        <span id="explain-file-help" className={styles.srOnly}>Uploading a file replaces pasted text.</span>
        {selectedFile ? (
          <div className={styles.fileDetails} aria-live="polite">
            <span><strong>{selectedFile.name}</strong> · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={isExtracting || isSubmitting}>Remove file</Button>
          </div>
        ) : null}
        {isExtracting ? <div className={styles.extractionStatus} aria-live="polite"><Spinner size="sm" label="Extracting text" /> Extracting text...</div> : null}
      </div>

      <div className={styles.footer}>
        <p className={styles.helper}>Minimum {MIN_LENGTH} characters.</p>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Explain Text
        </Button>
      </div>

      {error ? <ErrorBanner title="Explanation failed" message={error} variant="error" /> : null}
    </form>
  );
}
