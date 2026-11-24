'use client';

import { useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Editor } from '@/components/ui/editor';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import {
  ClothingPicture,
  PictorialOptions,
  formalityChoices,
  seasonChoices,
} from '@/components/ui/pictorial-options';
import {
  catalog,
  colors,
  getType,
  groups,
  type Formality,
  type Neckline,
  type Pattern,
  type Season,
  type Sleeves,
} from '@/features/onboarding/catalog';
import {
  sameConfiguration,
  similarItems,
  validateGarment,
  type Garment,
  type WardrobeItem,
} from './model';
import { useWardrobe } from './account-provider';
import { GarmentPhoto, type PhotoStatus } from './garment-photo';
import { CatalogPicture } from '@/features/onboarding/catalog-picture';

export function ItemEditor({
  initial,
  itemId,
  itemRevision,
  opener,
  onClose,
}: {
  initial: Garment;
  itemId?: string;
  itemRevision?: number;
  opener: HTMLElement | null;
  onClose: () => void;
}) {
  const { items, dispatch, announce, mode, pending, loadError, retrySaving } =
    useWardrobe();
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState<Garment>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ key: string; status: PhotoStatus }>({
    key: '',
    status: 'loading',
  });
  const [conflicts, setConflicts] = useState<readonly WardrobeItem[] | null>(
    null,
  );
  const [confirmSeparate, setConfirmSeparate] = useState(false);
  const [replaceId, setReplaceId] = useState('');
  const submitted = useRef(false);
  const operationId = useRef<string | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const type = getType(draft.typeId),
    previewKey = `${draft.typeId}:${draft.color}`;
  const previewStatus = preview.key === previewKey ? preview.status : 'loading';
  const previewReady = previewStatus === 'ready';
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  function patch(patch: Partial<Omit<Garment, 'typeId'>>) {
    if (submitted.current) return;
    if (patch.color !== undefined && patch.color !== draft.color)
      setPreview({ key: '', status: 'loading' });
    setDraft((current) => ({ ...current, ...patch }));
    setErrors([]);
    setConflicts(null);
    setConfirmSeparate(false);
  }
  function commit(targetId?: string, separate = false, revision?: number) {
    if (submitted.current || !previewReady) return;
    submitted.current = true;
    operationId.current ??= crypto.randomUUID();
    const action = targetId
      ? {
          type: 'update' as const,
          id: targetId,
          garment: draft,
          expectedRevision:
            revision ??
            (targetId === itemId
              ? itemRevision
              : conflicts?.find((item) => item.id === targetId)?.revision),
        }
      : {
          type: 'add' as const,
          item: { ...draft, id: operationId.current },
          intentionalDuplicate: separate,
        };
    if (mode === 'visitor') {
      dispatch(action);
      announce(`${draft.name.trim()} ${targetId ? 'updated' : 'added'}.`);
      onClose();
      return;
    }
    setSaving(true);
    setErrors([]);
    setReviewTarget(null);
    void Promise.resolve(dispatch(action))
      .then(() => {
        announce(`${draft.name.trim()} saved.`);
        onClose();
      })
      .catch((error) => {
        setErrors([
          error instanceof Error
            ? error.message
            : 'Could not save. Your draft is retained.',
        ]);
        if (
          ['wardrobe_changed', 'wardrobe_payload_conflict'].includes(
            error?.code,
          )
        )
          setReviewTarget(targetId ?? operationId.current);
        requestAnimationFrame(() => errorSummary.current?.focus());
      })
      .finally(() => {
        submitted.current = false;
        setSaving(false);
      });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateGarment(draft);
    if (next.length) {
      setErrors(next);
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>(
          '.item-editor-form [aria-invalid="true"]',
        );
        (
          field?.querySelector<HTMLElement>('input') ??
          field ??
          errorSummary.current
        )?.focus();
      });
      return;
    }
    if (!previewReady) return;
    const matches = similarItems(items, draft, itemId);
    if (matches.length) {
      setConfirmSeparate(false);
      setConflicts(matches);
      setReplaceId(matches[0].id);
      return;
    }
    commit(itemId);
  }
  return (
    <Editor
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      dirty={dirty && !saving}
    >
      <DialogContent
        presentation="editor"
        className="item-editor"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (opener?.isConnected) opener.focus();
          else document.querySelector<HTMLElement>('.app-main h1')?.focus();
        }}
      >
        <div className="editor-header">
          <DialogTitle asChild>
            <h2 tabIndex={-1} data-dialog-heading>
              {itemId ? 'Edit clothing' : 'Make it your own'}
            </h2>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close item editor"
              disabled={saving}
            >
              <Icon icon={X} />
            </Button>
          </DialogClose>
        </div>
        <form className="item-editor-form" onSubmit={submit} noValidate>
          <fieldset className="item-editor-layout" disabled={saving}>
            <div className="item-editor-preview">
              <GarmentPhoto
                key={previewKey}
                typeId={draft.typeId}
                color={draft.color}
                priority
                onStatusChange={(status) =>
                  setPreview({ key: previewKey, status })
                }
              />
              <p className="wardrobe-image-caption">
                AI-generated sample · Representative details
              </p>
            </div>
            <div className="item-editor-fields">
              <div className="item-editor-identity">
                <div className="wardrobe-field">
                  <Label htmlFor="garment-name">Garment name</Label>
                  <Input
                    id="garment-name"
                    value={draft.name}
                    maxLength={80}
                    aria-invalid={errors.length > 0 && !draft.name.trim()}
                    aria-describedby={
                      errors.length > 0 && !draft.name.trim()
                        ? 'garment-errors'
                        : undefined
                    }
                    onChange={(event) => patch({ name: event.target.value })}
                  />
                </div>
                <fieldset className="color-options">
                  <legend>
                    Garment color{' '}
                    <span>Selected: {colors[draft.color].name}</span>
                  </legend>
                  <p className="wardrobe-help">
                    Choose the closest color to your garment.
                  </p>
                  <div className="color-options-grid">
                    {type.colors.map((color) => (
                      <label key={color}>
                        <input
                          type="radio"
                          name="garment-color"
                          value={color}
                          checked={draft.color === color}
                          onChange={() =>
                            patch({
                              color,
                              name:
                                draft.name ===
                                `${colors[draft.color].name} ${type.name}`
                                  ? `${colors[color].name} ${type.name}`
                                  : draft.name,
                            })
                          }
                        />
                        <span>
                          <i
                            style={{ background: colors[color].hex }}
                            aria-hidden="true"
                          />
                          <span>{colors[color].name}</span>
                          {draft.color === color && (
                            <span className="color-selected" aria-hidden="true">
                              ✓
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="item-editor-options">
                <DialogDescription className="wardrobe-help">
                  Select the clothes you own. AI-generated samples show your
                  chosen color; cut, sleeves and pattern remain representative.
                </DialogDescription>
                {errors.length > 0 && (
                  <div
                    className="wardrobe-error"
                    role="alert"
                    id="garment-errors"
                    tabIndex={-1}
                    ref={errorSummary}
                  >
                    <p>Please check your garment details.</p>
                    <ul>
                      {errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {reviewTarget &&
                  items.find((item) => item.id === reviewTarget) && (
                    <section
                      className="similarity-panel"
                      aria-label="Latest saved clothing"
                    >
                      <h3>Review the latest saved version</h3>
                      {items
                        .filter((item) => item.id === reviewTarget)
                        .map((item) => (
                          <div key={item.id}>
                            <p>
                              {item.name} · {colors[item.color].name} ·{' '}
                              {item.formality} · {item.seasons.join(', ')} ·{' '}
                              {item.pattern}
                              {item.neckline ? ` · ${item.neckline}` : ''}
                              {item.sleeves ? ` · ${item.sleeves}` : ''}
                            </p>
                            <p>
                              Saving your draft will replace these details. Your
                              draft is still shown in the form.
                            </p>
                            <Button
                              variant="outline"
                              onClick={() =>
                                commit(item.id, false, item.revision)
                              }
                            >
                              Save my draft over this version
                            </Button>
                          </div>
                        ))}
                    </section>
                  )}

                {mode === 'account' && loadError && (
                  <section
                    className="wardrobe-error"
                    aria-label="Reload account clothing"
                  >
                    <p>{loadError}</p>
                    <Button variant="outline" onClick={retrySaving}>
                      Reload saved wardrobe
                    </Button>
                  </section>
                )}
                <PictorialOptions
                  legend="Group"
                  value={type.group}
                  disabled
                  choices={groups.map((group) => ({
                    value: group,
                    picture: (
                      <CatalogPicture
                        typeId={
                          catalog.find((entry) => entry.group === group)!.id
                        }
                      />
                    ),
                  }))}
                />
                <PictorialOptions
                  legend="Type"
                  value={type.name}
                  disabled
                  choices={catalog
                    .filter((entry) => entry.group === type.group)
                    .map((entry) => ({
                      value: entry.name,
                      picture: <CatalogPicture typeId={entry.id} />,
                    }))}
                />
                <p className="wardrobe-help">
                  Catalog group and type are fixed.
                </p>
                <PictorialOptions
                  legend="Formality"
                  choices={formalityChoices}
                  value={draft.formality}
                  onChange={(formality) =>
                    patch({ formality: formality as Formality })
                  }
                />
                <PictorialOptions
                  legend="Seasons"
                  invalid={errors.some((error) => error.includes('season'))}
                  errorId="garment-errors"
                  choices={seasonChoices}
                  multiple
                  values={draft.seasons}
                  onValuesChange={(values) =>
                    patch({ seasons: values as Season[] })
                  }
                />
                <details className="item-customize">
                  <summary>Customize the details</summary>
                  <div className="item-customize-grid">
                    {type.necklines.length > 1 && (
                      <PictorialOptions
                        legend="Neckline / collar"
                        choices={type.necklines.map((value) => ({
                          value,
                          picture: (
                            <ClothingPicture
                              variant={
                                value === 'Polo collar' ? 'Collared' : value
                              }
                            />
                          ),
                        }))}
                        value={draft.neckline}
                        onChange={(value) =>
                          patch({ neckline: value as Neckline })
                        }
                      />
                    )}
                    {type.sleeves.length > 1 && (
                      <PictorialOptions
                        legend="Sleeves"
                        choices={type.sleeves.map((value) => ({
                          value,
                          picture: <ClothingPicture variant={value} />,
                        }))}
                        value={draft.sleeves}
                        onChange={(value) =>
                          patch({ sleeves: value as Sleeves })
                        }
                      />
                    )}
                    <PictorialOptions
                      legend="Pattern"
                      choices={type.patterns.map((value) => ({
                        value,
                        picture: <ClothingPicture variant={value} />,
                      }))}
                      value={draft.pattern}
                      onChange={(value) => patch({ pattern: value as Pattern })}
                    />
                  </div>
                </details>
                {conflicts && (
                  <section
                    className="similarity-panel"
                    aria-labelledby="similarity-title"
                    tabIndex={-1}
                    ref={(element) => {
                      element?.scrollIntoView({ block: 'nearest' });
                    }}
                  >
                    <h3 id="similarity-title">You may already have this</h3>
                    <p>
                      Review the existing clothing before adding or replacing a
                      garment.
                    </p>
                    {conflicts.map((item) => (
                      <div className="similarity-existing" key={item.id}>
                        <div className="similarity-photo">
                          <GarmentPhoto
                            typeId={item.typeId}
                            color={item.color}
                          />
                        </div>
                        <label className="similarity-item">
                          <input
                            type="radio"
                            name="replace-item"
                            value={item.id}
                            checked={replaceId === item.id}
                            onChange={() => setReplaceId(item.id)}
                          />
                          <span>
                            {item.name} · {item.formality} · {item.pattern} ·{' '}
                            {item.seasons.join(', ')}
                            {item.neckline ? ` · ${item.neckline}` : ''}
                            {item.sleeves ? ` · ${item.sleeves}` : ''}
                            {sameConfiguration(item, draft)
                              ? ' · Exact configuration'
                              : ''}
                          </span>
                        </label>
                      </div>
                    ))}
                    <div className="similarity-actions">
                      <Button
                        variant="outline"
                        onClick={() => {
                          announce('Existing clothing kept.');
                          onClose();
                        }}
                      >
                        Keep existing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => commit(replaceId)}
                      >
                        Replace details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmSeparate(true)}
                      >
                        Add as a different garment
                      </Button>
                    </div>
                    {confirmSeparate && (
                      <div className="wardrobe-inline-note">
                        <p>
                          Confirm that this is another physical garment you own.
                          It will have its own wardrobe entry.
                        </p>
                        <Button onClick={() => commit(undefined, true)}>
                          Confirm separate garment
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setConfirmSeparate(false)}
                        >
                          Cancel separate garment
                        </Button>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>
          </fieldset>
          <div className="editor-footer">
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="item-editor-submit"
              disabled={
                !previewReady ||
                !!conflicts ||
                saving ||
                pending ||
                !!reviewTarget
              }
              aria-busy={previewStatus === 'loading' || saving}
              aria-label={itemId ? 'Save changes' : 'Add to wardrobe'}
            >
              <span className="item-editor-loading" aria-hidden="true">
                {(previewStatus === 'loading' || saving) && <Spinner />}
              </span>
              <span className="item-editor-action-label">
                {itemId ? 'Save changes' : 'Add to wardrobe'}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Editor>
  );
}
