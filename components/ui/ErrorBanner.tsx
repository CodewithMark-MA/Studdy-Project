import React, { type ReactNode } from 'react';
import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  title?: string;
  message: ReactNode;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorBanner({ title, message, variant = 'error' }: ErrorBannerProps) {
  const classes = [styles.banner, styles[variant]].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" aria-live="polite">
      {title ? <div className={styles.title}>{title}</div> : null}
      <div className={styles.message}>{message}</div>
    </div>
  );
}
