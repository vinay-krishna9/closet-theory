'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';

export function SessionCheck() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkSession() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      setMessage(
        response.ok
          ? 'Server session verified.'
          : response.status === 401
            ? 'Access denied. Sign in to verify your session.'
            : 'Session check failed. Try again.',
      );
    } catch {
      setMessage('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded) return <p role="status">Loading account controls…</p>;

  return (
    <section aria-label="Account check">
      <p>{isSignedIn ? 'Signed in.' : 'Signed out.'}</p>
      <div className="actions">
        {isSignedIn ? (
          <>
            <UserButton />
            <button
              onClick={() => {
                setMessage('');
                void signOut({ redirectUrl: '/' });
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/sign-up">Create account</Link>
          </>
        )}
        <button disabled={busy} onClick={checkSession}>
          {busy ? 'Checking…' : 'Check server session'}
        </button>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
