import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthScreen } from './auth-screen';

const state = vi.hoisted(() => ({
  account: {
    enabled: true,
    loaded: true,
    userId: 'user_active' as string | null,
  },
  prepared: false,
  router: { replace: vi.fn() },
}));
vi.mock('./runtime', () => ({ useAccount: () => state.account }));
vi.mock('next/navigation', () => ({ useRouter: () => state.router }));
vi.mock('@/features/wardrobe/visitor-provider', () => ({
  useVisitorWardrobe: () => ({ items: [{ id: 'pending-selection' }] }),
}));
vi.mock('./visitor-import', () => ({
  useVisitorImportReady: () => state.prepared,
  VisitorImportNotice: () => null,
  VisitorImportRecovery: () => null,
}));
vi.mock('@clerk/nextjs', () => ({
  SignIn: () => <p>Authentication form</p>,
  SignUp: () => <p>Account creation form</p>,
}));
afterEach(() => {
  state.account.userId = 'user_active';
  state.prepared = false;
  vi.clearAllMocks();
});
it('redirects an already active session without waiting on clothing transfer or mounting another auth form', async () => {
  render(<AuthScreen />);
  await waitFor(() =>
    expect(state.router.replace).toHaveBeenCalledWith('/profile'),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Opening your profile');
  expect(screen.queryByText('Authentication form')).not.toBeInTheDocument();
});
it('keeps signed-out authentication behind durable selection preparation', () => {
  state.account.userId = null;
  const { rerender } = render(<AuthScreen />);
  expect(screen.queryByText('Authentication form')).not.toBeInTheDocument();
  state.prepared = true;
  rerender(<AuthScreen />);
  expect(screen.getByText('Authentication form')).toBeVisible();
  expect(state.router.replace).not.toHaveBeenCalled();
});
