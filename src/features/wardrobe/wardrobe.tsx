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
import { useVisitorWardrobe } from './visitor-provider';
import { type WardrobeItem } from './model';
import {
  VisitorRestoring,
  VisitorStorageNotice,
} from './visitor-storage-notice';
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
  } = useVisitorWardrobe();
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
  if (persistence === 'loading') return <VisitorRestoring />;
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
        Visitor wardrobe · {items.length}{' '}
        {items.length === 1 ? 'piece' : 'pieces'}.
      </p>
      <VisitorStorageNotice />
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
                    onClick={(event) =>
                      setEditor({ item, opener: event.currentTarget })
                    }
                  >
                    Edit clothing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(event) => {
                      removalOpener.current = event.currentTarget;
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
          opener={editor.opener}
          onClose={() => setEditor(null)}
        />
      )}
      <Dialog
        open={!!removal}
        onOpenChange={(open) => {
          if (!open) setRemoval(null);
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
            {removal?.item.name} will leave your visitor wardrobe. The shared
            catalog photo remains available.
          </DialogDescription>
          <div className="similarity-actions">
            <Button
              id="keep-clothing"
              variant="outline"
              onClick={() => setRemoval(null)}
            >
              Keep clothing
            </Button>
            <Button
              onClick={() => {
                if (!removal) return;
                dispatch({ type: 'remove', id: removal.item.id });
                announce(`${removal.item.name} removed.`);
                setRemoval(null);
              }}
            >
              Remove clothing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
