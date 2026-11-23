'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import Link from 'next/link';
import { useAccount } from '@/features/account/runtime';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';

export function AccountAccess({
  children,
  variant = 'ghost',
}: {
  children: ReactNode;
  variant?: 'ghost' | 'outline';
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const account = useAccount();
  if (account.enabled)
    return (
      <Button variant={variant} asChild>
        <Link href={account.userId ? '/profile' : '/sign-in'}>{children}</Link>
      </Button>
    );
  return (
    <>
      <Button ref={opener} variant={variant} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <DialogTitle asChild>
            <h2 tabIndex={-1} data-dialog-heading>
              Your wardrobe, everywhere.
            </h2>
          </DialogTitle>
          <DialogDescription>
            Accounts are not available yet. Sign-in will let you sync your
            wardrobe, upload personal photos, see more outfit suggestions, save
            outfit preferences and log wears. No account is created here.
          </DialogDescription>
          <Button onClick={() => setOpen(false)}>Back to browsing</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
