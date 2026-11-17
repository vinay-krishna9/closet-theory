import { compareIds, outfitIdentity } from './identity';
import { CandidatePool, compareCandidates, rankCandidates } from './ranking';
import {
  compatibleFormalities,
  eligibleItem,
  engineDefaults,
  freshnessAdjustment,
  needsJacket,
  styleCompatibility,
} from './rules';
import type {
  GenerationDiagnostics,
  OutfitCandidate,
  OutfitItem,
  OutfitRequest,
  OutfitResult,
  RequiredGroup,
  ScoredCandidate,
} from './types';
import { validateRequest } from './validation';

const requiredGroups: readonly RequiredGroup[] = ['Tops', 'Bottoms', 'Shoes'];
const jacketHint = 'You could add a compatible jacket for this season.';

function missingGroups(items: readonly OutfitItem[]): RequiredGroup[] {
  const present = new Set(items.map((item) => item.group));
  return requiredGroups.filter((group) => !present.has(group));
}

function scoreCandidate(
  items: readonly OutfitItem[],
  request: OutfitRequest,
  suggestJacket: boolean,
): ScoredCandidate {
  const id = outfitIdentity(items.map((item) => item.id));
  const top = items.find((item) => item.group === 'Tops')!;
  const bottom = items.find((item) => item.group === 'Bottoms')!;
  const shoes = items.find((item) => item.group === 'Shoes')!;
  const jacket = items.find((item) => item.group === 'Outerwear');
  const style = styleCompatibility(items, request.filters);
  const freshness = freshnessAdjustment(
    items,
    id,
    request.history,
    request.now,
  );
  const reasons =
    style.reasons[0].code === 'exact-formality' &&
    items.some((item) => item.pattern !== 'Solid')
      ? [style.reasons[1], style.reasons[2]]
      : [style.reasons[0], style.reasons[1]];
  if (freshness >= 2) {
    reasons.splice(1, 0, {
      code: 'freshness',
      text: 'Some pieces or this combination were last recorded worn several days ago.',
      itemIds: items.map((item) => item.id),
    });
  }
  return {
    style: style.score,
    freshness,
    candidate: {
      id,
      slots: {
        top: top.id,
        bottom: bottom.id,
        shoes: shoes.id,
        ...(jacket && { jacket: jacket.id }),
      },
      preference:
        request.preferences && Object.hasOwn(request.preferences, id)
          ? request.preferences[id]
          : 'neutral',
      reasons: reasons.slice(0, 2),
      ...(suggestJacket && { jacketHint }),
    },
  };
}

// Diagonal traversal visits all slots progressively, instead of exhausting all
// bottoms and shoes for the first top before considering another top.
function* baseCombinations(
  tops: readonly OutfitItem[],
  bottoms: readonly OutfitItem[],
  shoes: readonly OutfitItem[],
): Generator<OutfitItem[]> {
  const last = tops.length + bottoms.length + shoes.length - 3;
  for (let diagonal = 0; diagonal <= last; diagonal++) {
    const firstTop = Math.max(0, diagonal - bottoms.length - shoes.length + 2);
    const lastTop = Math.min(tops.length - 1, diagonal);
    for (let top = firstTop; top <= lastTop; top++) {
      const remainder = diagonal - top;
      const firstBottom = Math.max(0, remainder - shoes.length + 1);
      const lastBottom = Math.min(bottoms.length - 1, remainder);
      for (let bottom = firstBottom; bottom <= lastBottom; bottom++) {
        yield [tops[top], bottoms[bottom], shoes[remainder - bottom]];
      }
    }
  }
}

function favoriteItems(
  identity: string,
  items: ReadonlyMap<string, OutfitItem>,
): OutfitItem[] | null {
  let ids: unknown;
  try {
    ids = JSON.parse(identity);
  } catch {
    return null;
  }
  if (
    !Array.isArray(ids) ||
    ids.length < 3 ||
    ids.length > 4 ||
    ids.some((id: unknown) => typeof id !== 'string') ||
    new Set(ids).size !== ids.length ||
    outfitIdentity(ids) !== identity
  )
    return null;
  const garments = ids.map((id: string) => items.get(id));
  if (garments.some((item) => !item)) return null;
  const known = garments as OutfitItem[];
  if (
    missingGroups(known).length ||
    new Set(known.map((item) => item.group)).size !== known.length
  )
    return null;
  return known;
}

