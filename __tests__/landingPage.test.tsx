import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '../app/page';

describe('Landing page accessibility', () => {
  it('uses semantic links for primary calls to action without nested button elements', () => {
    render(<HomePage />);

    const generateLinks = screen.getAllByRole('link', { name: /generate a quiz/i });
    const explainLinks = screen.getAllByRole('link', { name: /explain text/i });

    expect(generateLinks.length).toBeGreaterThan(0);
    expect(explainLinks.length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /generate a quiz/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /explain text/i })).toBeNull();
  });
});
