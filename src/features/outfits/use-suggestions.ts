'use client';

import { useEffect, useRef, useState } from 'react';
import type { OutfitFilters, OutfitRequest } from '@/lib/outfits/types';
import type { WardrobeItem } from '@/features/wardrobe/model';
import { toOutfitItems } from '@/features/wardrobe/outfit-items';
import { startGeneration } from './generation';
import type { VisitorResult } from './visitor-results';

type Submission = { id: number; snapshot: string; request: OutfitRequest };
type Response = { id: number; result: VisitorResult | null };

export function useSuggestions(
  items: readonly WardrobeItem[],
  filters: OutfitFilters,
) {
  const snapshot = JSON.stringify([items, filters]);
  const sequence = useRef(0);
  const pending = useRef<{ id: number; snapshot: string } | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [response, setResponse] = useState<Response | null>(null);

  useEffect(() => {
    if (!submission || submission.snapshot !== snapshot) return;
    const id = submission.id;
    function receive(result: VisitorResult | null) {
      if (sequence.current !== id) return;
      if (pending.current?.id === id) pending.current = null;
      setResponse({ id, result });
    }
    const cancel = startGeneration(
      submission.request,
      submission.id,
      receive,
      () => receive(null),
    );
    return () => {
      cancel();
      if (pending.current?.id === submission.id) pending.current = null;
    };
  }, [submission, snapshot]);

  function suggest(nextFilters = filters) {
    const nextSnapshot = JSON.stringify([items, nextFilters]);
    if (pending.current?.snapshot === nextSnapshot) return;
    const id = ++sequence.current;
    pending.current = { id, snapshot: nextSnapshot };
    setSubmission({
      id,
      snapshot: nextSnapshot,
      request: {
        items: toOutfitItems(items),
        filters: nextFilters,
        now: Date.now(),
      },
    });
  }

  let status: 'ready' | 'pending' | 'error' | 'success' = 'ready';
  let result: VisitorResult | null = null;
  if (submission?.snapshot === snapshot) {
    status = 'pending';
    if (response?.id === submission.id) {
      result = response.result;
      status = result?.ok ? 'success' : 'error';
    }
  }
  return { suggest, status, result };
}
