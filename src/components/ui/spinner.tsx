import { cn } from '@/lib/utils';

const garments = [
  {
    name: 'shirt',
    outline:
      'M8 3.5 4.5 4.8 2 9.3l3.5 1.9L7 8.8v11.7c3.3.9 6.7.9 10 0V8.8l1.5 2.4L22 9.3l-2.5-4.5L16 3.5C15.4 5.1 14 6 12 6s-3.4-.9-4-2.5ZM8.8 18.5h6.4',
  },
  {
    name: 'dress',
    outline:
      'M7.5 2.5h2L12 5l2.5-2.5h2l-.6 4.2c-.2 1.1-.7 2.1-1.5 2.8l-.4 1.7c1.2 2.8 3 5.9 5 9.1-4.6 1.3-9.4 1.3-14 0 2-3.2 3.8-6.3 5-9.1l-.4-1.7c-.8-.7-1.3-1.7-1.5-2.8l-.6-4.2ZM10 11.2h4M10.7 14l-1.5 4.8m4.1-4.8 1.5 4.8',
  },
  {
    name: 'sneaker',
    outline:
      'M3 8.5 7 7l3 4 2.2-.6 3.5 3.4 4.1 1.4c1.4.5 2.2 1.5 2.2 2.8v2H2v-8c0-1.5.3-2.6 1-3.5ZM2 17.5h20M8.4 9.1l-2.3 1.5m4.4.8-2.2 1.5m4.3.5-2.2 1.5M17 14.2l-.7 3.3',
  },
] as const;

/** Decorative loading animation. The surrounding control supplies its status. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn('clothing-spinner', className)} aria-hidden="true">
      {garments.map(({ name, outline }) => (
        <svg
          key={name}
          className={`clothing-spinner-garment--${name}`}
          viewBox="0 0 24 24"
          fill="none"
          focusable="false"
        >
          <path className="clothing-spinner-outline" d={outline} />
        </svg>
      ))}
    </span>
  );
}
