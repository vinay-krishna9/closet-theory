import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import localFont from 'next/font/local';
import './styles.css';

const display = localFont({
  src: '../../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 700',
  fallback: ['Arial', 'sans-serif'],
});
const ui = localFont({
  src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  variable: '--font-ui',
  display: 'swap',
  weight: '200 800',
  fallback: ['Arial', 'sans-serif'],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
          appearance={{
            variables: {
              colorBackground: '#191c20',
              colorForeground: '#e4e7eb',
              colorPrimary: '#d8dde5',
              colorPrimaryForeground: '#111419',
              colorMutedForeground: '#a4aab3',
              colorInput: '#22262b',
              colorInputForeground: '#e4e7eb',
              borderRadius: '0.5rem',
            },
          }}
        >
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
