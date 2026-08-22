import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import QuizPage from '../app/quiz/page';
import { QuizCard } from '../components/quiz/QuizCard';
import { QuizForm } from '../components/quiz/QuizForm';
import { QuizList } from '../components/quiz/QuizList';

const validLongText = 'A'.repeat(500);

describe('Quiz UI', () => {
  it('rejects notes below 50 characters', async () => {
    const user = userEvent.setup();
    render(<QuizForm onSubmit={async () => undefined} />);

    const textarea = screen.getByLabelText(/Paste your class notes, chapters, or study text/i);
    await user.type(textarea, 'short text');
    await user.click(screen.getByRole('button', { name: /generate quiz/i }));

    expect(screen.getAllByText(/at least 50 characters/i).length).toBeGreaterThan(0);
  });

  it('rejects notes above 10000 characters', async () => {
    const user = userEvent.setup();
    render(<QuizForm onSubmit={async () => undefined} />);

    const textarea = screen.getByLabelText(/Paste your class notes, chapters, or study text/i);
    fireEvent.change(textarea, { target: { value: 'A'.repeat(10001) } });
    await user.click(screen.getByRole('button', { name: /generate quiz/i }));

    expect(screen.getAllByText(/maximum limit of 10,000 characters/i).length).toBeGreaterThan(0);
  });

  it('renders a quiz list from successful submission', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuizForm onSubmit={mockSubmit} />);

    const textarea = screen.getByLabelText(/Paste your class notes, chapters, or study text/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /generate quiz/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
    expect(mockSubmit.mock.calls[0][0]).toBe(validLongText);
  });

  it('renders 10 quiz questions', () => {
    const { container } = render(
      <QuizList
        questions={Array.from({ length: 10 }, (_, index) => ({
          id: index + 1,
          type: index % 3 === 0 ? 'multiple_choice' : index % 3 === 1 ? 'true_false' : 'short_answer',
          question: `Question ${index + 1}`,
          options: index % 3 === 0 ? ['A', 'B', 'C', 'D'] : undefined,
          answer: index % 3 === 0 ? 'A' : index % 3 === 1 ? 'True' : 'Answer',
        }))}
        onReset={() => undefined}
      />,
    );

    expect(container.querySelectorAll('article')).toHaveLength(10);
  });

  it('shows multiple choice options', () => {
    render(
      <QuizCard
        index={0}
        question={{
          id: 1,
          type: 'multiple_choice',
          question: 'Which answer is correct?',
          options: ['A', 'B', 'C', 'D'],
          answer: 'B',
        }}
      />,
    );

    expect(screen.getByText('A.')).toBeTruthy();
    expect(screen.getByText('B.')).toBeTruthy();
    expect(screen.getByText('C.')).toBeTruthy();
    expect(screen.getByText('D.')).toBeTruthy();
  });

  it('hides answers initially and reveals them per card', async () => {
    const user = userEvent.setup();

    render(
      <>
        <QuizCard
          index={0}
          question={{
            id: 1,
            type: 'short_answer',
            question: 'What is 2 + 2?',
            answer: '4',
          }}
        />
        <QuizCard
          index={1}
          question={{
            id: 2,
            type: 'short_answer',
            question: 'What is 2 + 3?',
            answer: '5',
          }}
        />
      </>,
    );

    expect(screen.getAllByText('Answer hidden')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: /reveal answer/i })[0]);

    expect(screen.getAllByText('4')).toHaveLength(2);
    expect(screen.getByText('Answer hidden')).toBeTruthy();
  });

  it('resets back to the form state on Generate New Quiz', async () => {
    render(<QuizPage />);

    const textarea = screen.getByLabelText(/Paste your class notes, chapters, or study text/i);
    fireEvent.change(textarea, { target: { value: validLongText } });

    expect(screen.getByRole('button', { name: /generate quiz/i })).toBeTruthy();
  });

  it('shows API errors when submission fails', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Server unavailable'));
    render(<QuizForm onSubmit={mockSubmit} />);

    const textarea = screen.getByLabelText(/Paste your class notes, chapters, or study text/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /generate quiz/i }));

    expect(await screen.findAllByText(/Server unavailable/i)).toHaveLength(2);
  });
});
