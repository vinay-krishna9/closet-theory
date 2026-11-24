'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAccount } from './runtime';
import { useVisitorWardrobe } from '@/features/wardrobe/visitor-provider';
import { Button } from '@/components/ui/button';
import { VisitorImportNotice, VisitorImportRecovery } from './visitor-import';

export function AccountControls() {
  const account = useAccount();
  const { clearWardrobe } = useVisitorWardrobe();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!account.userId) return null;
  return (
    <div className="account-controls">
      <Link href="/profile">Your account</Link>
      <Button
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await clearWardrobe();
            await account.logout();
          } catch {
            setError('Could not sign out. Try again.');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const account = useAccount();
  const pathname = usePathname();
  if (!account.loaded)
    return (
      <main id="main-content" className="account-page">
        <p role="status">Loading your account…</p>
      </main>
    );
  if (
    !account.userId ||
    !account.verified ||
    ['/profile', '/wardrobe', '/quick-add', '/outfits'].includes(pathname)
  )
    return <>{children}</>;
  return (
    <main id="main-content" className="account-page" tabIndex={-1}>
      <h1>Your account is ready</h1>
      <p>
        You are signed in. Visitor clothing transfers automatically after
        verification; its status appears below. Your saved wardrobe is
        available; account outfit suggestions are the next step.
      </p>
      <VisitorImportNotice />
      <VisitorImportRecovery />
      <Link href="/profile">Open your profile</Link>
    </main>
  );
}
