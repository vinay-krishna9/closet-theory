'use client';

import {
  createContext,
  useContext,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  wardrobeReducer,
  type WardrobeAction,
  type WardrobeItem,
} from './model';

type VisitorContext = {
  items: readonly WardrobeItem[];
  dispatch: Dispatch<WardrobeAction>;
  notice: string;
  announce: (message: string) => void;
  filters: { search: string; group: string };
  setFilters: Dispatch<React.SetStateAction<{ search: string; group: string }>>;
};
const Context = createContext<VisitorContext | null>(null);
export function VisitorWardrobeProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(wardrobeReducer, []);
  const [notice, announce] = useState('');
  const [filters, setFilters] = useState({ search: '', group: 'All clothing' });
  return (
    <Context.Provider
      value={{ items, dispatch, notice, announce, filters, setFilters }}
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
