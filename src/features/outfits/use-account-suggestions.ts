'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import type { OutfitFilters } from '@/lib/outfits/types';
import { outfitIdentity } from '@/lib/outfits/identity';
import {
  accountItem,
  type AccountItem,
} from '@/features/wardrobe/account-contract';
import { getType } from '@/features/onboarding/catalog';
import type { WardrobeItem } from '@/features/wardrobe/model';
import type { AccountOutfitResult } from './account-operation';
import { accountOutfitLimit } from './account-policy';

type State = {
  key: string;
  result: AccountOutfitResult | null;
  status: 'ready' | 'pending' | 'success' | 'error';
  error: string;
  retryMore: boolean;
};
const initial: State = {
  key: '',
  result: null,
  status: 'ready',
  error: '',
  retryMore: false,
};
function checkedResult(
  value: AccountOutfitResult,
  owner: string,
  offset: number,
  previous: AccountOutfitResult | null,
) {
  if (
    !value ||
    value.ok !== true ||
    value.ownerId !== owner ||
    !/^[a-f0-9]{64}$/.test(value.snapshot) ||
    (offset > 0 && value.snapshot !== previous?.snapshot) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.candidates) ||
    value.candidates.length > 6 ||
    typeof value.moreAvailable !== 'boolean' ||
    value.nextOffset !== offset + value.candidates.length ||
    value.nextOffset > accountOutfitLimit ||
    (value.moreAvailable && value.nextOffset >= accountOutfitLimit) ||
    (value.moreAvailable && value.candidates.length !== 6) ||
    !value.diagnostics ||
    !Array.isArray(value.diagnostics.missingGroups) ||
    !Array.isArray(value.diagnostics.filteredMissingGroups)
  )
    throw new Error('Invalid suggestions response');
  const items: AccountItem[] = value.items.map(accountItem);
  const byId = new Map(items.map((item) => [item.id, item]));
  if (byId.size !== items.length) throw new Error('Invalid clothing response');
  const seen = new Set(
    previous?.candidates.map((candidate) => candidate.id) ?? [],
  );
  for (const candidate of value.candidates) {
    if (
      !candidate.slots ||
      !Array.isArray(candidate.reasons) ||
      candidate.reasons.some(
        (reason: { text: unknown }) => typeof reason.text !== 'string',
      ) ||
      Object.keys(candidate.slots).sort().join(',') !==
        (candidate.slots.jacket
          ? 'bottom,jacket,shoes,top'
          : 'bottom,shoes,top')
    )
      throw new Error('Invalid outfit response');
    for (const [slot, group] of [
      ['top', 'Tops'],
      ['bottom', 'Bottoms'],
      ['shoes', 'Shoes'],
      ['jacket', 'Outerwear'],
    ] as const) {
      const id = candidate.slots[slot];
      if (slot === 'jacket' && !id) continue;
      const item = byId.get(id!);
      if (!item || getType(item.typeId).group !== group)
        throw new Error('Invalid outfit membership');
    }
    if (
      candidate.id !== outfitIdentity(Object.values(candidate.slots)) ||
      seen.has(candidate.id)
    )
      throw new Error('Duplicate or invalid outfit');
    seen.add(candidate.id);
  }
  return {
    ...value,
    items,
    candidates: [...(previous?.candidates ?? []), ...value.candidates],
  };
}

export function useAccountSuggestions(
  items: readonly WardrobeItem[],
  filters: OutfitFilters,
  ownerId: string | null,
  blocked = false,
) {
  const key = JSON.stringify([ownerId, items, filters, blocked]);
  const active = useRef<string | null>(null);
  const pending = useRef<{ key: string; controller: AbortController } | null>(
    null,
  );
  const sequence = useRef({ value: 0 });
  const [state, setState] = useState<State>(initial);
  const [observedKey, setObservedKey] = useState(key);
  if (observedKey !== key) {
    setObservedKey(key);
    if (state.key !== key) setState(initial);
  }
  useLayoutEffect(() => {
    const serial = sequence.current;
    active.current = key;
    return () => {
      active.current = null;
      if (pending.current?.key === key) {
        serial.value++;
        pending.current.controller.abort();
        pending.current = null;
      }
    };
  }, [key]);
  useLayoutEffect(
    () => () => {
      pending.current?.controller.abort();
      pending.current = null;
    },
    [],
  );
  const visible = state.key === key ? state : initial;
  function run(nextFilters: OutfitFilters, more: boolean) {
    if (!ownerId || blocked) return;
    const nextKey = JSON.stringify([ownerId, items, nextFilters, blocked]);
    if (pending.current?.key === nextKey) return;
    pending.current?.controller.abort();
    const previous = more ? visible.result : null;
    if (more && !previous?.moreAvailable) return;
    const offset = previous?.nextOffset ?? 0;
    const controller = new AbortController(),
      id = ++sequence.current.value;
    pending.current = { key: nextKey, controller };
    setState({
      key: nextKey,
      result: previous,
      status: 'pending',
      error: '',
      retryMore: more,
    });
    const timeout = setTimeout(() => controller.abort(), 15000);
    void (async () => {
      try {
        const response = await fetch('/api/account/outfits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
          body: JSON.stringify({
            expectedOwner: ownerId,
            filters: nextFilters,
            offset,
            snapshot: previous?.snapshot ?? null,
          }),
        });
        const value = await response.json();
        if (active.current !== nextKey || sequence.current.value !== id) return;
        if (!response.ok) {
          const changed = [
            'outfit_snapshot_changed',
            'account_changed',
          ].includes(value.code);
          setState({
            key: nextKey,
            result: changed ? null : previous,
            status: 'error',
            retryMore: !changed && more,
            error: changed
              ? 'Your wardrobe changed. Choose Suggest outfits again to use the latest saved clothes.'
              : response.status === 401
                ? 'Your session ended. Sign in again to suggest outfits.'
                : 'Suggestions could not be loaded. Your clothes and filters are preserved; retry safely.',
          });
          return;
        }
        const result = checkedResult(value, ownerId, offset, previous);
        setState({
          key: nextKey,
          result,
          status: 'success',
          error: '',
          retryMore: false,
        });
      } catch {
        if (active.current === nextKey && sequence.current.value === id)
          setState({
            key: nextKey,
            result: previous,
            status: 'error',
            retryMore: more,
            error:
              'Suggestions could not be loaded. Your clothes and filters are preserved; retry safely.',
          });
      } finally {
        clearTimeout(timeout);
        if (sequence.current.value === id) pending.current = null;
      }
    })();
  }
  return {
    ...visible,
    suggest: (nextFilters = filters) => run(nextFilters, false),
    showMore: () => run(filters, true),
  };
}
