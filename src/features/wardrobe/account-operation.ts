import type { SupabaseClient } from '@supabase/supabase-js';
import type { Identity } from '@/features/account/server';
import {
  privateReply,
  validTimezone,
} from '@/features/account/profile-operation';
import {
  canonicalImportItems,
  operationIdPattern,
} from '@/features/account/import-payload';
import { accountItem, type AccountItem } from './account-contract';

export async function wardrobeOperation(
  request: Request,
  identity: Identity | null,
  database: (token: string) => SupabaseClient,
) {
  if (!identity) return privateReply(401, { code: 'sign_in_required' });
  if (!identity.verified) return privateReply(403, { code: 'verify_email' });
  if (!identity.databaseVerified)
    return privateReply(503, { code: 'verification_claim_required' });
  let command;
  if (request.method === 'POST') {
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
    try {
      const text = await request.text();
      if (text.length > 8192)
        return privateReply(413, { code: 'invalid_clothing' });
      const body = JSON.parse(text);
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        Object.keys(body).sort().join(',') !==
          'action,expectedOwner,expectedRevision,item,operationId,separate,timezone' ||
        typeof body.operationId !== 'string' ||
        !operationIdPattern.test(body.operationId) ||
        !validTimezone(body.timezone) ||
        !['add', 'update', 'remove'].includes(body.action) ||
        typeof body.separate !== 'boolean' ||
        !body.item ||
        typeof body.item !== 'object' ||
        typeof body.item.id !== 'string' ||
        !operationIdPattern.test(body.item.id)
      )
        throw new Error('Invalid clothing');
      if (body.expectedOwner !== identity.userId)
        return privateReply(409, { code: 'account_changed' });
      if (
        body.action === 'add'
          ? body.expectedRevision !== null
          : !Number.isSafeInteger(body.expectedRevision) ||
            body.expectedRevision < 1 ||
            body.expectedRevision > 2147483647 ||
            body.separate
      )
        throw new Error('Invalid revision');
      const item =
        body.action === 'remove'
          ? Object.keys(body.item).join(',') === 'id'
            ? { id: body.item.id }
            : null
          : canonicalImportItems([body.item])[0];
      if (!item) throw new Error('Invalid clothing');
      command = { ...body, item };
    } catch {
      return privateReply(400, { code: 'invalid_clothing' });
    }
  }
  try {
    const token = await identity.getToken();
    if (!token) return privateReply(401, { code: 'sign_in_required' });
    const db = database(token);
    if (request.method === 'GET') {
      const { data, error, status } = await db
        .rpc('list_wardrobe_items')
        .retry(false);
      if (error)
        return privateReply(
          error.code === 'PGRST202'
            ? 503
            : status === 401
              ? 401
              : status === 403 || error.code === '42501'
                ? 403
                : 502,
          {
            code:
              error.code === 'PGRST202'
                ? 'wardrobe_setup_required'
                : 'wardrobe_unavailable',
          },
        );
      if (
        !data ||
        data.ownerId !== identity.userId ||
        !Array.isArray(data.items)
      )
        return privateReply(502, { code: 'invalid_wardrobe_response' });
      const items: AccountItem[] = data.items.map(accountItem);
      if (new Set(items.map((item) => item.id)).size !== items.length)
        return privateReply(502, { code: 'invalid_wardrobe_response' });
      return privateReply(200, { ownerId: identity.userId, items });
    }
    if (!command) return privateReply(405, { code: 'method_not_allowed' });
    const { data, error, status } = await db
      .rpc('mutate_wardrobe_item', {
        p_operation_id: command.operationId,
        p_action: command.action,
        p_item: command.item,
        p_expected_revision: command.expectedRevision,
        p_separate: command.separate,
        p_timezone: command.timezone,
      })
      .retry(false);
    if (error)
      return privateReply(
        error.code === 'PGRST202'
          ? 503
          : error.code === 'P0001' || error.code === '23505'
            ? 409
            : error.code === 'P0002'
              ? 404
              : status === 401
                ? 401
                : status === 403 || error.code === '42501'
                  ? 403
                  : error.code === '22023'
                    ? 400
                    : 502,
        {
          code:
            error.code === 'PGRST202'
              ? 'wardrobe_setup_required'
              : error.code === 'P0001' &&
                  [
                    'wardrobe_changed',
                    'wardrobe_similarity',
                    'wardrobe_payload_conflict',
                  ].includes(error.message)
                ? error.message
                : error.code === 'P0002'
                  ? 'wardrobe_item_unavailable'
                  : 'wardrobe_unavailable',
        },
      );
    if (
      !data ||
      data.ownerId !== identity.userId ||
      data.operationId !== command.operationId ||
      typeof data.matched !== 'boolean' ||
      !operationIdPattern.test(data.itemId)
    )
      return privateReply(502, { code: 'invalid_wardrobe_receipt' });
    return privateReply(200, data);
  } catch {
    return privateReply(503, { code: 'wardrobe_unavailable' });
  }
}
