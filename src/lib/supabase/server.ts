import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function accountDatabase(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith('sb_publishable_'))
    throw new Error('Account database is not configured');
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    !parsed.hostname.endsWith('.supabase.co') ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.username ||
    parsed.password
  )
    throw new Error('Account database URL is invalid');
  return createClient(url, key, {
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
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        }),
    },
  });
}
