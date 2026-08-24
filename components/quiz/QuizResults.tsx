import React from 'react';
import type { QuizGradingResult } from '../../lib/quiz/grading';
import styles from './QuizResults.module.css';

export interface QuizResultsProps {
  result: QuizGradingResult;
}

export function QuizResults({ result }: QuizResultsProps) {
  const incorrect = result.total - result.score;

  return (
    <section className={styles.results} aria-labelledby="quiz-results-title" aria-live="polite">
      <div className={styles.summary}>
        <div>
          <p className={styles.eyebrow}>Quiz complete</p>
          <h2 id="quiz-results-title" className={styles.title}>{result.score} / {result.total}</h2>
          <p className={styles.percentage}>{result.percentage}%</p>
        </div>
        <div className={styles.counts} aria-label={`${result.score} correct and ${incorrect} incorrect`}>
          <span className={styles.correctCount}>Correct <strong>{result.score}</strong></span>
          <span className={styles.incorrectCount}>Incorrect <strong>{incorrect}</strong></span>
        </div>
      </div>

      <div className={styles.review}>
        <h3 className={styles.reviewTitle}>Review your answers</h3>
        <div className={styles.reviewList}>
          {result.results.map((item) => (
            <article key={`${item.question.type}-${item.question.id}`} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <span className={styles.questionNumber}>Question {item.index + 1}</span>
                <span className={item.isCorrect ? styles.correctStatus : styles.incorrectStatus}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p className={styles.question}>{item.question.question}</p>
              <dl className={styles.answers}>
                <div>
                  <dt>Your answer</dt>
                  <dd>{item.userAnswer.trim() || 'Unanswered'}</dd>
                </div>
                <div>
                  <dt>Correct answer</dt>
                  <dd>{item.correctAnswer}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
