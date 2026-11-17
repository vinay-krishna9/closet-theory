import type { OutfitResult } from '@/lib/outfits/types';

export function visitorResults(result: OutfitResult) {
  if (!result.ok) return result;
  return {
    ...result,
    candidates: result.candidates.slice(0, 3),
    moreAvailable: result.candidates.length > 3,
  };
}

export type VisitorResult = ReturnType<typeof visitorResults>;
