import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/empty-state';

export default function WardrobePage() {
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <p className="app-eyebrow">Less searching. More wearing.</p>
      <h1>Your wardrobe</h1>
      <p className="app-intro">Good style starts with what’s already yours.</p>
      <EmptyState
        title="Make room for what you love wearing."
        action={
          <Button asChild>
            <Link href="/quick-add">
              <Icon icon={Plus} />
              Explore quick-add
            </Link>
          </Button>
        }
      >
        <p>
          No clothing has been added. Wardrobe selection is coming next; this
          foundation does not save wardrobe data.
        </p>
      </EmptyState>
    </main>
  );
}
