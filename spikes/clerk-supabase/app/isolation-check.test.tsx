import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { IsolationCheck } from './isolation-check';

const account = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_a',
}));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => account }));
afterEach(() => {
  vi.unstubAllGlobals();
  account.userId = 'user_a';
  account.isSignedIn = true;
});

it('clears the previous account records and input on switching accounts', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [{ id: 'fixture-a', label: 'SPIKE-02 A' }] }),
    })),
  );
  const { rerender } = render(<IsolationCheck />);
  fireEvent.click(screen.getByRole('button', { name: 'Load my test records' }));
  await screen.findByText('fixture-a');
  fireEvent.change(screen.getByLabelText('Record ID to check'), {
    target: { value: 'fixture-a' },
  });
  account.userId = 'user_b';
  rerender(<IsolationCheck />);
  expect(screen.queryByText('fixture-a')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Record ID to check')).toHaveValue('');
  account.isSignedIn = false;
  rerender(<IsolationCheck />);
  expect(
    screen.queryByRole('region', { name: 'Database isolation check' }),
  ).not.toBeInTheDocument();
});

it('reports inaccessible rows and allows retry after a network failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ code: 'not_found' }),
      }),
  );
  render(<IsolationCheck />);
  fireEvent.change(screen.getByLabelText('Record ID to check'), {
    target: { value: 'fixture-b' },
  });
  const button = screen.getByRole('button', { name: 'Check record access' });
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not reach the server. Try again.',
    ),
  );
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'No accessible test record found.',
    ),
  );
});
