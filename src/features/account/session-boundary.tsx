'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useAccount } from './runtime';
import { clearProfileDraft } from './profile-draft';
import { useVisitorWardrobe } from '@/features/wardrobe/visitor-provider';

const signoutEventKey = 'closet-theory.account-signout-event';
export function SessionBoundary({ children }: { children: ReactNode }) {
  const account = useAccount();
  const previous = useRef<string | null>(null);
  const { clearWardrobe } = useVisitorWardrobe();
  useEffect(() => {
    if (
      previous.current &&
      account.userId &&
      previous.current !== account.userId
    ) {
      clearWardrobe();
      clearProfileDraft();
    }
    if (account.userId) previous.current = account.userId;
  }, [account.userId, clearWardrobe]);
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === signoutEventKey && event.newValue) {
        clearWardrobe();
        clearProfileDraft();
      }
    }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [clearWardrobe]);
  return children;
}
