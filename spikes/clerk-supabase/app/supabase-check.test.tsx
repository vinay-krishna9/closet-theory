import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SupabaseCheck } from './supabase-check';

const account = vi.hoisted(() => ({
  isLoaded: true,
  userId: 'user_a' as string | null,
}));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => account }));
afterEach(() => {
  vi.unstubAllGlobals();
  account.userId = 'user_a';
});

it('reports an unapplied migration without claiming success, and clears on account switch', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => ({ code: 'schema_required' }) })),
  );
  const { rerender } = render(<SupabaseCheck />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Check Supabase connection' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'It has not been applied yet.',
    ),
  );
  account.userId = 'user_b';
  rerender(<SupabaseCheck />);
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('allows retry after a network failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        json: async () => ({ code: 'read_succeeded' }),
      }),
  );
  render(<SupabaseCheck />);
  const button = screen.getByRole('button', {
    name: 'Check Supabase connection',
  });
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Try again.'),
  );
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cross-account isolation still needs testing.',
    ),
  );
});
