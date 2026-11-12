import localFont from 'next/font/local';
import '@/features/design-review/review.css';

const archivo = localFont({
  src: '../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2',
  variable: '--review-font-display',
  display: 'swap',
  weight: '100 900',
});
const interTight = localFont({
  src: '../../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2',
  variable: '--review-font-ui',
  display: 'swap',
  weight: '100 900',
});

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`design-review ${archivo.variable} ${interTight.variable}`}>
      {children}
    </div>
  );
}
