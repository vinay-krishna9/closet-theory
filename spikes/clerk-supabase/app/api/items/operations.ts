import { createClient } from '@supabase/supabase-js';

type Identity = {
  userId: string | null;
  getToken: () => Promise<string | null>;
};
const labels = ['SPIKE-02 A', 'SPIKE-02 B'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie, Authorization',
};
const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers });

export async function operateItems(
  request: Request,
  identity: Identity,
  env: Record<string, string | undefined>,
  transport: typeof fetch = fetch,
) {
  if (!identity.userId) return reply(401, { code: 'sign_in_required' });
  if (
    env.NEXT_PUBLIC_SUPABASE_URL !==
      'https://aghsipccmufzdtqwzxey.supabase.co' ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_') ||
    !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
  ) {
    return reply(503, { code: 'configuration_required' });
  }
  const method = request.method;
  const url = new URL(request.url);
  let body: Record<string, unknown> = {};
  if (method !== 'GET') {
    if (
      request.headers.get('origin') &&
      request.headers.get('origin') !== url.origin
    )
      return reply(403, { code: 'origin_denied' });
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return reply(415, { code: 'json_required' });
    const text = await request.text();
    if (text.length > 1024) return reply(413, { code: 'body_too_large' });
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return reply(400, { code: 'invalid_request' });
      body = parsed as Record<string, unknown>;
    } catch {
      return reply(400, { code: 'invalid_request' });
    }
    if (Object.keys(body).some((key) => !['id', 'label'].includes(key)))
      return reply(400, { code: 'invalid_request' });
  }
  const id = method === 'GET' ? url.searchParams.get('id') : body.id;
  if (id != null && (typeof id !== 'string' || !uuid.test(id)))
    return reply(400, { code: 'invalid_id' });
  if (method !== 'GET' && !id) return reply(400, { code: 'invalid_id' });
  if (
    (method === 'POST' || method === 'PATCH') &&
    !labels.includes(String(body.label))
  )
    return reply(400, { code: 'invalid_label' });

  try {
    const token = await identity.getToken();
    if (!token) return reply(401, { code: 'sign_in_required' });
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        accessToken: async () => token,
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) =>
            transport(input, {
              ...init,
              cache: 'no-store',
              signal: AbortSignal.timeout(10000),
            }),
        },
      },
    );
    const table = client.from('spike_access_items');
    const query =
      method === 'POST'
        ? table
            .insert({ id, label: body.label, owner_id: identity.userId })
            .select('id,label')
        : method === 'PATCH'
          ? table
              .update({ label: body.label })
              .eq('owner_id', identity.userId)
              .eq('id', id)
              .in('label', labels)
              .select('id,label')
          : method === 'DELETE'
            ? table
                .delete()
                .eq('owner_id', identity.userId)
                .eq('id', id)
                .in('label', labels)
                .select('id,label')
            : table
                .select('id,label')
                .eq('owner_id', identity.userId)
                .in('label', labels)
                .order('id')
                .limit(100);
    if (method === 'GET' && id) query.eq('id', id);
    const { data, error, status } = await query.retry(false);
    if (error)
      return reply(
        status === 409 ? 409 : status === 401 || status === 403 ? 403 : 502,
        { code: 'operation_denied' },
      );
    if (id && method !== 'POST' && !data?.length)
      return reply(404, { code: 'not_found' });
    return reply(method === 'POST' ? 201 : 200, { items: data ?? [] });
  } catch {
    return reply(502, { code: 'operation_failed' });
  }
}
