'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useAccount } from './runtime';
import { useVisitorWardrobe } from '@/features/wardrobe/visitor-provider';
import {
  acknowledgeImport,
  prepareImport,
  restartImport,
} from './import-storage';
import { validReceipt, type ImportReceipt } from './import-payload';
import { Button } from '@/components/ui/button';
import { VisitorStorageNotice } from '@/features/wardrobe/visitor-storage-notice';

type State = {
  ownerId: string | null;
  phase: 'idle' | 'waiting' | 'importing' | 'done' | 'error';
  message: string;
  signIn?: boolean;
  storageProblem?: boolean;
  restart?: boolean;
  completedOperationId?: string;
};
const initial: State = { ownerId: null, phase: 'idle', message: '' };
const Context = createContext({
  state: initial,
  prepared: false,
  retry: () => {},
});
export const useVisitorImportReady = () => useContext(Context).prepared;
export const useImportRevision = () =>
  useContext(Context).state.completedOperationId ?? null;
const errors: Record<string, string> = {
  import_setup_required:
    'Your account is ready, but clothing transfer is not available yet. Your selections remain in this browser.',
  verification_claim_required:
    'Account verification setup is incomplete. Your selections remain in this browser.',
  verify_email:
    'Verify your email before saving your visitor clothes. Your selections remain here.',
  sign_in_required:
    'Sign in again to finish saving your clothes. Your selections are retained.',
  account_changed:
    'The active account changed. No transfer was acknowledged in this browser.',
  import_account_changed:
    'A transfer belongs to another account. Sign in to that account to finish it. Your selections are retained.',
  import_conflict:
    'An earlier transfer conflicts with these selections. Your clothes are retained. Retry to save your current selections safely.',
  import_source_changed:
    'Your selections changed or are not saved yet. Resolve browser saving below, then retry. Your clothes are retained.',
  import_storage_unavailable:
    'This browser cannot coordinate a safe transfer. Enable browser storage and use a current browser, then retry. Keep this page open to retain unsaved selections.',
  import_storage_unreadable:
    'The saved transfer record could not be read. Your selections have not been removed. Retry reading it, or use the confirmed browser-reset controls below.',
};
export function VisitorImportProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const wardrobe = useVisitorWardrobe();
  const latest = useRef({ account, wardrobe });
  useLayoutEffect(() => {
    latest.current = { account, wardrobe };
  });
  const completed = useRef<{
    ownerId: string;
    receipt: ImportReceipt;
    paused: boolean;
    attempt: number;
  } | null>(null);
  const [state, setState] = useState<State>(initial);
  const [preparedItems, setPreparedItems] = useState<
    typeof wardrobe.items | null
  >(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (
      !account.enabled ||
      !account.loaded ||
      wardrobe.persistence === 'loading'
    )
      return;
    const ownerId = account.userId;
    if (completed.current?.ownerId !== ownerId) completed.current = null;
    if (completed.current?.paused && completed.current.attempt === attempt)
      return;
    let disposed = false;
    const controller = new AbortController();
    const active = () =>
      !disposed &&
      latest.current.account.userId === ownerId &&
      latest.current.wardrobe.persistence === 'saved';
    async function run() {
      if (wardrobe.persistence !== 'saved') {
        setState({
          ownerId,
          phase: 'error',
          message:
            'Browser saving needs attention before clothing transfer. Your current selections are retained; resolve browser saving below, then retry.',
        });
        return;
      }
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const pending = await prepareImport(
          account.verified ? ownerId : null,
          wardrobe.items,
          active,
        );
        if (!active()) return;
        setPreparedItems(wardrobe.items);
        if (!ownerId || !account.verified) {
          setState({
            ownerId,
            phase: ownerId ? 'waiting' : 'idle',
            message: ownerId ? errors.verify_email : '',
          });
          return;
        }
        if (!pending) {
          if (completed.current?.ownerId === ownerId) return;
          setState({
            ownerId,
            phase: 'idle',
            message: 'No visitor clothes are waiting to transfer.',
          });
          return;
        }
        setState({
          ownerId,
          phase: 'importing',
          message: 'Saving your visitor clothes to your account…',
        });
        timeout = setTimeout(() => controller.abort(), 20000);
        const response = await fetch('/api/account/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOwner: ownerId,
            operationId: pending.operationId,
            timezone: pending.timezone,
            items: pending.items,
          }),
          signal: controller.signal,
          cache: 'no-store',
        });
        const result = await response.json();
        if (!active()) return;
        if (!response.ok)
          throw new Error(
            typeof result.code === 'string'
              ? result.code
              : 'import_unavailable',
          );
        if (!validReceipt(result, ownerId, pending.operationId, pending.items))
          throw new Error('invalid_import_receipt');
        const acknowledged = await acknowledgeImport(pending, active);
        if (!active()) return;
        completed.current = {
          ownerId,
          receipt: result,
          paused: acknowledged.changed,
          attempt,
        };
        setState({
          ownerId,
          completedOperationId: result.operationId,
          phase: acknowledged.changed ? 'error' : 'done',
          message:
            `${result.imported + result.matched} visitor ${result.imported + result.matched === 1 ? 'selection is' : 'selections are'} saved to your account. ${result.matched} already ${result.matched === 1 ? 'matched an existing garment' : 'matched existing garments'}.` +
            (acknowledged.changed
              ? ' New or edited selections remain in this browser. Retry to save those too.'
              : ''),
        });
        latest.current.wardrobe.reloadSavedWardrobe();
      } catch (error) {
        if (!active()) return;
        const code = error instanceof Error ? error.message : '';
        setState({
          ownerId,
          phase: 'error',
          message:
            errors[code] ??
            'Could not finish clothing transfer. Your selections are retained. Retry safely without creating another account.',
          signIn:
            code === 'sign_in_required' || code === 'import_account_changed',
          storageProblem: code === 'import_storage_unreadable',
          restart: code === 'import_conflict',
        });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }
    void run();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [
    account.enabled,
    account.loaded,
    account.userId,
    account.verified,
    wardrobe.items,
    wardrobe.persistence,
    attempt,
  ]);
  const visible = state.ownerId === account.userId ? state : initial;
  function retry() {
    if (!visible.restart) {
      setAttempt((value) => value + 1);
      return;
    }
    const ownerId = visible.ownerId;
    void restartImport(
      ownerId,
      () =>
        latest.current.account.userId === ownerId &&
        latest.current.wardrobe.persistence === 'saved',
    )
      .then(() => setAttempt((value) => value + 1))
      .catch(() =>
        setState({
          ownerId,
          phase: 'error',
          message: errors.import_source_changed,
        }),
      );
  }
  return (
    <Context.Provider
      value={{
        state: visible,
        prepared:
          preparedItems === wardrobe.items && wardrobe.persistence === 'saved',
        retry,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function VisitorImportNotice() {
  const { state, retry } = useContext(Context);
  if (!state.message) return null;
  return (
    <section
      className="account-import"
      aria-label="Wardrobe transfer"
      aria-busy={state.phase === 'importing'}
    >
      <p role={state.phase === 'error' ? 'alert' : 'status'}>{state.message}</p>
      {state.phase === 'error' && (
        <Button variant="outline" onClick={retry}>
          Retry clothing transfer
        </Button>
      )}
      {state.signIn && <Link href="/sign-in">Sign in to finish transfer</Link>}
    </section>
  );
}

export function VisitorImportRecovery() {
  const { persistence } = useVisitorWardrobe();
  const { state } = useContext(Context);
  return (persistence !== 'saved' && persistence !== 'loading') ||
    state.storageProblem ? (
    <VisitorStorageNotice />
  ) : null;
}
