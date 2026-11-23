'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  wardrobeReducer,
  type WardrobeAction,
  type WardrobeItem,
} from './model';
import {
  readWardrobeSnapshot,
  writeWardrobe,
  removeWardrobe,
  visitorStorageKey,
  visitorImportStorageKey,
} from './visitor-storage';
import { withVisitorLock } from './visitor-lock';
type Persistence =
  'loading' | 'saved' | 'unreadable' | 'failed' | 'external' | 'clear-failed';
type VisitorContext = {
  items: readonly WardrobeItem[];
  dispatch: Dispatch<WardrobeAction>;
  notice: string;
  announce: (message: string) => void;
  persistence: Persistence;
  retrySaving: () => void;
  clearWardrobe: () => Promise<void>;
  reloadSavedWardrobe: () => void;
  filters: { search: string; group: string };
  setFilters: Dispatch<React.SetStateAction<{ search: string; group: string }>>;
};
const Context = createContext<VisitorContext | null>(null);
export function VisitorWardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<readonly WardrobeItem[]>([]);
  const current = useRef(items);
  const savedRaw = useRef<string | null>(null);
  const mode = useRef<Persistence>('loading');
  const [persistence, setPersistence] = useState<Persistence>('loading');
  const [notice, announce] = useState('');
  const [filters, setFilters] = useState({ search: '', group: 'All clothing' });
  function status(value: Persistence) {
    mode.current = value;
    setPersistence(value);
  }
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const restored = readWardrobeSnapshot();
        savedRaw.current = restored.raw;
        current.current = restored.items;
        setItems(restored.items);
        status('saved');
      } catch {
        status('unreadable');
      }
    });
    function changed(event: StorageEvent) {
      try {
        if (
          event.storageArea === window.localStorage &&
          (event.key === visitorStorageKey || event.key === null)
        )
          status('external');
      } catch {
        /* Blocked storage is already reported by the read/write boundary. */
      }
    }
    window.addEventListener('storage', changed);
    return () => {
      active = false;
      window.removeEventListener('storage', changed);
    };
  }, []);
  function save(allowOverwrite: boolean) {
    try {
      if (
        !allowOverwrite &&
        window.localStorage.getItem(visitorStorageKey) !== savedRaw.current
      ) {
        status('external');
        return;
      }
      savedRaw.current = writeWardrobe(current.current);
      status('saved');
    } catch {
      status('failed');
    }
  }
  function retrySaving() {
    void withVisitorLock(() => save(true)).catch(() => status('failed'));
  }
  function dispatch(action: WardrobeAction) {
    if (mode.current === 'loading') return;
    const next = wardrobeReducer(current.current, action);
    if (next === current.current) return;
    current.current = next;
    setItems(next);
    if (mode.current === 'saved' || mode.current === 'failed')
      void withVisitorLock(() => save(false)).catch(() => status('failed'));
  }
  function reloadSavedWardrobe() {
    try {
      const restored = readWardrobeSnapshot();
      savedRaw.current = restored.raw;
      current.current = restored.items;
      setItems(restored.items);
      status('saved');
    } catch {
      status('unreadable');
    }
  }
  async function clearWardrobe() {
    current.current = [];
    setItems([]);
    setFilters({ search: '', group: 'All clothing' });
    try {
      await withVisitorLock(() => {
        removeWardrobe();
        window.localStorage.removeItem(visitorImportStorageKey);
        savedRaw.current = null;
        status('saved');
        announce('Visitor wardrobe cleared.');
      });
    } catch {
      status('clear-failed');
      announce('Current visitor wardrobe cleared.');
    }
  }
  return (
    <Context.Provider
      value={{
        items,
        dispatch,
        notice,
        announce,
        filters,
        setFilters,
        persistence,
        retrySaving,
        clearWardrobe,
        reloadSavedWardrobe,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useVisitorWardrobe() {
  const value = useContext(Context);
  if (!value) throw new Error('Visitor wardrobe provider is required');
  return value;
}
