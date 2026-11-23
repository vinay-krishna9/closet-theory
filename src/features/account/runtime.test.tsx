import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AccountProvider, useAccount } from './runtime';
import { saveProfileDraft } from './profile-draft';

const provider = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ isLoaded: true, user: { id: 'user_a' } }),
  useClerk: () => provider,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.clearAllMocks();
});

function SignOut() {
  const account = useAccount();
  return <button onClick={() => void account.logout()}>Sign out</button>;
}

it('clears the private draft and notifies other tabs even when provider sign-out navigates without resolving', () => {
  saveProfileDraft('user_a', 'America/New_York');
  provider.signOut.mockImplementation(() => new Promise(() => {}));
  render(
    <AccountProvider enabled>
      <SignOut />
    </AccountProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(provider.signOut).toHaveBeenCalledOnce();
  expect(
    sessionStorage.getItem('closet-theory.account-profile-draft'),
  ).toBeNull();
  expect(
    localStorage.getItem('closet-theory.account-signout-event'),
  ).toBeTruthy();
});
