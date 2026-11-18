import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionCheck } from './session-check';

const state = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: false,
  signOut: vi.fn(),
}));
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => state,
  UserButton: () => <button>Profile</button>,
}));

describe('session probe', () => {
  beforeEach(() => {
    state.isSignedIn = false;
    state.isLoaded = true;
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows loading before authentication state is available', () => {
    state.isLoaded = false;
    render(<SessionCheck />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading account controls',
    );
    expect(
      screen.queryByRole('link', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  it('checks server authority and disables duplicate requests', async () => {
    state.isSignedIn = true;
    let resolve!: (response: { ok: boolean }) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal('fetch', fetcher);
    render(<SessionCheck />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Check server session' }),
    );
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
    expect(fetcher).toHaveBeenCalledWith('/api/session', { cache: 'no-store' });
    resolve({ ok: true });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Server session verified.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(state.signOut).toHaveBeenCalledWith({ redirectUrl: '/' });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('recovers from network failure and reports expired or missing sessions honestly', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetcher);
    render(<SessionCheck />);
    const check = screen.getByRole('button', { name: 'Check server session' });
    fireEvent.click(check);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Could not reach the server. Try again.',
      ),
    );
    expect(check).toBeEnabled();
    fireEvent.click(check);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Access denied. Sign in to verify your session.',
      ),
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });
});
