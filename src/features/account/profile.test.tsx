import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Profile } from './profile';

const account = vi.hoisted(() => ({
  loaded: true,
  userId: 'user_a',
  verified: true,
  email: 'fixture@example.com',
}));
vi.mock('./runtime', () => ({ useAccount: () => account }));
afterEach(() => vi.unstubAllGlobals());
it('retains unsaved timezone after session expiry and offers sign-in recovery', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: { timezone: 'UTC' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 'sign_in_required' }),
      }),
  );
  render(<Profile />);
  const input = screen.getByLabelText('Your timezone');
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: 'Europe/Berlin' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save timezone' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Your session ended'),
  );
  expect(input).toHaveValue('Europe/Berlin');
  expect(
    screen.getByRole('link', { name: 'Sign-in and password recovery' }),
  ).toHaveAttribute('href', '/sign-in');
});
