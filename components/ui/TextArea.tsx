import React, { type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: number;
  minLength?: number;
  maxLength?: number;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

export function TextArea({
  label,
  error,
  helperText,
  charCount,
  minLength,
  maxLength,
  className,
  value,
  onChange,
  ...props
}: TextAreaProps) {
  const currentLength = typeof value === 'string' ? value.length : 0;
  const classes = [styles.field, error ? styles.error : '', className || '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label} htmlFor={props.id ?? props.name}>
          {label}
        </label>
      ) : null}

      <textarea
        {...props}
        className={classes}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
      />

      <div className={styles.meta}>
        {error ? <span className={styles.errorText}>{error}</span> : null}
        {!error && helperText ? <span className={styles.helperText}>{helperText}</span> : null}
        {typeof charCount === 'number' ? (
          <span className={styles.counter}>{charCount}</span>
        ) : (
          typeof maxLength === 'number' && (
            <span className={styles.counter}>
              {currentLength}/{maxLength}
            </span>
          )
        )}
      </div>
    </div>
  );
}
