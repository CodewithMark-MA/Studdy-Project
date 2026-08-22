import React from 'react';

import type { WatchOutItem } from '../../lib/types';
import { Button } from '../ui/Button';
import { SafetyDisclaimer } from '../ui/SafetyDisclaimer';
import styles from './ExplainResult.module.css';

export interface ExplainResultProps {
  originalText: string;
  result: {
    summary: string;
    detailedExplanation: string;
    watchOutFor: WatchOutItem[];
  };
  onReset: () => void;
}

export function ExplainResult({ originalText, result, onReset }: ExplainResultProps) {
  return (
    <section className={styles.wrapper} aria-live="polite">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Plain-language explanation</p>
          <h2 className={styles.title}>Explanation ready</h2>
        </div>

        <Button variant="secondary" onClick={onReset}>
          Start a New Explanation
        </Button>
      </header>

      <div className={styles.layout} data-layout="responsive">
        <div className={styles.column}>
          <div className={styles.columnHeader}>Original Text</div>
          <div className={styles.textBlock}>{originalText}</div>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>Plain-Language Explanation</div>
          <div className={styles.explanationBlock}>
            <div className={styles.subsection}>
              <h3 className={styles.subheading}>Summary</h3>
              <p className={styles.summary}>{result.summary}</p>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subheading}>Detailed explanation</h3>
              <p className={styles.detail}>{result.detailedExplanation}</p>
            </div>
          </div>
        </div>
      </div>

      {result.watchOutFor.length > 0 ? (
        <section className={styles.warningSection} aria-labelledby="watch-out-for-title">
          <h3 id="watch-out-for-title" className={styles.warningTitle}>
            Watch Out For
          </h3>

          <div className={styles.warningGrid}>
            {result.watchOutFor.map((warning) => (
              <article key={warning.id} className={styles.warningCard}>
                <div className={styles.warningBadge}>{warning.category}</div>
                <h4 className={styles.warningHeading}>{warning.title}</h4>
                <p className={styles.warningDescription}>{warning.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <SafetyDisclaimer />
    </section>
  );
}
