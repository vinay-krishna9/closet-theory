'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAccount } from './runtime';
import {
  clearProfileDraft,
  readProfileDraft,
  saveProfileDraft,
} from './profile-draft';

const errors: Record<string, string> = {
  sign_in_required:
    'Your session ended. Sign in again; your unsaved timezone is still shown.',
  verify_email: 'Verify your email before saving account details.',
  verification_claim_required:
    'Account verification settings still need configuration. No profile was saved.',
  schema_required:
    'Account storage setup is awaiting its database migration. No profile was saved.',
  invalid_profile: 'Enter a valid timezone, such as Europe/Berlin.',
};

export function Profile() {
  const account = useAccount();
  if (!account.loaded)
    return (
      <main id="main-content" className="account-page">
        <p role="status">Loading your account…</p>
      </main>
    );
  if (!account.userId)
    return (
      <main id="main-content" className="account-page">
        <h1>Your profile</h1>
        <Link href="/sign-in">Sign in to your account</Link>
      </main>
    );
  return <ProfileForm key={account.userId} />;
}
function ProfileForm() {
  const account = useAccount();
  const [timezone, setTimezone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);
  const pendingSave = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const draft = readProfileDraft(account.userId!);
    async function load() {
      try {
        const response = await fetch('/api/account/profile', {
          cache: 'no-store',
          signal: controller.signal,
        });
        let result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && !result.profile && account.verified) {
          const created = await fetch('/api/account/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: detected }),
            cache: 'no-store',
            signal: controller.signal,
          });
          result = await created.json();
          if (controller.signal.aborted) return;
          if (!created.ok)
            setMessage(
              errors[result.code] ??
                'Could not initialize your profile. Try saving again.',
            );
        }
        setTimezone(draft ?? result.profile?.timezone ?? detected);
        if (!response.ok)
          setMessage(
            errors[result.code] ??
              'Could not load your profile. Your timezone can be retried.',
          );
      } catch {
        if (!controller.signal.aborted) {
          setTimezone(draft ?? detected);
          setMessage('Could not load your profile. Try saving again.');
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => {
      controller.abort();
      pendingSave.current?.abort();
    };
  }, [account.userId, account.verified]);
  return (
    <main id="main-content" className="account-page" tabIndex={-1}>
      <h1>Your profile</h1>
      <p>Signed in as {account.email}</p>
      {!account.verified && (
        <p role="alert">
          Verify your email to enable private account saves. You can continue
          using the visitor wardrobe.
        </p>
      )}
      <form
        className="account-profile-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage('');
          const controller = new AbortController();
          pendingSave.current = controller;
          try {
            const response = await fetch('/api/account/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timezone }),
              cache: 'no-store',
              signal: controller.signal,
            });
            const result = await response.json();
            if (controller.signal.aborted) return;
            if (response.ok) clearProfileDraft();
            setMessage(
              response.ok
                ? 'Timezone saved.'
                : (errors[result.code] ??
                    'Could not save. Your edits are retained; try again.'),
            );
          } catch {
            if (!controller.signal.aborted)
              setMessage('Could not save. Your edits are retained; try again.');
          } finally {
            if (!controller.signal.aborted) setBusy(false);
          }
        }}
      >
        <label htmlFor="account-timezone">Your timezone</label>
        <input
          id="account-timezone"
          value={timezone}
          onChange={(event) => {
            setTimezone(event.target.value);
            if (!saveProfileDraft(account.userId!, event.target.value))
              setMessage(
                'This browser cannot remember your draft during sign-in. Keep this page open to retain your edits.',
              );
          }}
          required
          disabled={busy || !account.verified}
        />
        <Button type="submit" disabled={busy || !account.verified}>
          {busy ? (timezone ? 'Saving…' : 'Loading…') : 'Save timezone'}
        </Button>
      </form>
      <p role="status">{message}</p>
      <p>
        Synced wardrobe and automatic visitor transfer are coming next. Personal
        photos, preferences, wear statistics and account deletion are not
        enabled yet.
      </p>
      <Link href="/sign-in">Sign-in and password recovery</Link>
    </main>
  );
}
