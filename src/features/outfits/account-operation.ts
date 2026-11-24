import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Identity } from '@/features/account/server';
import { privateReply } from '@/features/account/profile-operation';
import { wardrobeOperation } from '@/features/wardrobe/account-operation';
import { toOutfitItems } from '@/features/wardrobe/outfit-items';
import type { AccountItem } from '@/features/wardrobe/account-contract';
import { seasons, formalities } from '@/features/onboarding/catalog';
import { generateOutfits, getOutfitPage } from '@/lib/outfits/engine';
import { engineDefaults } from '@/lib/outfits/rules';
import type { OutfitFilters, OutfitResult } from '@/lib/outfits/types';

export type AccountOutfitResult = Extract<OutfitResult, { ok: true }> & {
  ownerId: string;
  snapshot: string;
  items: AccountItem[];
  nextOffset: number;
  moreAvailable: boolean;
};
export async function accountOutfitsOperation(
  request: Request,
  identity: Identity | null,
  database: (token: string) => SupabaseClient,
) {
  if (!identity) return privateReply(401, { code: 'sign_in_required' });
  if (!identity.verified) return privateReply(403, { code: 'verify_email' });
  if (!identity.databaseVerified)
    return privateReply(503, { code: 'verification_claim_required' });
  if (request.method !== 'POST')
    return privateReply(405, { code: 'method_not_allowed' });
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
  let filters: OutfitFilters, snapshot: string | null, offset: number;
  try {
    const text = await request.text();
    if (text.length > 2048)
      return privateReply(413, { code: 'invalid_suggestions' });
    const body = JSON.parse(text);
    if (
      !body ||
      Object.keys(body).sort().join(',') !==
        'expectedOwner,filters,offset,snapshot' ||
      !body.filters ||
      Object.keys(body.filters).sort().join(',') !== 'formality,season' ||
      !['Any', ...seasons].includes(body.filters.season) ||
      !['Any', ...formalities].includes(body.filters.formality) ||
      !Number.isSafeInteger(body.offset) ||
      body.offset < 0 ||
      body.offset % 6 !== 0 ||
      body.offset >= engineDefaults.maxCandidates ||
      (body.offset === 0
        ? body.snapshot !== null
        : typeof body.snapshot !== 'string' ||
          !/^[a-f0-9]{64}$/.test(body.snapshot))
    )
      throw new Error('Invalid request');
    if (body.expectedOwner !== identity.userId)
      return privateReply(409, { code: 'account_changed' });
    ({ filters, snapshot, offset } = body);
  } catch {
    return privateReply(400, { code: 'invalid_suggestions' });
  }
  // Reuse the validated, token-scoped active-list boundary. No client item IDs,
  // preferences, histories or generation limits can influence the data source.
  const wardrobe = await wardrobeOperation(
    new Request(request.url, { method: 'GET' }),
    identity,
    database,
  );
  if (!wardrobe.ok) return wardrobe;
  try {
    const { items } = (await wardrobe.json()) as { items: AccountItem[] };
    const current = createHash('sha256')
      .update(
        JSON.stringify(['account-outfits-v1', identity.userId, items, filters]),
      )
      .digest('hex');
    if (snapshot !== null && snapshot !== current)
      return privateReply(409, { code: 'outfit_snapshot_changed' });
    // Empty preferences/history until their persistence features ship. A fixed
    // clock keeps regeneration identical across pages without storing results.
    const result = generateOutfits({
      items: toOutfitItems(items),
      filters,
      now: 0,
      preferences: {},
      history: {},
    });
    if (!result.ok)
      return privateReply(502, { code: 'invalid_wardrobe_response' });
    const page = getOutfitPage(result.candidates, offset);
    if (offset > 0 && !page.candidates.length)
      return privateReply(400, { code: 'invalid_suggestions' });
    return privateReply(200, {
      ...result,
      candidates: page.candidates,
      ownerId: identity.userId,
      snapshot: current,
      items,
      nextOffset: page.nextOffset,
      moreAvailable: page.hasMore,
    } satisfies AccountOutfitResult);
  } catch {
    return privateReply(503, { code: 'suggestions_unavailable' });
  }
}
