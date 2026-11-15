import { cn } from '@/lib/utils';

const garments = [
  {
    name: 'shirt',
    outline: 'M8 3 3 6 1 11l4 2 2-3v11h10V10l2 3 4-2-2-5-5-3c0 4-8 4-8 0Z',
  },
  {
    name: 'dress',
    outline: 'M8 2H5l2 7 2 2-5 11h16l-5-11 2-2 2-7h-3c0 4-8 4-8 0Z',
  },
  {
    name: 'sneaker',
    outline: 'M2 16 6 8l4 4 3-1 3 4 5 1 1 5H2v-5Zm0 2h20M10 12l-2 3m5-2-2 3',
  },
] as const;

/** Decorative loading animation. The surrounding control supplies its status. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn('clothing-spinner', className)} aria-hidden="true">
      {garments.map(({ name, outline }) => (
        <svg key={name} viewBox="0 0 24 24" fill="none" focusable="false">
          <path className="clothing-spinner-track" d={outline} />
          <path
            className={`clothing-spinner-trace clothing-spinner-trace--${name}`}
            d={outline}
            pathLength="1"
          />
        </svg>
      ))}
    </span>
  );
}
