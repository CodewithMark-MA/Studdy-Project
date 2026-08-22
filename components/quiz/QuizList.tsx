import React from 'react';
import type { QuizQuestion } from '../../lib/types';
import { Button } from '../ui/Button';
import { QuizCard } from './QuizCard';
import styles from './QuizList.module.css';

export interface QuizListProps {
  questions: QuizQuestion[];
  onReset: () => void;
}

export function QuizList({ questions, onReset }: QuizListProps) {
  return (
    <section className={styles.wrapper} aria-live="polite">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Your practice quiz</p>
          <h2 className={styles.title}>10-question study set</h2>
        </div>

        <Button variant="secondary" onClick={onReset}>
          Generate New Quiz
        </Button>
      </div>

      <div className={styles.list}>
        {questions.map((question, index) => (
          <QuizCard key={`${question.type}-${question.id}`} question={question} index={index} />
        ))}
      </div>
    </section>
  );
}
