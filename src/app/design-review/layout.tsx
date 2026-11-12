import localFont from 'next/font/local';
import '@/features/design-review/review.css';

const spaceGrotesk = localFont({
  src: '../../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  variable: '--review-font-display',
  display: 'swap',
  weight: '300 700',
});
const manrope = localFont({
  src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  variable: '--review-font-ui',
  display: 'swap',
  weight: '200 800',
});

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`design-review ${spaceGrotesk.variable} ${manrope.variable}`}
    >
      {children}
    </div>
  );
}
