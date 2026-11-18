'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

const messages: Record<string, string> = {
  sign_in_required: 'Sign in before checking Supabase.',
  configuration_required:
    'Check the local Supabase URL, publishable key and Clerk development configuration.',
  schema_required:
    'Supabase needs the test-table migration. It has not been applied yet.',
  supabase_denied:
    'Supabase denied access. Check the Clerk provider configuration and sign in again.',
  read_succeeded:
    'Supabase accepted the read request. Cross-account isolation still needs testing.',
  connection_failed: 'Could not complete the Supabase check. Try again.',
};

export function SupabaseCheck() {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return null;
  return <Probe key={userId ?? 'visitor'} />;
}

function Probe() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/supabase', { cache: 'no-store' });
      const result: { code?: string } = await response.json();
      setMessage(messages[result.code ?? ''] ?? messages.connection_failed);
    } catch {
      setMessage(messages.connection_failed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="supabase-heading">
      <h2 id="supabase-heading">Supabase connection</h2>
      <p>
        This checks a private test table using your Clerk session. It does not
        create or change records.
      </p>
      <button onClick={check} disabled={busy}>
        {busy ? 'Checking Supabase…' : 'Check Supabase connection'}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
