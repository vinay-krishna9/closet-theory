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
          Wardrobe selection and outfit suggestions are coming next. This page
          does not collect photos, create accounts or save wardrobe data.
        </p>
      </section>
    </main>
  );
}
