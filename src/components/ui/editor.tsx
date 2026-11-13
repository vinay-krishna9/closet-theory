'use client';

import { useRef, useState, type ReactNode } from 'react';
import { AlertDialog } from 'radix-ui';
import { Button } from './button';
import { Dialog } from './dialog';

// Supply DialogContent presentation="editor" with one scrollable body and footer.
// Keep draft state in the feature; this foundation guards every dismissal path.
export function Editor({
  open,
  onOpenChange,
  dirty = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dirty?: boolean;
  children: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  function requestChange(next: boolean) {
    if (!next && dirty) {
      returnFocus.current = document.activeElement as HTMLElement;
      setConfirm(true);
    } else onOpenChange(next);
  }
  return (
    <Dialog open={open} onOpenChange={requestChange}>
      {children}
      <AlertDialog.Root open={confirm} onOpenChange={setConfirm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="ui-dialog-overlay ui-confirm-overlay" />
          <AlertDialog.Content
            aria-modal="true"
            className="ui-dialog ui-dialog--dialog ui-confirm"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current?.focus();
            }}
          >
            <AlertDialog.Title asChild>
              <h2>Discard your changes?</h2>
            </AlertDialog.Title>
            <AlertDialog.Description>
              Your changes have not been saved. Keep editing to retain them, or
              discard them and close.
            </AlertDialog.Description>
            <div className="editor-confirm-actions">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">Keep editing</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={() => onOpenChange(false)}>
                  Discard changes
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog>
  );
}
