import React, { useState } from 'react';
import { gradeQuiz, type QuizAnswers, type QuizGradingResult } from '../../lib/quiz/grading';
import type { QuizQuestion } from '../../lib/types';
import { Button } from '../ui/Button';
import { QuizCard } from './QuizCard';
import { QuizResults } from './QuizResults';
import styles from './QuizList.module.css';

export interface QuizListProps {
  questions: QuizQuestion[];
  onReset: () => void;
}

export function QuizList({ questions, onReset }: QuizListProps) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [gradingResult, setGradingResult] = useState<QuizGradingResult | null>(null);

  const handleAnswerChange = (questionId: number, answer: string) => {
    if (gradingResult) {
      return;
    }

    setAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  const handleSubmit = () => {
    setGradingResult(gradeQuiz(questions, answers));
  };

  const handleReset = () => {
    setAnswers({});
    setGradingResult(null);
    onReset();
  };

  return (
    <section className={styles.wrapper} aria-live="polite">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Your practice quiz</p>
          <h2 className={styles.title}>10-question study set</h2>
        </div>

        <Button variant="secondary" onClick={handleReset}>
          Generate New Quiz
        </Button>
      </div>

      <div className={styles.list}>
        {questions.map((question, index) => {
          const result = gradingResult?.results[index];

          return (
            <QuizCard
              key={`${question.type}-${question.id}`}
              question={question}
              index={index}
              answer={answers[question.id]}
              submitted={Boolean(gradingResult)}
              result={result}
              onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
            />
          );
        })}
      </div>

      {!gradingResult ? (
        <Button onClick={handleSubmit}>Submit Quiz</Button>
      ) : (
        <QuizResults result={gradingResult} />
      )}
    </section>
  );
}
