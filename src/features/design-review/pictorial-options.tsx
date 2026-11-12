import { useId, type ReactNode } from 'react';
import { Check, Flower2, Layers, Leaf, Snowflake, Sun } from 'lucide-react';

type Choice = { value: string; picture: ReactNode };

export const seasonChoices: Choice[] = [
  { value: 'Spring', picture: <Flower2 /> },
  { value: 'Summer', picture: <Sun /> },
  { value: 'Autumn', picture: <Leaf /> },
  { value: 'Winter', picture: <Snowflake /> },
];
export const anyChoice: Choice = { value: 'Any', picture: <Layers /> };

export function ClothingPicture({ variant }: { variant: string }) {
  const sleeveless = variant === 'Sleeveless';
  const collared = variant === 'Collared' || variant === 'Smart-casual';
  const formal = variant === 'Formal';
  const long = variant === 'Long sleeves' || collared || formal;
  const pattern = ['Solid', 'Striped', 'Checked', 'Printed'].includes(variant);
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
      {pattern ? (
        <>
          <rect x="12" y="12" width="40" height="40" rx="6" />
          {variant === 'Solid' && (
            <rect
              x="18"
              y="18"
              width="28"
              height="28"
              rx="3"
              fill="currentColor"
              opacity=".25"
            />
          )}
          {variant === 'Striped' && (
            <path d="M20 14v36m8-36v36m8-36v36m8-36v36" />
          )}
          {variant === 'Checked' && (
            <path d="M22 13v38m10-38v38m10-38v38M13 22h38M13 32h38M13 42h38" />
          )}
          {variant === 'Printed' && (
            <>
              <path d="m23 19 4 7-4 7-4-7Zm18 11 4 7-4 7-4-7Z" />
              <circle cx="22" cy="43" r="2" />
              <circle cx="42" cy="20" r="2" />
            </>
          )}
        </>
      ) : (
        <>
          <path
            d={
              sleeveless
                ? 'M24 10h16l6 4-3 11 3 30H18l3-30-3-11Z'
                : long
                  ? 'M24 10h16l8 4 10 33-8 3-4-18v23H18V32l-4 18-8-3 10-33Z'
                  : 'M24 10h16l8 3 8 8-5 8-5-3v29H18V26l-5 3-5-8 8-8Z'
            }
          />
          {variant === 'V-neck' ? (
            <path d="m24 11 8 13 8-13" />
          ) : collared ? (
            <>
              <path d="m24 10 8 6 8-6-3 13-5-7-5 7Z" />
              <path d="M32 17v36" />
              <circle cx="35" cy="29" r=".6" />
              <circle cx="35" cy="38" r=".6" />
            </>
          ) : formal ? (
            <>
              <path d="m24 11 8 8 8-8M24 11l-1 11 9 9 9-9-1-11M32 19v35m-3-35 3 10 3-10M26 43h-1m13 0h-1" />
            </>
          ) : (
            <path d="M24 11c0 12 16 12 16 0" />
          )}
        </>
      )}
    </svg>
  );
}

export const formalityChoices: Choice[] = [
  'Casual',
  'Smart-casual',
  'Formal',
].map((value) => ({ value, picture: <ClothingPicture variant={value} /> }));
export const necklineChoices: Choice[] = [
  'Crew neck',
  'V-neck',
  'Collared',
].map((value) => ({ value, picture: <ClothingPicture variant={value} /> }));
export const sleeveChoices: Choice[] = [
  'Short sleeves',
  'Long sleeves',
  'Sleeveless',
].map((value) => ({ value, picture: <ClothingPicture variant={value} /> }));
export const patternChoices: Choice[] = [
  'Solid',
  'Striped',
  'Checked',
  'Printed',
].map((value) => ({ value, picture: <ClothingPicture variant={value} /> }));

export function PictorialOptions({
  legend,
  choices,
  multiple = false,
  value,
  onChange,
  defaultValue = [],
}: {
  legend: string;
  choices: Choice[];
  multiple?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string | readonly string[];
}) {
  const name = useId();
  const defaults =
    typeof defaultValue === 'string' ? [defaultValue] : defaultValue;
  return (
    <fieldset className="review-picture-options">
      <legend>
        {legend}
        {multiple && <span>Choose all that apply</span>}
      </legend>
      <div className="review-picture-grid">
        {choices.map((choice) => (
          <label className="review-picture-choice" key={choice.value}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={choice.value}
              checked={value !== undefined ? value === choice.value : undefined}
              defaultChecked={
                value === undefined
                  ? defaults.includes(choice.value)
                  : undefined
              }
              onChange={() => onChange?.(choice.value)}
            />
            <span className="review-picture-tile">
              <span className="review-picture-icon" aria-hidden="true">
                {choice.picture}
              </span>
              <span className="review-picture-name">{choice.value}</span>
              <Check className="review-picture-check" aria-hidden="true" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
