'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { catalog, colors, groups, type CatalogType } from './catalog';
import {
  defaultGarment,
  sameConfiguration,
  similarItems,
  type Garment,
} from '@/features/wardrobe/model';
import { useVisitorWardrobe } from '@/features/wardrobe/visitor-provider';
import {
  VisitorRestoring,
  VisitorStorageNotice,
} from '@/features/wardrobe/visitor-storage-notice';
import { ItemEditor } from '@/features/wardrobe/item-editor';
import { GarmentPhoto } from '@/features/wardrobe/garment-photo';

function CatalogCard({
  type,
  onCustomize,
}: {
  type: CatalogType;
  onCustomize: (garment: Garment, opener: HTMLElement) => void;
}) {
  const { items, dispatch, announce } = useVisitorWardrobe();
  const [ready, setReady] = useState(false);
  const garment = defaultGarment(type.id);
  const color = garment.color;
  const selected = items.some((item) => sameConfiguration(item, garment));
  function add(event: React.MouseEvent<HTMLButtonElement>) {
    if (!ready) return;
    if (similarItems(items, garment).length) {
      onCustomize(garment, event.currentTarget);
      return;
    }
    dispatch({ type: 'add', item: { ...garment, id: crypto.randomUUID() } });
    announce(`${garment.name} added.`);
  }
  return (
    <article className="garment-card" aria-label={`${type.name} catalog item`}>
      <GarmentPhoto typeId={type.id} color={color} onReady={setReady} />
      <div className="garment-card-heading">
        <h2>{type.name}</h2>
        <span>{type.group}</span>
      </div>
      <p className="wardrobe-meta">
        {colors[color].name} · {type.formality}
      </p>
      <p className="wardrobe-image-caption">AI-generated sample</p>
      <div className="garment-actions">
        {selected ? (
          <Button variant="outline" asChild>
            <Link href="/wardrobe">
              <Icon icon={Check} />
              In wardrobe
            </Link>
          </Button>
        ) : (
          <Button onClick={add} disabled={!ready}>
            <Icon icon={Plus} />I own this
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={(event) => onCustomize(garment, event.currentTarget)}
        >
          {selected ? 'Add another / customize' : 'Customize'}
        </Button>
      </div>
    </article>
  );
}

export function QuickAdd() {
  const { items, notice, persistence } = useVisitorWardrobe();
  const [group, setGroup] = useState('All clothing');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{
    garment: Garment;
    opener: HTMLElement;
  } | null>(null);
  const visible = catalog.filter(
    (type) =>
      (group === 'All clothing' || type.group === group) &&
      `${type.name} ${type.group} ${type.colors.map((id) => colors[id].name).join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  if (persistence === 'loading') return <VisitorRestoring />;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="app-container app-main wardrobe-main"
    >
      <Link href="/wardrobe" className="wardrobe-back">
        <Icon icon={ArrowLeft} />
        Back to wardrobe
      </Link>
      <div className="wardrobe-heading">
        <div>
          <p className="app-eyebrow">Start with what you own</p>
          <h1 tabIndex={-1}>The everyday essentials</h1>
          <p className="app-intro">
            Choose the clothes you own. Make the details your own.
          </p>
        </div>
        <Link href="/wardrobe" className="wardrobe-count">
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} in your
          wardrobe
        </Link>
      </div>
      <p className="wardrobe-inline-note">
        AI-generated garment samples show your selected color. Other garment
        details remain representative.
      </p>
      <VisitorStorageNotice />
      <div className="wardrobe-tools">
        <div className="group-filters" aria-label="Filter clothing group">
          {['All clothing', ...groups].map((value) => (
            <Button
              variant="outline"
              aria-pressed={group === value}
              key={value}
              onClick={() => setGroup(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="wardrobe-search">
          <Label htmlFor="catalog-search">Find an essential</Label>
          <Input
            id="catalog-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try T-shirt or Navy"
          />
        </div>
      </div>
      <div role="status" className="wardrobe-status">
        {notice}
      </div>
      {visible.length ? (
        <div className="garment-grid">
          {visible.map((type) => (
            <CatalogCard
              key={type.id}
              type={type}
              onCustomize={(garment, opener) => setEditor({ garment, opener })}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pieces match your search."
          action={
            <Button
              onClick={() => {
                setGroup('All clothing');
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          }
        >
          <p>Try another clothing group or search term.</p>
        </EmptyState>
      )}
      <footer className="wardrobe-footer">
        <p>Only add what’s already in your wardrobe.</p>
        <Link href="/catalog-credits">Photo sources and licenses</Link>
      </footer>
      {editor && (
        <ItemEditor
          initial={editor.garment}
          opener={editor.opener}
          onClose={() => setEditor(null)}
        />
      )}
    </main>
  );
}
