import { useId } from 'react';
import type { OutfitCandidate } from '@/lib/outfits/types';
import type { WardrobeItem } from '@/features/wardrobe/model';
import { GarmentPhoto } from '@/features/wardrobe/garment-photo';
import { colors, getType } from '@/features/onboarding/catalog';

export function OutfitCard({
  candidate,
  items,
}: {
  candidate: OutfitCandidate;
  items: ReadonlyMap<string, WardrobeItem>;
}) {
  const heading = useId();
  const garments = Object.entries(candidate.slots).map(([slot, id]) => ({
    slot,
    item: items.get(id)!,
  }));
  const top = items.get(candidate.slots.top)!;
  const bottom = items.get(candidate.slots.bottom)!;
  return (
    <article
      className="outfit-card"
      aria-labelledby={heading}
      data-outfit-id={candidate.id}
    >
      <div className="outfit-canvas" aria-label="Outfit composition">
        {garments.map(({ slot, item }) => (
          <div key={item.id} className={`outfit-slot outfit-slot-${slot}`}>
            <GarmentPhoto
              key={`${item.id}-${item.typeId}-${item.color}`}
              typeId={item.typeId}
              color={item.color}
              sizes="(max-width: 767px) 45vw, 280px"
              compact
            />
          </div>
        ))}
      </div>
      <div className="outfit-card-copy">
        <h2 id={heading}>
          {top.name} + {bottom.name}
        </h2>
        <div className="outfit-reasons">
          {candidate.reasons.map((reason) => (
            <p key={reason.code}>{reason.text}</p>
          ))}
        </div>
        {candidate.jacketHint && (
          <p className="outfit-jacket-hint">{candidate.jacketHint}</p>
        )}
        <details>
          <summary>Clothes in this outfit</summary>
          <ul>
            {garments.map(({ item }) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <span>
                  {getType(item.typeId).name} · {colors[item.color].name} ·{' '}
                  {item.formality} · {item.pattern}
                  {[item.neckline, item.sleeves]
                    .filter(Boolean)
                    .map((detail) => ` · ${detail}`)}
                </span>
              </li>
            ))}
          </ul>
        </details>
        <p className="wardrobe-image-caption">
          AI-generated catalog samples. Confirmed details may differ from the
          images.
        </p>
      </div>
    </article>
  );
}
