'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { colors, getType, groups } from '@/features/onboarding/catalog';
import { useWardrobe } from './account-provider';
import { type WardrobeItem } from './model';
import {
  WardrobeLoading,
  WardrobeDataNotice,
  WardrobeUnavailable,
} from './data-notice';
import { ItemEditor } from './item-editor';
import { GarmentPhoto } from './garment-photo';

export function Wardrobe() {
  const removalOpener = useRef<HTMLElement | null>(null);
  const {
    items,
    dispatch,
    notice,
    announce,
    filters,
    setFilters,
    persistence,
    mode,
    loaded,
    loadError,
    pending,
  } = useWardrobe();
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [removalChanged, setRemovalChanged] = useState(false);
  const [editor, setEditor] = useState<{
    item: WardrobeItem;
    opener: HTMLElement;
  } | null>(null);
  const [removal, setRemoval] = useState<{
    item: WardrobeItem;
    opener: HTMLElement;
  } | null>(null);
  const visible = items.filter(
    (item) =>
      (filters.group === 'All clothing' ||
        getType(item.typeId).group === filters.group) &&
      `${item.name} ${getType(item.typeId).name} ${colors[item.color].name}`
        .toLowerCase()
        .includes(filters.search.trim().toLowerCase()),
  );
  const add = (
    <Button asChild>
      <Link href="/quick-add">
        <Icon icon={Plus} />
        Add clothing
      </Link>
    </Button>
  );
  if (persistence === 'loading') return <WardrobeLoading />;
  if (mode === 'account' && !loaded && loadError)
    return <WardrobeUnavailable />;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="app-container app-main wardrobe-main"
    >
      <div className="wardrobe-heading">
        <div>
          <p className="app-eyebrow">Less searching. More wearing.</p>
          <h1 tabIndex={-1}>Your wardrobe</h1>
          <p className="app-intro">
            Good style starts with what’s already yours.
          </p>
        </div>
        {add}
      </div>
      <p className="wardrobe-inline-note">
        {mode === 'account' ? 'Synced wardrobe' : 'Visitor wardrobe'} ·{' '}
        {items.length} {items.length === 1 ? 'piece' : 'pieces'}.
      </p>
      <WardrobeDataNotice />
      {items.length > 0 && (
        <div className="wardrobe-tools">
          <div className="group-filters" aria-label="Filter clothing group">
            {['All clothing', ...groups].map((group) => (
              <Button
                variant="outline"
                aria-pressed={filters.group === group}
                key={group}
                onClick={() => setFilters((current) => ({ ...current, group }))}
              >
                {group}
              </Button>
            ))}
          </div>
          <div className="wardrobe-search">
            <Label htmlFor="wardrobe-search">Search clothing</Label>
            <Input
              id="wardrobe-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </div>
        </div>
      )}
      <div role="status" className="wardrobe-status">
        {notice}
      </div>
      {!items.length ? (
        <EmptyState
          title="Make room for what you love wearing."
          action={
            <Button asChild>
              <Link href="/quick-add">Choose your first pieces</Link>
            </Button>
          }
        >
          <p>
            Start with the clothes you already own. Nothing is selected for you.
          </p>
        </EmptyState>
      ) : !visible.length ? (
        <EmptyState
          title="No pieces found."
          action={
            <Button
              onClick={() => setFilters({ search: '', group: 'All clothing' })}
            >
              Clear filters
            </Button>
          }
        >
          <p>
            Your clothing is still here. Try another search or clothing group.
          </p>
        </EmptyState>
      ) : (
        <>
          <p className="wardrobe-help">
            {visible.length} {visible.length === 1 ? 'piece' : 'pieces'} shown
          </p>
          <div className="garment-grid">
            {visible.map((item) => (
              <article
                key={item.id}
                className="garment-card"
                data-item-id={item.id}
                aria-label={item.name}
              >
                <GarmentPhoto
                  key={`${item.typeId}:${item.color}`}
                  typeId={item.typeId}
                  color={item.color}
                />
                <div className="garment-card-heading">
                  <h2>{item.name}</h2>
                </div>
                <p className="wardrobe-meta">
                  {getType(item.typeId).name} · {item.formality}
                </p>
                <p className="wardrobe-image-caption">
                  AI-generated sample · Representative details
                </p>
                <div className="garment-actions">
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={(event) =>
                      setEditor({ item, opener: event.currentTarget })
                    }
                  >
                    Edit clothing
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={(event) => {
                      removalOpener.current = event.currentTarget;
                      setRemoveError('');
                      setRemovalChanged(false);
                      setRemoval({ item, opener: event.currentTarget });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <footer className="wardrobe-footer">
        <p>Fewer new things. More new combinations.</p>
        <Link href="/catalog-credits">Photo sources and licenses</Link>
      </footer>
      {editor && (
        <ItemEditor
          initial={editor.item}
          itemId={editor.item.id}
          itemRevision={editor.item.revision}
          opener={editor.opener}
          onClose={() => setEditor(null)}
        />
      )}
      <Dialog
        open={!!removal}
        onOpenChange={(open) => {
          if (!open && !removing) setRemoval(null);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('keep-clothing')?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (removalOpener.current?.isConnected)
              removalOpener.current.focus();
            else
              document.querySelector<HTMLElement>('.wardrobe-main h1')?.focus();
          }}
        >
          <DialogTitle asChild>
            <h2>Remove this clothing?</h2>
          </DialogTitle>
          <DialogDescription>
            {removal?.item.name} will leave your{' '}
            {mode === 'account' ? 'active account' : 'visitor'} wardrobe.{' '}
            {mode === 'account'
              ? 'Its identity is retained for history; it will not appear in future suggestions.'
              : 'The shared catalog photo remains available.'}
          </DialogDescription>
          {removeError && (
            <p role="alert" className="wardrobe-error">
              {removeError}
            </p>
          )}
          {removalChanged && (
            <p>
              Latest saved clothing:{' '}
              {items.find((item) => item.id === removal?.item.id)?.name ??
                'No longer active'}
              . Review it before confirming removal.
            </p>
          )}
          <div className="similarity-actions">
            <Button
              id="keep-clothing"
              variant="outline"
              disabled={removing}
              onClick={() => setRemoval(null)}
            >
              Keep clothing
            </Button>
            <Button
              disabled={removing}
              aria-busy={removing}
              onClick={() => {
                if (!removal) return;
                const selected = removalChanged
                  ? items.find((item) => item.id === removal.item.id)
                  : removal.item;
                const action = {
                  type: 'remove' as const,
                  id: removal.item.id,
                  expectedRevision: selected?.revision,
                };
                if (mode === 'visitor') {
                  dispatch(action);
                  announce(`${removal.item.name} removed.`);
                  setRemoval(null);
                  return;
                }
                setRemoving(true);
                setRemoveError('');
                void Promise.resolve(dispatch(action))
                  .then(() => {
                    announce(`${removal.item.name} removed.`);
                    setRemoval(null);
                  })
                  .catch((error) => {
                    setRemoveError(
                      error instanceof Error
                        ? error.message
                        : 'Could not confirm removal. Retry safely.',
                    );
                    setRemovalChanged(error?.code === 'wardrobe_changed');
                  })
                  .finally(() => setRemoving(false));
              }}
            >
              {removing
                ? 'Removing…'
                : removalChanged
                  ? 'Remove latest version'
                  : 'Remove clothing'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
