import type { SupabaseClient } from '@supabase/supabase-js';
import type { Identity } from './server';
import { privateReply, validTimezone } from './profile-operation';
import {
  canonicalImportItems,
  operationIdPattern,
  validReceipt,
} from './import-payload';

export async function importOperation(
  request: Request,
  identity: Identity | null,
  database: (token: string) => SupabaseClient,
) {
  if (!identity) return privateReply(401, { code: 'sign_in_required' });
  if (!identity.verified) return privateReply(403, { code: 'verify_email' });
  if (!identity.databaseVerified)
    return privateReply(503, { code: 'verification_claim_required' });
  if (
    request.headers.get('origin') !== new URL(request.url).origin &&
    !(
      request.headers.get('origin') === null &&
      request.headers.get('authorization')?.startsWith('Bearer ')
    )
  )
    return privateReply(403, { code: 'origin_denied' });
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return privateReply(415, { code: 'json_required' });
  let payload;
  try {
    const reader = request.body?.getReader();
    if (!reader) return privateReply(400, { code: 'invalid_import' });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 1024 * 1024) {
        await reader.cancel();
        return privateReply(413, { code: 'invalid_import' });
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).sort().join(',') !==
        'expectedOwner,items,operationId,timezone' ||
      typeof body.operationId !== 'string' ||
      !operationIdPattern.test(body.operationId) ||
      !validTimezone(body.timezone)
    )
      throw new Error('Invalid import');
    // This is a stale-session guard, never an authority for database ownership.
    if (body.expectedOwner !== identity.userId)
      return privateReply(409, { code: 'account_changed' });
    payload = {
      operationId: body.operationId,
      timezone: body.timezone,
      items: canonicalImportItems(body.items),
    };
  } catch {
    return privateReply(400, { code: 'invalid_import' });
  }
  try {
    const token = await identity.getToken();
    if (!token) return privateReply(401, { code: 'sign_in_required' });
    const { data, error, status } = await database(token)
      .rpc('import_visitor_wardrobe', {
        p_operation_id: payload.operationId,
        p_timezone: payload.timezone,
        p_items: payload.items,
      })
      .retry(false);
    if (error) {
      const conflict =
        error.code === 'P0001' && error.message === 'import_payload_conflict';
      return privateReply(
        conflict
          ? 409
          : error.code === 'PGRST202'
            ? 503
            : status === 401
              ? 401
              : status === 403 || error.code === '42501'
                ? 403
                : error.code === '22023'
                  ? 400
                  : 502,
        {
          code: conflict
            ? 'import_conflict'
            : error.code === 'PGRST202'
              ? 'import_setup_required'
              : 'import_unavailable',
        },
      );
    }
    if (
      !validReceipt(data, identity.userId, payload.operationId, payload.items)
    )
      return privateReply(502, { code: 'invalid_import_receipt' });
    return privateReply(200, data);
  } catch {
    return privateReply(503, { code: 'import_unavailable' });
  }
}
