import React, { useState } from 'react';
import type { QuizQuestion } from '../../lib/types';
import styles from './QuizCard.module.css';

export interface QuizCardProps {
  question: QuizQuestion;
  index: number;
}

const typeLabels: Record<QuizQuestion['type'], string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
};

export function QuizCard({ question, index }: QuizCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.number}>Question {index + 1}</span>
          <span className={styles.badge}>{typeLabels[question.type]}</span>
        </div>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsRevealed((current) => !current)}
          aria-expanded={isRevealed}
        >
          {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
        </button>
      </div>

      <h3 className={styles.question}>{question.question}</h3>

      {question.type === 'multiple_choice' ? (
        <div className={styles.options}>
          {question.options.map((option, optionIndex) => {
            const isCorrect = option === question.answer;
            const isShown = isRevealed && isCorrect;

            return (
              <div
                key={`${question.id}-option-${optionIndex}`}
                className={`${styles.option} ${isShown ? styles.correctOption : ''}`}
              >
                <span className={styles.optionLabel}>{String.fromCharCode(65 + optionIndex)}.</span>
                <span>{option}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {question.type === 'true_false' ? (
        <div className={styles.options}>
          {(['True', 'False'] as const).map((option) => {
            const isCorrect = option === question.answer;
            const isShown = isRevealed && isCorrect;

            return (
              <div
                key={`${question.id}-${option}`}
                className={`${styles.option} ${isShown ? styles.correctOption : ''}`}
              >
                <span className={styles.optionLabel}>{option === 'True' ? 'T' : 'F'}.</span>
                <span>{option}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {question.type === 'short_answer' ? (
        <div className={`${styles.shortAnswer} ${isRevealed ? styles.visibleAnswer : ''}`}>
          {isRevealed ? question.answer : 'Answer hidden'}
        </div>
      ) : null}

      {isRevealed ? (
        <div className={styles.answerBlock}>
          <span className={styles.answerLabel}>Answer</span>
          <p>{question.answer}</p>
        </div>
      ) : null}
    </article>
  );
}
