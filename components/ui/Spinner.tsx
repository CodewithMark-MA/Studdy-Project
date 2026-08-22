import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  className,
  label = 'Loading',
}: SpinnerProps) {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(' ');

  return <span className={classes} role="status" aria-label={label} />;
}
