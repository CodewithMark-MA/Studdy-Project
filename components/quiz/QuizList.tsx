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
  const [sectionIndex, setSectionIndex] = useState(0);
  const sectionSize = 10;
  const sectionCount = Math.ceil(questions.length / sectionSize);
  const sectionStart = sectionIndex * sectionSize;
  const visibleQuestions = questions.slice(sectionStart, sectionStart + sectionSize);

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
    setSectionIndex(0);
    onReset();
  };

  return (
    <section className={styles.wrapper} aria-live="polite">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Your practice quiz</p>
          <h2 className={styles.title}>50-question study set</h2>
        </div>

        <Button variant="secondary" onClick={handleReset}>
          Generate New Quiz
        </Button>
      </div>

      {!gradingResult && sectionCount > 1 ? (
        <div className={styles.navigation} aria-label="Quiz section navigation">
          <span className={styles.progress} aria-live="polite">
            Questions {sectionStart + 1}-{Math.min(sectionStart + sectionSize, questions.length)} of {questions.length}
          </span>
          <div className={styles.navigationButtons}>
            <Button variant="secondary" onClick={() => setSectionIndex((current) => current - 1)} disabled={sectionIndex === 0}>
              Previous
            </Button>
            <Button onClick={() => setSectionIndex((current) => current + 1)} disabled={sectionIndex === sectionCount - 1}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <div className={styles.list}>
        {visibleQuestions.map((question, index) => {
          const questionIndex = sectionStart + index;
          const result = gradingResult?.results[questionIndex];

          return (
            <QuizCard
              key={`${question.type}-${question.id}`}
              question={question}
              index={questionIndex}
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
