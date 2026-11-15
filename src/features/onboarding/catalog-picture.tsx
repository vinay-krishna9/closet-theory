import { ClothingPicture } from '@/components/ui/pictorial-options';
import type { TypeId } from './catalog';

export function CatalogPicture({ typeId }: { typeId: TypeId }) {
  if (typeId === 'tshirt') return <ClothingPicture variant="Short sleeves" />;
  if (typeId === 'shirt') return <ClothingPicture variant="Collared" />;
  if (typeId === 'sweater') return <ClothingPicture variant="Long sleeves" />;
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {typeId === 'sneakers' ? (
        <>
          <path d="m9 35 9-5 8-17 11 5 4 11 13 8 3 10H7Z" />
          <path d="M8 42h47M22 23l9 5m-12 1 9 5m-13 0 9 5M39 27l-6 9" />
        </>
      ) : typeId === 'jacket' ? (
        <>
          <path d="m24 10-8 5L6 48l8 3 5-20v24h26V31l5 20 8-3-10-33-8-5Z" />
          <path d="m24 10 8 6 8-6-2 12-6-6-6 6ZM32 17v38M23 39v8m18-8v8" />
        </>
      ) : (
        <>
          <path
            d={
              typeId === 'shorts'
                ? 'M18 11h28l6 33H35l-3-20-3 20H12Z'
                : 'M18 9h28l3 46H35l-3-29-3 29H15Z'
            }
          />
          <path d="M18 16h28M32 10v12m-10-6-4 9m24-9 4 9" />
          {typeId === 'jeans' && <path d="M20 17v8h7v-8m10 0v8h7" />}
        </>
      )}
    </svg>
  );
}
