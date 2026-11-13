import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';

const display = localFont({
  src: '../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 700',
  fallback: ['Arial', 'sans-serif'],
});
const ui = localFont({
  src: '../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  variable: '--font-ui',
  display: 'swap',
  weight: '200 800',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Closet Theory',
  description: 'Outfits from the clothes you already own.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
