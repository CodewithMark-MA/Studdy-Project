import React from 'react';
import type { QuizQuestion } from '../../lib/types';
import styles from './QuizCard.module.css';

export interface QuizCardProps {
  question: QuizQuestion;
  index: number;
  answer?: string;
  submitted?: boolean;
  result?: {
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  };
  onAnswerChange?: (answer: string) => void;
}

const typeLabels: Record<QuizQuestion['type'], string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
};

export function QuizCard({ question, index, answer = '', submitted = false, result, onAnswerChange }: QuizCardProps) {
  const inputName = `quiz-question-${question.id}`;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.number}>Question {index + 1}</span>
          <span className={styles.badge}>{typeLabels[question.type]}</span>
        </div>

        {submitted && result ? (
          <span className={result.isCorrect ? styles.correctStatus : styles.incorrectStatus}>
            {result.isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        ) : null}
      </div>

      <h3 className={styles.question}>{question.question}</h3>

      {question.type === 'multiple_choice' ? (
        <div className={styles.options}>
          {question.options.map((option, optionIndex) => {
            const isSelected = answer === option;

            return (
              <label
                key={`${question.id}-option-${optionIndex}`}
                className={`${styles.option} ${isSelected ? styles.selectedOption : ''} ${submitted && option === question.answer ? styles.correctOption : ''}`}
              >
                <input
                  type="radio"
                  name={inputName}
                  value={option}
                  aria-label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                  checked={isSelected}
                  onChange={() => onAnswerChange?.(option)}
                  disabled={submitted}
                />
                <span className={styles.optionLabel}>{String.fromCharCode(65 + optionIndex)}.</span>
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === 'true_false' ? (
        <div className={styles.options}>
          {(['True', 'False'] as const).map((option) => {
            const isSelected = answer === option;

            return (
              <label
                key={`${question.id}-${option}`}
                className={`${styles.option} ${isSelected ? styles.selectedOption : ''} ${submitted && option === question.answer ? styles.correctOption : ''}`}
              >
                <input
                  type="radio"
                  name={inputName}
                  value={option}
                  aria-label={`${option === 'True' ? 'T' : 'F'}. ${option}`}
                  checked={isSelected}
                  onChange={() => onAnswerChange?.(option)}
                  disabled={submitted}
                />
                <span className={styles.optionLabel}>{option === 'True' ? 'T' : 'F'}.</span>
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === 'short_answer' ? (
        <div className={styles.shortAnswer}>
          <label className={styles.inputLabel} htmlFor={`short-answer-${question.id}`}>Your answer</label>
          <textarea
            id={`short-answer-${question.id}`}
            value={answer}
            onChange={(event) => onAnswerChange?.(event.target.value)}
            disabled={submitted}
            rows={2}
            placeholder="Type your answer"
          />
        </div>
      ) : null}

      {submitted && result ? (
        <div className={styles.answerBlock}>
          <div>
            <span className={styles.answerLabel}>Your answer</span>
            <p>{result.userAnswer.trim() || 'Unanswered'}</p>
          </div>
          <div>
            <span className={styles.answerLabel}>Correct answer</span>
            <p>{result.correctAnswer}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
