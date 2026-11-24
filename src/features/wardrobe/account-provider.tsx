'use client';
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAccount } from '@/features/account/runtime';
import { useImportRevision } from '@/features/account/visitor-import';
import { useVisitorWardrobe } from './visitor-provider';
import {
  accountItem,
  garmentFields,
  type AccountItem,
} from './account-contract';
import type { WardrobeAction } from './model';
import { operationIdPattern } from '@/features/account/import-payload';

type SharedWardrobe = Omit<
  ReturnType<typeof useVisitorWardrobe>,
  'dispatch'
> & {
  dispatch: (action: WardrobeAction) => void | Promise<void>;
  mode: 'visitor' | 'account';
  pending: boolean;
  loaded: boolean;
  loadError: string;
};
const Context = createContext<SharedWardrobe | null>(null);
export const wardrobeErrors: Record<string, string> = {
  wardrobe_setup_required:
    'Your synced wardrobe is not available yet. Your saved account data has not been changed.',
  wardrobe_changed:
    'This clothing changed since you opened it. Review the latest version before replacing its details.',
  wardrobe_similarity:
    'Your wardrobe changed. Review the existing clothing before adding this garment.',
  wardrobe_payload_conflict:
    'This save changed unexpectedly. Review your draft and retry.',
  wardrobe_item_unavailable:
    'This clothing is no longer available. Your other clothes are unchanged.',
  sign_in_required: 'Your session ended. Sign in again before saving.',
  verify_email: 'Verify your email before saving personal clothing.',
  account_changed:
    'The active account changed. This draft was not saved to another account.',
};
export class WardrobeSaveError extends Error {
  constructor(public code: string) {
    super(
      wardrobeErrors[code] ??
        'Could not save your clothing. Your draft is retained; retry safely.',
    );
  }
}
export function useWardrobe(): SharedWardrobe {
  const account = useContext(Context);
  const visitor = useVisitorWardrobe();
  return (
    account ?? {
      ...visitor,
      mode: 'visitor',
      pending: false,
      loaded: visitor.persistence !== 'loading',
      loadError: '',
    }
  );
}
export function AccountWardrobeProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  if (
    !account.enabled ||
    !account.loaded ||
    !account.userId ||
    !account.verified
  )
    return children;
  return (
    <OwnerWardrobe key={account.userId} ownerId={account.userId}>
      {children}
    </OwnerWardrobe>
  );
}
function OwnerWardrobe({
  ownerId,
  children,
}: {
  ownerId: string;
  children: ReactNode;
}) {
  const visitor = useVisitorWardrobe();
  const importRevision = useImportRevision();
  const [items, setItems] = useState<AccountItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, announce] = useState('');
  const [filters, setFilters] = useState({ search: '', group: 'All clothing' });
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const alive = useRef(false),
    sequence = useRef(0),
    busy = useRef(false),
    ready = useRef(false),
    failed = useRef(false);
  const controllers = useRef(new Set<AbortController>());
  const retries = useRef(new Map<string, string>());
  useLayoutEffect(() => {
    alive.current = true;
    const activeControllers = controllers.current;
    const operationCache = retries.current;
    return () => {
      alive.current = false;
      for (const controller of activeControllers) controller.abort();
      activeControllers.clear();
      operationCache.clear();
    };
  }, []);
  const reload = useCallback(async () => {
    const version = ++sequence.current;
    const controller = new AbortController();
    controllers.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/account/wardrobe', {
        signal: controller.signal,
        cache: 'no-store',
      });
      const result = await response.json();
      if (!alive.current || version !== sequence.current) return false;
      if (!response.ok) throw new WardrobeSaveError(result.code);
      if (result.ownerId !== ownerId || !Array.isArray(result.items))
        throw new Error('Invalid wardrobe response');
      const next: AccountItem[] = result.items.map(accountItem);
      if (new Set(next.map((item) => item.id)).size !== next.length)
        throw new Error('Invalid wardrobe response');
      ready.current = true;
      failed.current = false;
      setItems(next);
      setLoaded(true);
      setLoadError('');
      return true;
    } catch (error) {
      if (alive.current && version === sequence.current) {
        failed.current = true;
        setLoadError(
          error instanceof WardrobeSaveError
            ? error.message
            : 'Could not load your saved wardrobe. Retry without clearing your data.',
        );
      }
      return false;
    } finally {
      clearTimeout(timeout);
      controllers.current.delete(controller);
    }
  }, [ownerId]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void reload();
    });
    return () => {
      active = false;
    };
  }, [reload, importRevision]);
  useEffect(() => {
    const refresh = () => {
      if (!busy.current) void reload();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [reload]);
  async function dispatch(action: WardrobeAction) {
    if (!alive.current) throw new WardrobeSaveError('account_changed');
    if (busy.current)
      throw new Error(
        'A save is already in progress. Keep this draft and try again.',
      );
    if (!ready.current || failed.current)
      throw new Error(
        'Reload your saved wardrobe before saving. Your draft is retained.',
      );
    const item =
      action.type === 'add'
        ? { ...garmentFields(action.item), id: action.item.id }
        : action.type === 'update'
          ? { ...garmentFields(action.garment), id: action.id }
          : { id: action.id };
    const command = {
      expectedOwner: ownerId,
      timezone,
      action: action.type,
      item,
      expectedRevision: action.type === 'add' ? null : action.expectedRevision,
      separate: action.type === 'add' && action.intentionalDuplicate === true,
    };
    if (action.type !== 'add' && !Number.isInteger(action.expectedRevision))
      throw new Error(
        'Reopen the latest clothing details before saving. Your draft is retained.',
      );
    const key = JSON.stringify(command);
    const operationId = retries.current.get(key) ?? crypto.randomUUID();
    retries.current.set(key, operationId);
    busy.current = true;
    setPending(true);
    const controller = new AbortController();
    controllers.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/account/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, operationId }),
        signal: controller.signal,
        cache: 'no-store',
      });
      const result = await response.json();
      if (!alive.current) throw new WardrobeSaveError('account_changed');
      if (!response.ok) {
        if ([400, 403, 404, 409].includes(response.status))
          retries.current.delete(key);
        if (
          [
            'wardrobe_changed',
            'wardrobe_similarity',
            'wardrobe_payload_conflict',
            'wardrobe_item_unavailable',
          ].includes(result.code)
        )
          await reload();
        throw new WardrobeSaveError(result.code);
      }
      if (
        result.ownerId !== ownerId ||
        result.operationId !== operationId ||
        typeof result.matched !== 'boolean' ||
        !operationIdPattern.test(result.itemId)
      )
        throw new Error(
          'Could not confirm the save. Retry safely; your draft is retained.',
        );
      retries.current.delete(key);
      await reload();
      if (!alive.current) throw new WardrobeSaveError('account_changed');
    } catch (error) {
      if (error instanceof WardrobeSaveError) throw error;
      throw new Error(
        'Could not confirm your save. Keep this draft and retry safely.',
      );
    } finally {
      clearTimeout(timeout);
      controllers.current.delete(controller);
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }
  return (
    <Context.Provider
      value={{
        ...visitor,
        items,
        dispatch,
        mode: 'account',
        pending,
        loaded,
        loadError,
        notice,
        announce,
        filters,
        setFilters,
        persistence: loaded ? 'saved' : loadError ? 'failed' : 'loading',
        retrySaving: () => {
          void reload();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
