import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import ExplainPage from '../app/explain/page';
import { ExplainForm } from '../components/explain/ExplainForm';
import { ExplainResult } from '../components/explain/ExplainResult';

const validLongText = 'A'.repeat(500);
const validResponse = {
  success: true,
  data: {
    summary: 'This contract auto-renews unless you act before the deadline.',
    detailedExplanation: 'The document says the contract renews automatically after the deadline. That means you should watch the cancellation date closely and respond before the renewal date arrives.',
    watchOutFor: [
      {
        id: 1,
        category: 'auto_renewal',
        title: 'Automatic renewal',
        description: 'The contract renews automatically unless you cancel in time.',
      },
      {
        id: 2,
        category: 'deadline',
        title: 'Deadline risk',
        description: 'A missed deadline could cause a full renewal without extra review.',
      },
    ],
  },
};

describe('Explain UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects text below 50 characters', async () => {
    const user = userEvent.setup();
    render(<ExplainForm onSubmit={async () => undefined} />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    await user.type(textarea, 'too short');
    await user.click(screen.getByRole('button', { name: /explain text/i }));

    expect(screen.getAllByText(/at least 50 characters/i).length).toBeGreaterThan(0);
  });

  it('accepts text above the former 5000-character limit', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ExplainForm onSubmit={mockSubmit} />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: 'A'.repeat(5001) } });
    await user.click(screen.getByRole('button', { name: /explain text/i }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith('A'.repeat(5001)));
  });

  it('uses extracted upload text as the active explanation input', async () => {
    const extractedText = 'Extracted study material with enough characters to explain clearly.';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, text: extractedText }),
    }));
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ExplainForm onSubmit={mockSubmit} />);
    await user.upload(screen.getByLabelText(/upload your study material/i), new File(['document'], 'notes.txt', { type: 'text/plain' }));

    expect(await screen.findByDisplayValue(extractedText)).toBeTruthy();
    expect(screen.getByText('notes.txt')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /explain text/i }));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(extractedText));
  });

  it('calls /api/explain with valid text on submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ExplainPage />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /explain text/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/explain',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: validLongText }),
      }),
    );
  });

  it('shows a loading state during submission', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const deferred = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred));

    render(<ExplainPage />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /explain text/i }));

    expect(screen.getByText(/Generating your explanation/i)).toBeTruthy();

    resolveFetch?.({
      ok: true,
      json: async () => validResponse,
    } as Response);

    await waitFor(() => {
      expect(screen.getByText(/This contract auto-renews/i)).toBeTruthy();
    });
  });

  it('renders the original text and explanation result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    }));

    render(<ExplainPage />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /explain text/i }));

    expect(await screen.findByText(validLongText)).toBeTruthy();
    expect((await screen.findAllByText(/This contract auto-renews/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/The document says the contract renews automatically/i)).length).toBeGreaterThan(0);
  });

  it('renders multiple watchOutFor items and hides empty warning section', async () => {
    const { rerender } = render(
      <ExplainResult
        originalText={validLongText}
        result={validResponse.data}
        onReset={() => undefined}
      />,
    );

    expect(screen.getAllByText(/Automatic renewal|Deadline risk/i).length).toBeGreaterThan(1);

    rerender(
      <ExplainResult
        originalText={validLongText}
        result={{ ...validResponse.data, watchOutFor: [] }}
        onReset={() => undefined}
      />,
    );

    expect(screen.queryByText(/Watch Out For/i)).toBeNull();
  });

  it('renders the SafetyDisclaimer', () => {
    render(
      <ExplainResult
        originalText={validLongText}
        result={validResponse.data}
        onReset={() => undefined}
      />,
    );

    expect(
      screen.getByText(/Studdy highlights potentially important information for easier reading/i),
    ).toBeTruthy();
  });

  it('displays API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: { message: 'The server rejected the request.' } }),
    }));

    render(<ExplainPage />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /explain text/i }));

    expect((await screen.findAllByText(/The server rejected the request/i)).length).toBeGreaterThan(0);
  });

  it('applies a responsive layout state', () => {
    const { container } = render(
      <ExplainResult
        originalText={validLongText}
        result={validResponse.data}
        onReset={() => undefined}
      />,
    );

    expect(container.querySelector('[data-layout="responsive"]')).toBeTruthy();
    expect(screen.getAllByText(/Original Text|Plain-Language Explanation/i).length).toBeGreaterThan(1);
  });

  it('resets back to a clean form state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    }));

    render(<ExplainPage />);

    const textarea = screen.getByLabelText(/Paste the text you want explained/i);
    fireEvent.change(textarea, { target: { value: validLongText } });
    fireEvent.click(screen.getByRole('button', { name: /explain text/i }));

    expect(await screen.findByText(validLongText)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /start a new explanation/i }));

    const resetTextarea = screen.getByLabelText(/Paste the text you want explained/i);
    expect(resetTextarea).toBeTruthy();
    expect((resetTextarea as HTMLTextAreaElement).value).toBe('');
  });
});
