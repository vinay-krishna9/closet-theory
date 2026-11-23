import type { Identity } from './server';
import type { SupabaseClient } from '@supabase/supabase-js';

export function validTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
export const privateReply = (status: number, body: unknown) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie, Authorization',
    },
  });

export async function profileOperation(
  request: Request,
  identity: Identity | null,
  database: (token: string) => SupabaseClient,
) {
  if (!identity) return privateReply(401, { code: 'sign_in_required' });
  if (!identity.verified) return privateReply(403, { code: 'verify_email' });
  if (!identity.databaseVerified)
    return privateReply(503, { code: 'verification_claim_required' });
  let timezone: string | undefined;
  if (request.method === 'PATCH' || request.method === 'POST') {
    const origin = request.headers.get('origin');
    if (
      origin !== new URL(request.url).origin &&
      !(
        origin === null &&
        request.headers.get('authorization')?.startsWith('Bearer ')
      )
    )
      return privateReply(403, { code: 'origin_denied' });
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return privateReply(415, { code: 'json_required' });
    const text = await request.text();
    if (text.length > 1024)
      return privateReply(413, { code: 'invalid_profile' });
    try {
      const body: unknown = JSON.parse(text);
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        Object.keys(body).join(',') !== 'timezone' ||
        !validTimezone((body as { timezone: unknown }).timezone)
      )
        return privateReply(400, { code: 'invalid_profile' });
      timezone = (body as { timezone: string }).timezone;
    } catch {
      return privateReply(400, { code: 'invalid_profile' });
    }
  }
  try {
    const token = await identity.getToken();
    if (!token) return privateReply(401, { code: 'sign_in_required' });
    const db = database(token);
    const query =
      timezone && request.method === 'POST'
        ? db
            .from('account_profiles')
            .upsert(
              { owner_id: identity.userId, timezone },
              { onConflict: 'owner_id', ignoreDuplicates: true },
            )
            .select('timezone')
            .maybeSingle()
        : timezone
          ? db
              .from('account_profiles')
              .upsert(
                { owner_id: identity.userId, timezone },
                { onConflict: 'owner_id' },
              )
              .select('timezone')
              .single()
          : db
              .from('account_profiles')
              .select('timezone')
              .eq('owner_id', identity.userId)
              .maybeSingle();
    const { data, error, status } = await query.retry(false);
    if (error)
      return privateReply(
        error.code === 'PGRST205'
          ? 503
          : status === 401
            ? 401
            : status === 403 || error.code === '42501'
              ? 403
              : 502,
        {
          code:
            error.code === 'PGRST205'
              ? 'schema_required'
              : 'profile_unavailable',
        },
      );
    if (!data && request.method === 'POST') {
      const existing = await db
        .from('account_profiles')
        .select('timezone')
        .eq('owner_id', identity.userId)
        .maybeSingle()
        .retry(false);
      if (existing.error)
        return privateReply(502, { code: 'profile_unavailable' });
      return privateReply(200, { profile: existing.data });
    }
    return privateReply(200, { profile: data });
  } catch {
    return privateReply(503, { code: 'profile_unavailable' });
  }
}
