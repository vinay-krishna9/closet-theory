'use client';
import { useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVisitorWardrobe } from './visitor-provider';
export function VisitorStorageNotice() {
  const { persistence, retrySaving, clearWardrobe } = useVisitorWardrobe();
  const [confirm, setConfirm] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const messages = {
    loading: 'Restoring your visitor wardrobe...',
    saved:
      'Selections are saved in this browser only. They are not synced and may be lost if browser data is cleared.',
    unreadable:
      'Saved selections could not be read. You can keep browsing in memory. New changes will not be saved until you clear the saved visitor wardrobe.',
    failed:
      'Browser saving failed. Your current selections are still available here, but changes may be lost after reload. Try saving again.',
    external:
      'Another tab changed the saved wardrobe. Saving is paused. Reload to use that version, or keep and save this wardrobe.',
    'clear-failed':
      'Browser storage could not be cleared. Older saved selections may return after reload. Current changes are in memory only.',
  };
  return (
    <section className="wardrobe-help" aria-label="Browser saving">
      <p role="status">{messages[persistence]}</p>
      <div className="similarity-actions">
        {persistence === 'failed' && (
          <Button variant="outline" onClick={retrySaving}>
            Retry saving
          </Button>
        )}
        {persistence === 'external' && (
          <>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload saved wardrobe
            </Button>
            <Button variant="outline" onClick={retrySaving}>
              Keep and save this wardrobe
            </Button>
          </>
        )}
        {persistence === 'clear-failed' && (
          <Button variant="outline" onClick={() => setConfirm(true)}>
            Retry clearing saved wardrobe
          </Button>
        )}
        <Button ref={opener} variant="ghost" onClick={() => setConfirm(true)}>
          Clear visitor wardrobe
        </Button>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <DialogTitle>Clear your visitor wardrobe?</DialogTitle>
          <DialogDescription>
            This removes all visitor selections from this browser, including any
            saved data that could not be read. You can choose clothes again from
            the catalog.
          </DialogDescription>
          <div className="similarity-actions">
            <Button
              ref={cancel}
              variant="outline"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                clearWardrobe();
                setConfirm(false);
              }}
            >
              Clear all selections
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function VisitorRestoring() {
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <div role="status">
        <Spinner /> Restoring your visitor wardrobe...
      </div>
    </main>
  );
}
