import { createClient } from '@supabase/supabase-js';

const developmentUrl = 'https://aghsipccmufzdtqwzxey.supabase.co';
type Environment = Record<string, string | undefined>;
type Identity = {
  userId: string | null;
  getToken: () => Promise<string | null>;
};

export async function checkSupabase(
  identity: Identity,
  environment: Environment,
  fetcher: typeof fetch = fetch,
) {
  const respond = (status: number, code: string) =>
    Response.json(
      { code },
      {
        status,
        headers: {
          'Cache-Control': 'private, no-store',
          Vary: 'Cookie, Authorization',
        },
      },
    );
  if (!identity.userId) return respond(401, 'sign_in_required');

  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const key = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (
    url !== developmentUrl ||
    !key?.startsWith('sb_publishable_') ||
    !environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
  ) {
    return respond(503, 'configuration_required');
  }

  try {
    const token = await identity.getToken();
    if (!token) return respond(401, 'sign_in_required');
    // A new client per request; Clerk supplies the token. No Supabase login/session storage.
    const client = createClient(url, key, {
      accessToken: async () => token,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) =>
          fetcher(input, {
            ...init,
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
          }),
      },
    });
    // Read-only probe. RLS must be installed before this is a meaningful data-access check.
    const { error, status } = await client
      .from('spike_access_items')
      .select('id')
      .limit(1)
      .retry(false);
    if (!error) return respond(200, 'read_succeeded');
    if (status === 401 || status === 403)
      return respond(403, 'supabase_denied');
    if (status === 404 && error.code === 'PGRST205')
      return respond(409, 'schema_required');
    return respond(502, 'connection_failed');
  } catch {
    return respond(502, 'connection_failed');
  }
}
