import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('foundation entry page', () => {
  it('explains unavailable features without presenting functioning account or upload controls', () => {
    render(<Home />);
    const status = screen.getByRole('region', { name: 'In development' });
    expect(
      within(status).getByText(
        /does not collect photos, create accounts or save wardrobe data/,
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/upload|photo|password/i),
    ).not.toBeInTheDocument();
  });
});
