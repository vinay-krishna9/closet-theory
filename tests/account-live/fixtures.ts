import { createRequire } from 'node:module';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const nextEnv = createRequire(path.resolve(process.cwd(), 'package.json'))(
  '@next/env',
) as typeof import('@next/env');
export const journalPath = path.join(root, 'tests/account-live/.fixtures.json');
export type Fixture = {
  id: string;
  email: string;
  rowId: string;
  label: string;
};
export type Journal = { runId: string; dataStarted: boolean; users: Fixture[] };

export function loadConfiguration() {
  nextEnv.loadEnvConfig(root, false, { info() {}, error() {} });
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL !==
      'https://aghsipccmufzdtqwzxey.supabase.co' ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith(
      'sb_publishable_',
    ) ||
    !process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
  )
    throw new Error('Isolated development configuration required.');
  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export async function clerkApi(
  endpoint: string,
  method = 'GET',
  body?: unknown,
) {
  const response = await fetch(`https://api.clerk.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    const codes = (failure?.errors ?? [])
      .map((error: { code?: string }) => error.code)
      .filter(
        (code: unknown) => typeof code === 'string' && /^[a-z_]+$/.test(code),
      )
      .join(', ');
    throw new Error(
      `Development fixture operation failed (HTTP ${response.status}${codes ? `: ${codes}` : ''}).`,
    );
  }
  return response.status === 204 ? null : response.json();
}

export function directClient(token: string | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken: async () => token,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.timeout(10000),
            cache: 'no-store',
          }),
      },
    },
  );
}
export async function readJournal(): Promise<Journal> {
  return JSON.parse(await readFile(journalPath, 'utf8'));
}
export async function saveJournal(journal: Journal) {
  await writeFile(journalPath, JSON.stringify(journal), { mode: 0o600 });
}

export async function cleanupFixtures() {
  let journal: Journal;
  try {
    journal = await readJournal();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw new Error('Cannot read fixture cleanup journal.');
  }
  for (const fixture of [...journal.users]) {
    const user = await clerkApi(`users/${fixture.id}`);
    if (
      user.private_metadata?.account_test_run !== journal.runId ||
      !fixture.email.endsWith('+clerk_test@example.com')
    )
      throw new Error('Fixture ownership guard refused cleanup.');
    const session = await clerkApi('sessions', 'POST', { user_id: fixture.id });
    const token = await clerkApi(`sessions/${session.id}/tokens`, 'POST');
    const client = directClient(token.jwt);
    if (journal.dataStarted) {
      const payload = JSON.parse(
        Buffer.from(token.jwt.split('.')[1], 'base64url').toString(),
      );
      if (payload.email_verified !== true)
        throw new Error('Verification claim required for fixture cleanup.');
      for (const table of [
        'wardrobe_mutations',
        'visitor_import_items',
        'visitor_imports',
        'wardrobe_items',
        'account_profiles',
      ]) {
        const result = await client
          .from(table)
          .delete()
          .eq('owner_id', fixture.id)
          .retry(false);
        if (result.error && result.error.code !== 'PGRST205')
          throw new Error('Account fixture cleanup failed; journal retained.');
        const remaining = await client
          .from(table)
          .select('owner_id')
          .eq('owner_id', fixture.id)
          .retry(false);
        if (
          (remaining.error && remaining.error.code !== 'PGRST205') ||
          remaining.data?.length
        )
          throw new Error(
            'Account fixture rows remain; identity retained for cleanup.',
          );
      }
    }
    const deleted = await clerkApi(`users/${fixture.id}`, 'DELETE');
    if (deleted?.deleted !== true)
      throw new Error('Development account deletion could not be verified.');
    journal.users = journal.users.filter((item) => item.id !== fixture.id);
    await saveJournal(journal);
  }
  await unlink(journalPath);
  console.log(
    'Account foundation fixtures and dedicated development accounts cleaned up.',
  );
}
