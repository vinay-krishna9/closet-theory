import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { authConfigured } from '@/features/account/config';

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-dvh max-w-3xl px-4 py-16 md:px-8 lg:px-12"
    >
      <p className="mb-4 text-sm font-semibold">Closet Theory</p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Your wardrobe. More possibilities.
      </h1>
      <p className="max-w-prose text-lg leading-relaxed">
        Outfits from the clothes you already own.
      </p>
      <section
        aria-labelledby="development-status"
        className="mt-12 rounded-xl border border-border bg-surface p-6"
      >
        <h2 id="development-status" className="mb-3 text-xl font-semibold">
          In development
        </h2>
        <p className="leading-relaxed">
          Choose owned clothes from the visitor catalog and get up to three
          outfit suggestions. Visitor selections are saved in this browser only.{' '}
          {authConfigured()
            ? 'Account sign-in is available. Synced wardrobes and personal photo uploads are coming next.'
            : 'Personal photo uploads and accounts are not configured in this environment.'}
        </p>
      </section>
      <div className="mt-8">
        <Button asChild>
          <Link href="/wardrobe">Explore your wardrobe</Link>
        </Button>
      </div>
      {authConfigured() && (
        <p className="mt-6">
          <Link href="/sign-in">Sign in or create an account</Link>
        </p>
      )}
    </main>
  );
}