function directFavorites(
  request: OutfitRequest,
  items: readonly OutfitItem[],
  jackets: readonly OutfitItem[],
  diagnostics: GenerationDiagnostics,
): ScoredCandidate[] {
  const favorites: ScoredCandidate[] = [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const entries = Object.entries(request.preferences ?? {}).sort(
    ([left], [right]) => compareIds(left, right),
  );
  for (const [identity, preference] of entries) {
    if (preference !== 'favorite') continue;
    diagnostics.favoriteEvaluations++;
    const garments = favoriteItems(identity, byId);
    if (!garments || !compatibleFormalities(garments)) continue;
    const hasJacket = garments.some((item) => item.group === 'Outerwear');
    if (hasJacket && !needsJacket(request.filters)) continue;
    if (!hasJacket && needsJacket(request.filters)) {
      const compatibleJacket = jackets.some((jacket) => {
        diagnostics.favoriteEvaluations++;
        return compatibleFormalities([...garments, jacket]);
      });
      if (compatibleJacket) continue;
    }
    favorites.push(
      scoreCandidate(
        garments,
        request,
        !hasJacket && needsJacket(request.filters),
      ),
    );
  }
  return favorites;
}

export function generateOutfits(request: OutfitRequest): OutfitResult {
  const errors = validateRequest(request);
  if (errors.length)
    return { ok: false, error: { code: 'invalid-input', fields: errors } };
  const active = request.items.filter((item) => item.available);
  const eligible = active
    .filter((item) => eligibleItem(item, request.filters))
    .sort((left, right) => compareIds(left.id, right.id));
  const diagnostics: GenerationDiagnostics = {
    missingGroups: missingGroups(active),
    filteredMissingGroups: missingGroups(eligible),
    evaluations: 0,
    favoriteEvaluations: 0,
    retained: 0,
    searchExhaustive: true,
    poolTruncated: false,
    incompleteJacketSearches: 0,
    hiddenDisliked: 0,
  };
  if (
    diagnostics.missingGroups.length ||
    diagnostics.filteredMissingGroups.length
  ) {
    return {
      ok: true,
      outcome: diagnostics.missingGroups.length
        ? 'missing-groups'
        : 'filtered-groups',
      candidates: [],
      diagnostics,
    };
  }

  const tops = eligible.filter((item) => item.group === 'Tops');
  const bottoms = eligible.filter((item) => item.group === 'Bottoms');
  const shoes = eligible.filter((item) => item.group === 'Shoes');
  const jackets = needsJacket(request.filters)
    ? eligible.filter((item) => item.group === 'Outerwear')
    : [];
  const favorites = directFavorites(request, eligible, jackets, diagnostics);
  const favoriteIds = new Set(favorites.map((value) => value.candidate.id));
  const pool = new CandidatePool(
    request.limits?.maxCandidates ?? engineDefaults.maxCandidates,
  );
  const budget =
    request.limits?.maxEvaluations ?? engineDefaults.maxEvaluations;
  for (const base of baseCombinations(tops, bottoms, shoes)) {
    if (diagnostics.evaluations >= budget) {
      diagnostics.searchExhaustive = false;
      break;
    }
    diagnostics.evaluations++;
    if (!compatibleFormalities(base)) continue;
    let selected: ScoredCandidate | undefined;
    let completeJacketSearch = true;
    for (const jacket of jackets) {
      if (diagnostics.evaluations >= budget) {
        completeJacketSearch = false;
        break;
      }
      diagnostics.evaluations++;
      const garments = [...base, jacket];
      if (!compatibleFormalities(garments)) continue;
      const value = scoreCandidate(garments, request, false);
      if (!selected || compareCandidates(value, selected) < 0) selected = value;
    }
    if (!completeJacketSearch) {
      diagnostics.incompleteJacketSearches++;
      diagnostics.searchExhaustive = false;
      break;
    }
    selected ??= scoreCandidate(base, request, needsJacket(request.filters));
    if (favoriteIds.has(selected.candidate.id)) continue;
    if (selected.candidate.preference === 'disliked' && !request.showDisliked) {
      diagnostics.hiddenDisliked++;
      continue;
    }
    pool.add(selected);
  }
  const candidates = rankCandidates([...favorites, ...pool.candidates]).map(
    (value) => value.candidate,
  );
  diagnostics.retained = candidates.length;
  diagnostics.poolTruncated = pool.truncated;
  let outcome: Extract<OutfitResult, { ok: true }>['outcome'] = 'results';
  if (!candidates.length) {
    outcome = 'no-compatible-outfits';
    if (diagnostics.hiddenDisliked) outcome = 'hidden-disliked';
    if (!diagnostics.searchExhaustive) outcome = 'search-limited';
  }
  return { ok: true, outcome, candidates, diagnostics };
}

export function getOutfitPage(
  candidates: readonly OutfitCandidate[],
  offset = 0,
) {
  if (!Number.isSafeInteger(offset) || offset < 0)
    throw new RangeError('Use a nonnegative integer page offset.');
  const page = candidates.slice(offset, offset + 6);
  const nextOffset = offset + page.length;
  return {
    candidates: page,
    nextOffset,
    hasMore: nextOffset < candidates.length,
  };
}
