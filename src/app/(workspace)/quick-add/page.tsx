import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function QuickAddPage() {
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <p className="app-eyebrow">Start with what you own</p>
      <h1>The everyday essentials</h1>
      <p className="app-intro">
        Quick-add will let you select the clothes you already own, with named
        colors and editable details.
      </p>
      <EmptyState
        title="The catalog is coming next."
        action={
          <Button asChild variant="outline">
            <Link href="/wardrobe">Back to wardrobe</Link>
          </Button>
        }
      >
        <p>
          No catalog selections are available yet. No sample clothes have been
          added to your wardrobe.
        </p>
      </EmptyState>
    </main>
  );
}
