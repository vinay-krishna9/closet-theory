'use client';
import { Button } from '@/components/ui/button';
import {
  VisitorImportNotice,
  VisitorImportRecovery,
} from '@/features/account/visitor-import';
import {
  VisitorRestoring,
  VisitorStorageNotice,
} from './visitor-storage-notice';
import { useWardrobe } from './account-provider';

export function WardrobeDataNotice() {
  const wardrobe = useWardrobe();
  if (wardrobe.mode === 'visitor') return <VisitorStorageNotice />;
  return (
    <>
      <VisitorImportNotice />
      <VisitorImportRecovery />
      {wardrobe.loadError && (
        <section className="wardrobe-help" aria-label="Account sync">
          <p role="alert">{wardrobe.loadError}</p>
          <Button variant="outline" onClick={wardrobe.retrySaving}>
            Reload saved wardrobe
          </Button>
        </section>
      )}
    </>
  );
}
export function WardrobeLoading() {
  const wardrobe = useWardrobe();
  return wardrobe.mode === 'visitor' ? (
    <VisitorRestoring />
  ) : (
    <main id="main-content" className="app-container app-main">
      <p role="status">Loading your saved wardrobe…</p>
    </main>
  );
}
export function WardrobeUnavailable() {
  return (
    <main id="main-content" className="app-container app-main">
      <h1>Your wardrobe</h1>
      <WardrobeDataNotice />
    </main>
  );
}
