'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from './runtime';
import {
  VisitorImportNotice,
  VisitorImportRecovery,
  useVisitorImportReady,
} from './visitor-import';
import { useVisitorWardrobe } from '@/features/wardrobe/visitor-provider';

export function AuthScreen({ signup = false }: { signup?: boolean }) {
  const account = useAccount();
  const wardrobe = useVisitorWardrobe();
  const prepared = useVisitorImportReady();
  const router = useRouter();
  useEffect(() => {
    if (account.loaded && account.userId) router.replace('/profile');
  }, [account.loaded, account.userId, router]);
  if (account.loaded && account.userId)
    return (
      <main id="main-content" className="account-page">
        <p role="status">Opening your profile…</p>
      </main>
    );
  return (
    <main id="main-content" className="account-page" tabIndex={-1}>
      <Link href="/wardrobe">Back to your wardrobe</Link>
      <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p>
        Your selected clothes stay in this browser if you cancel. After sign-in
        and any required email verification, they save to your account
        automatically. Keep your browser data until the transfer is confirmed.
      </p>
      <VisitorImportNotice />
      <VisitorImportRecovery />
      {account.enabled && wardrobe.items.length > 0 && !prepared ? (
        <p>
          Preparing your selected clothes before sign-in. Resolve any
          browser-saving message above to continue without losing selections.
        </p>
      ) : account.enabled ? (
        <div className="account-auth-form">
          {signup ? <SignUp /> : <SignIn />}
        </div>
      ) : (
        <p>
          Account access is not configured in this environment. You can continue
          browsing your visitor wardrobe.
        </p>
      )}
    </main>
  );
}
