import type {
  ColorId,
  Formality,
  Group,
  Pattern,
  Season,
} from '@/features/onboarding/catalog';

export type OutfitItem = {
  id: string;
  group: Group;
  color: ColorId;
  formality: Formality;
  seasons: readonly Season[];
  pattern: Pattern;
  available: boolean;
};

export type OutfitFilters = {
  season: Season | 'Any';
  formality: Formality | 'Any';
};

export type OutfitPreference = 'favorite' | 'neutral' | 'disliked';
export type WearHistory = {
  items?: Readonly<Record<string, number>>;
  outfits?: Readonly<Record<string, number>>;
};

export type OutfitRequest = {
  items: readonly OutfitItem[];
  filters: OutfitFilters;
  now: number;
  preferences?: Readonly<Record<string, OutfitPreference>>;
  history?: WearHistory;
  showDisliked?: boolean;
  limits?: { maxEvaluations?: number; maxCandidates?: number };
};

export type OutfitSlots = {
  top: string;
  bottom: string;
  shoes: string;
  jacket?: string;
};

export type OutfitReason = {
  code:
    | 'neutral-colors'
    | 'coordinated-colors'
    | 'mixed-colors'
    | 'exact-formality'
    | 'adjacent-formality'
    | 'pattern-balance'
    | 'multiple-patterns'
    | 'freshness';
  text: string;
  itemIds: readonly string[];
};

export type OutfitCandidate = {
  id: string;
  slots: OutfitSlots;
  preference: OutfitPreference;
  reasons: readonly OutfitReason[];
  jacketHint?: string;
};

export type RequiredGroup = 'Tops' | 'Bottoms' | 'Shoes';
export type GenerationDiagnostics = {
  missingGroups: readonly RequiredGroup[];
  filteredMissingGroups: readonly RequiredGroup[];
  evaluations: number;
  favoriteEvaluations: number;
  retained: number;
  searchExhaustive: boolean;
  poolTruncated: boolean;
  incompleteJacketSearches: number;
  hiddenDisliked: number;
};

export type OutfitResult =
  | { ok: false; error: { code: 'invalid-input'; fields: readonly string[] } }
  | {
      ok: true;
      outcome:
        | 'results'
        | 'missing-groups'
        | 'filtered-groups'
        | 'no-compatible-outfits'
        | 'hidden-disliked'
        | 'search-limited';
      candidates: readonly OutfitCandidate[];
      diagnostics: GenerationDiagnostics;
    };

// Scores are used inside the engine and are omitted from the public result.
export type ScoredCandidate = {
  candidate: OutfitCandidate;
  style: number;
  freshness: number;
};
