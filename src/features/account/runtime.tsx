'use client';

import { ClerkProvider, useClerk, useUser } from '@clerk/nextjs';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearProfileDraft, readProfileDraft } from './profile-draft';

type Account = {
  enabled: boolean;
  loaded: boolean;
  userId: string | null;
  verified: boolean;
  email: string;
  logout: () => Promise<void>;
};
const Context = createContext<Account>({
  enabled: false,
  loaded: true,
  userId: null,
  verified: false,
  email: '',
  logout: async () => {},
});
export const useAccount = () => useContext(Context);

function Runtime({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  useEffect(() => {
    if (user?.id) readProfileDraft(user.id);
  }, [user?.id]);
  return (
    <Context.Provider
      value={{
        enabled: true,
        loaded: Boolean(isLoaded),
        userId: user?.id ?? null,
        verified: user?.primaryEmailAddress?.verification.status === 'verified',
        email: user?.primaryEmailAddress?.emailAddress ?? '',
        logout: async () => {
          await clerk.signOut();
          clearProfileDraft();
          try {
            localStorage.setItem(
              'closet-theory.account-signout-event',
              crypto.randomUUID(),
            );
          } catch {
            /* Current-tab state is still cleared when storage is unavailable. */
          }
          router.replace('/wardrobe');
          router.refresh();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function AccountProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return children;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/profile"
      signUpFallbackRedirectUrl="/profile"
      signInForceRedirectUrl="/profile"
      signUpForceRedirectUrl="/profile"
      appearance={{
        elements: {
          formButtonPrimary: { minHeight: '44px' },
          socialButtonsBlockButton: { minHeight: '44px' },
          formFieldInput: { minHeight: '44px' },
          footerActionLink: {
            display: 'inline-flex',
            minHeight: '44px',
            alignItems: 'center',
          },
        },
        variables: {
          colorBackground: '#191c20',
          colorForeground: '#e4e7eb',
          colorPrimary: '#d8dde5',
          colorPrimaryForeground: '#111419',
          colorInput: '#22262b',
          colorInputForeground: '#e4e7eb',
          colorMutedForeground: '#a4aab3',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-ui)',
        },
      }}
    >
      <Runtime>{children}</Runtime>
    </ClerkProvider>
  );
}
