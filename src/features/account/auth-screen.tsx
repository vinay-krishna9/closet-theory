'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useAccount } from './runtime';

export function AuthScreen({ signup = false }: { signup?: boolean }) {
  const account = useAccount();
  return (
    <main id="main-content" className="account-page" tabIndex={-1}>
      <Link href="/wardrobe">Back to your wardrobe</Link>
      <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p>
        Your selected clothes stay in this browser if you cancel. Automatic
        account transfer is coming next; this step does not save clothing to
        your account.
      </p>
      {account.enabled ? (
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
