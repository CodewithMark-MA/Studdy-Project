import React from 'react';
import styles from './SafetyDisclaimer.module.css';

export function SafetyDisclaimer() {
  return (
    <div className={styles.disclaimer} role="note" aria-live="polite">
      <p>
        Studdy highlights potentially important information for easier reading. It does not provide legal,
        financial, or professional advice.
      </p>
    </div>
  );
}
