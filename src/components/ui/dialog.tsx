'use client';

import { useRef, type ComponentProps } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';
import { Button } from './button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

// shadcn/ui's Radix composition, styled with the app's semantic tokens.
export function DialogContent({
  children,
  className,
  presentation = 'dialog',
  scopeClassName,
  showCloseButton = true,
  onOpenAutoFocus,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  presentation?: 'dialog' | 'editor';
  scopeClassName?: string;
  showCloseButton?: boolean;
}) {
  const content = useRef<HTMLDivElement>(null);
  return (
    <DialogPrimitive.Portal>
      <div className={scopeClassName} style={{ display: 'contents' }}>
        <DialogPrimitive.Overlay className="ui-dialog-overlay" />
        <DialogPrimitive.Content
          ref={content}
          data-slot="dialog-content"
          aria-modal="true"
          className={cn('ui-dialog', `ui-dialog--${presentation}`, className)}
          onOpenAutoFocus={(event) => {
            onOpenAutoFocus?.(event);
            if (!event.defaultPrevented) {
              event.preventDefault();
              (
                content.current?.querySelector<HTMLElement>(
                  '[data-dialog-heading]',
                ) ?? content.current
              )?.focus();
            }
          }}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ui-dialog-close"
                aria-label="Close dialog"
              >
                <Icon icon={X} />
              </Button>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}
