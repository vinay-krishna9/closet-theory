import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function OutfitsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <p className="app-eyebrow">Good combinations, already in your closet.</p>
      <h1>A little outfit inspiration</h1>
      <p className="app-intro">
        Thoughtful pairings. Familiar pieces. One less decision.
      </p>
      <EmptyState
        title="Your own clothes come first."
        action={
          <Button asChild>
            <Link href="/wardrobe">Go to wardrobe</Link>
          </Button>
        }
      >
        <p>
          Outfit suggestions are coming after wardrobe selection. A complete
          outfit will need a top, a bottom and shoes. No recommendations have
          been generated.
        </p>
      </EmptyState>
    </main>
  );
}
