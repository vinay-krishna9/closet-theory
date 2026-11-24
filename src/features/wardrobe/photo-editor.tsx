'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Editor } from '@/components/ui/editor';
import {
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import {
  PictorialOptions,
  ClothingPicture,
  seasonChoices,
  formalityChoices,
} from '@/components/ui/pictorial-options';
import {
  catalog,
  colors,
  getType,
  groups,
  type Group,
  type TypeId,
  type Formality,
  type Season,
} from '@/features/onboarding/catalog';
import { closestPhotoColor } from '@/lib/images/photo-color';
import {
  defaultGarment,
  changeType,
  similarItems,
  validateGarment,
  type Garment,
  type WardrobeItem,
} from './model';
import { usePhotoReview, type PhotoChoice } from './use-photo-review';
import { CatalogPicture } from '@/features/onboarding/catalog-picture';

export type PhotoSaveInput = {
  operationId: string;
  id: string;
  garment: Garment;
  original: Blob;
  selected: Blob;
  variant: PhotoChoice | 'catalog';
  expectedRevision: number | null;
  separate: boolean;
};
export function PhotoEditor({
  initial,
  items,
  opener,
  onClose,
  onSave,
}: {
  initial?: WardrobeItem;
  items: readonly WardrobeItem[];
  opener: HTMLElement | null;
  onClose: () => void;
  onSave: (input: PhotoSaveInput) => Promise<void>;
}) {
  const photo = usePhotoReview();
  const [draft, setDraft] = useState<Garment | null>(initial ?? null);
  const [group, setGroup] = useState<Group | null>(
    initial ? getType(initial.typeId).group : null,
  );
  const [formality, setFormality] = useState<Formality | null>(
    initial?.formality ?? null,
  );
  const [seasons, setSeasons] = useState<Season[]>(initial?.seasons ?? []);
  const [errors, setErrors] = useState<string[]>([]),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false);
  const [compare, setCompare] = useState(false),
    [different, setDifferent] = useState(false);
  const [matches, setMatches] = useState<readonly WardrobeItem[] | null>(null);
  const file = useRef<HTMLInputElement>(null),
    summary = useRef<HTMLDivElement>(null);
  const colorTouched = useRef(!!initial),
    submitting = useRef(false),
    identity = useRef({ id: initial?.id ?? '', operation: '' });
  const type = draft ? getType(draft.typeId) : null;
  const typeId = draft?.typeId;
  useEffect(() => {
    if (!photo.selected || !typeId || colorTouched.current) return;
    let active = true;
    void (async () => {
      const bitmap = await createImageBitmap(photo.selected!, {
        resizeWidth: 64,
        resizeHeight: 64,
      });
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(bitmap, 0, 0, 64, 64);
        const detected = closestPhotoColor(
          context.getImageData(0, 0, 64, 64).data,
          getType(typeId).colors,
        );
        if (active && detected && !colorTouched.current)
          setDraft((current) =>
            current?.typeId === typeId
              ? { ...current, color: detected }
              : current,
          );
      } finally {
        bitmap.close();
      }
    })().catch(() => {
      /* Color is optional detection; the user confirms a named choice. */
    });
    return () => {
      active = false;
    };
  }, [photo.selected, typeId]);
  function chooseType(next: TypeId) {
    setDraft((current) =>
      current
        ? changeType(current, next)
        : { ...defaultGarment(next), name: `My ${getType(next).name}` },
    );
    setMatches(null);
    setErrors([]);
    colorTouched.current = false;
  }
  function choosePhoto(next?: File) {
    if (saving || !next) return;
    setSaved(false);
    setErrors([]);
    setCompare(false);
    setMatches(null);
    void photo.choose(next);
  }
  function fail(messages: string[]) {
    setErrors(messages);
    requestAnimationFrame(() => summary.current?.focus());
  }
  async function commit(
    target?: WardrobeItem,
    variant = photo.choice as PhotoChoice | 'catalog',
  ) {
    if (
      submitting.current ||
      !draft ||
      !photo.source ||
      !photo.selected ||
      !variant
    )
      return;
    submitting.current = true;
    colorTouched.current = true;
    setSaving(true);
    setErrors([]);
    identity.current.id ||= crypto.randomUUID();
    identity.current.operation ||= crypto.randomUUID();
    try {
      await onSave({
        operationId: identity.current.operation,
        id: target?.id ?? identity.current.id,
        garment: {
          ...draft,
          name: draft.name.trim(),
          formality: formality!,
          seasons,
        },
        original: photo.source.blob,
        selected: photo.selected,
        variant,
        expectedRevision: target?.revision ?? initial?.revision ?? null,
        separate: different,
      });
      photo.reset();
      setSaved(true);
      setMatches(null);
    } catch (error) {
      fail([
        error instanceof Error
          ? error.message
          : 'Could not save. Your photo and tags are retained; retry safely.',
      ]);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = [
      ...(!photo.selected
        ? [
            'Review the photo and choose a cutout or explicitly use the original.',
          ]
        : []),
      ...(!draft || !group ? ['Choose Group, then Type.'] : []),
      ...(!formality ? ['Confirm a formality.'] : []),
      ...(!seasons.length ? ['Confirm at least one season.'] : []),
    ];
    if (draft && formality && seasons.length)
      invalid.push(...validateGarment({ ...draft, formality, seasons }));
    if (invalid.length) {
      fail(invalid);
      return;
    }
    const existing = similarItems(items, draft!, initial?.id);
    if (existing.length && !different) {
      setMatches(existing);
      return;
    }
    void commit();
  }
  function another() {
    identity.current = { id: '', operation: '' };
    colorTouched.current = false;
    setDraft(null);
    setGroup(null);
    setFormality(null);
    setSeasons([]);
    setDifferent(false);
    setSaved(false);
    setErrors([]);
    requestAnimationFrame(() => file.current?.focus());
  }
  const processing =
    photo.status === 'processing' || photo.status === 'validating';
  const preview =
    !compare && photo.choice === 'cutout' ? photo.cutoutUrl : photo.sourceUrl;
  return (
    <Editor
      open
      dirty={!saved && !saving && (!!photo.source || !!draft)}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        presentation="editor"
        className="item-editor"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener?.focus();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          file.current?.focus();
        }}
      >
        <div className="editor-header">
          <DialogTitle asChild>
            <h2 tabIndex={-1} data-dialog-heading>
              {initial ? 'Replace clothing photo' : 'Add a garment photo'}
            </h2>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close photo editor"
              disabled={saving}
            >
              <Icon icon={X} />
            </Button>
          </DialogClose>
        </div>
        {saved ? (
          <div className="editor-body">
            <p role="status">Clothing saved to your wardrobe.</p>
            <div className="similarity-actions">
              {!initial && <Button onClick={another}>Add another</Button>}
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form className="item-editor-form" onSubmit={submit} noValidate>
            <div
              className="item-editor-layout"
              inert={saving}
              aria-disabled={saving || undefined}
            >
              <div className="item-editor-preview">
                {preview ? (
                  <div className="garment-photo">
                    <Image
                      src={preview}
                      alt="Your selected garment photo"
                      fill
                      unoptimized
                      sizes="(max-width: 767px) 120px, 300px"
                    />
                  </div>
                ) : (
                  <p>Choose one garment photo to begin.</p>
                )}
                <p className="wardrobe-image-caption">
                  {photo.choice === 'cutout' && !compare
                    ? 'Cutout ready for your review. Check that the whole garment is preserved.'
                    : photo.source
                      ? 'Original photo, orientation corrected and metadata removed.'
                      : 'Photo processing happens on this device.'}
                </p>
              </div>
              <div className="item-editor-fields">
                <div className="item-editor-identity">
                  <Label htmlFor="garment-photo-file">
                    {photo.source ? 'Choose another photo' : 'Choose a photo'}
                  </Label>
                  <Input
                    ref={file}
                    id="garment-photo-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      choosePhoto(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                    aria-describedby="photo-limits"
                  />
                  <p id="photo-limits" className="wardrobe-help">
                    One JPEG, PNG or WebP. Maximum 10 MiB and 25 megapixels.
                    Convert HEIC first.
                  </p>
                  <p role="status">
                    {photo.status === 'validating'
                      ? 'Checking your photo…'
                      : photo.status === 'processing'
                        ? 'Removing background…'
                        : ''}
                  </p>
                  {photo.error && (
                    <p role="alert" className="wardrobe-error">
                      {photo.error}
                    </p>
                  )}
                  {photo.source && (
                    <div className="similarity-actions">
                      <Button
                        variant="outline"
                        onClick={photo.retry}
                        disabled={processing}
                      >
                        Retry background removal
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          photo.select('original');
                          setCompare(false);
                        }}
                      >
                        Use original
                      </Button>
                      {photo.cutout && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            photo.select('cutout');
                            setCompare(false);
                          }}
                        >
                          Use cutout
                        </Button>
                      )}
                      {processing && (
                        <Button variant="ghost" onClick={photo.cancel}>
                          Cancel processing
                        </Button>
                      )}
                      {photo.choice === 'cutout' && (
                        <Button
                          variant="ghost"
                          aria-pressed={compare}
                          onClick={() => setCompare(!compare)}
                        >
                          Compare original
                        </Button>
                      )}
                    </div>
                  )}
                  {photo.choice === 'original' && (
                    <p className="wardrobe-help">
                      The background is retained and may affect detected color.
                      Confirm the closest color yourself.
                    </p>
                  )}
                  {draft && (
                    <>
                      <div className="wardrobe-field">
                        <Label htmlFor="photo-garment-name">Garment name</Label>
                        <Input
                          id="photo-garment-name"
                          value={draft.name}
                          maxLength={80}
                          onChange={(event) =>
                            setDraft({ ...draft, name: event.target.value })
                          }
                        />
                      </div>
                      <fieldset className="color-options">
                        <legend>Garment color</legend>
                        <p className="wardrobe-help">
                          Choose the closest color to your garment. Your photo
                          colors are unchanged.
                        </p>
                        <div className="color-options-grid">
                          {type!.colors.map((color) => (
                            <label key={color}>
                              <input
                                type="radio"
                                name="photo-color"
                                value={color}
                                checked={draft.color === color}
                                onChange={() => {
                                  colorTouched.current = true;
                                  setDraft({ ...draft, color });
                                }}
                              />
                              <span>
                                <i style={{ background: colors[color].hex }} />
                                {colors[color].name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                </div>
                <div className="item-editor-options">
                  <DialogDescription>
                    Confirm the clothing in your photo. Saving happens only
                    after you review the selected photo and tags.
                  </DialogDescription>
                  {!!errors.length && (
                    <div
                      role="alert"
                      className="wardrobe-error"
                      tabIndex={-1}
                      ref={summary}
                    >
                      <p>Please check your photo and tags.</p>
                      <ul>
                        {errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <PictorialOptions
                    legend="Group"
                    value={group ?? undefined}
                    disabled={!!initial}
                    choices={groups.map((value) => ({
                      value,
                      picture: (
                        <CatalogPicture
                          typeId={
                            catalog.find((entry) => entry.group === value)!.id
                          }
                        />
                      ),
                    }))}
                    onChange={(value) => {
                      setGroup(value as Group);
                      setDraft(null);
                      setMatches(null);
                    }}
                  />
                  {group && (
                    <PictorialOptions
                      legend="Type"
                      value={type?.name}
                      disabled={!!initial}
                      choices={catalog
                        .filter((entry) => entry.group === group)
                        .map((entry) => ({
                          value: entry.name,
                          picture: <CatalogPicture typeId={entry.id} />,
                        }))}
                      onChange={(value) =>
                        chooseType(
                          catalog.find((entry) => entry.name === value)!.id,
                        )
                      }
                    />
                  )}
                  <PictorialOptions
                    legend="Formality"
                    choices={formalityChoices}
                    value={formality ?? undefined}
                    onChange={(value) => setFormality(value as Formality)}
                  />
                  <PictorialOptions
                    legend="Seasons"
                    choices={seasonChoices}
                    multiple
                    values={seasons}
                    onValuesChange={(values) => setSeasons(values as Season[])}
                  />
                  {draft && type && (
                    <details className="item-customize">
                      <summary>Customize the details</summary>
                      <div className="item-customize-grid">
                        {type.necklines.length > 1 && (
                          <PictorialOptions
                            legend="Neckline / collar"
                            value={draft.neckline}
                            choices={type.necklines.map((value) => ({
                              value,
                              picture: <ClothingPicture variant={value} />,
                            }))}
                            onChange={(value) =>
                              setDraft({
                                ...draft,
                                neckline: value as Garment['neckline'],
                              })
                            }
                          />
                        )}
                        {type.sleeves.length > 1 && (
                          <PictorialOptions
                            legend="Sleeves"
                            value={draft.sleeves}
                            choices={type.sleeves.map((value) => ({
                              value,
                              picture: <ClothingPicture variant={value} />,
                            }))}
                            onChange={(value) =>
                              setDraft({
                                ...draft,
                                sleeves: value as Garment['sleeves'],
                              })
                            }
                          />
                        )}
                        <PictorialOptions
                          legend="Pattern"
                          value={draft.pattern}
                          choices={type.patterns.map((value) => ({
                            value,
                            picture: <ClothingPicture variant={value} />,
                          }))}
                          onChange={(value) =>
                            setDraft({
                              ...draft,
                              pattern: value as Garment['pattern'],
                            })
                          }
                        />
                      </div>
                    </details>
                  )}
                  {matches && (
                    <section
                      className="similarity-panel"
                      aria-label="Similar clothing"
                    >
                      <h3>You may already have this</h3>
                      {matches.map((item) => (
                        <div key={item.id}>
                          <p>{item.name}</p>
                          <Button
                            variant="outline"
                            onClick={() => void commit(item)}
                          >
                            Use my photo and replace these details
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => void commit(item, 'catalog')}
                          >
                            Use catalog photo and these details
                          </Button>
                        </div>
                      ))}
                      <label className="similarity-confirm">
                        <input
                          type="checkbox"
                          checked={different}
                          onChange={(event) =>
                            setDifferent(event.target.checked)
                          }
                        />
                        This is a different physical garment
                      </label>
                      <Button
                        disabled={!different}
                        onClick={() => void commit()}
                      >
                        Add as a different garment
                      </Button>
                      <Button variant="ghost" onClick={onClose}>
                        Keep existing clothing
                      </Button>
                    </section>
                  )}
                </div>
              </div>
            </div>
            <div className="editor-footer">
              <DialogClose asChild>
                <Button variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={saving || !photo.selected}
                aria-busy={saving}
              >
                {saving && <Spinner />}Save clothing
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Editor>
  );
}
