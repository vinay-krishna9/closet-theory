import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-dvh max-w-3xl px-4 py-16 md:px-8 lg:px-12"
    >
      <h1 className="mb-6 text-3xl font-semibold">Page not found</h1>
      <p className="mb-6">We couldn’t find that page.</p>
      <Link
        className="inline-flex min-h-11 items-center underline underline-offset-4"
        href="/"
      >
        Return to Closet Theory
      </Link>
    </main>
  );
}
