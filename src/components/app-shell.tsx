'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useState,
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
} from 'react';
import {
  ArrowRight,
  ChartNoAxesColumn,
  LayoutGrid,
  Shirt,
  UserRound,
} from 'lucide-react';
import { Button } from './ui/button';
import { Icon } from './ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';

const visitorLinks = [
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/outfits', label: 'Outfits', icon: LayoutGrid },
];
const accountLinks = [
  ...visitorLinks,
  { href: '/statistics', label: 'Statistics', icon: ChartNoAxesColumn },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

// Account mode is for a future verified server session, never inferred from local storage.
export function AppShell({
  children,
  mode = 'visitor',
}: {
  children: ReactNode;
  mode?: 'visitor' | 'account';
}) {
  const pathname = usePathname();
  const [accountNotice, setAccountNotice] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const links = mode === 'account' ? accountLinks : visitorLinks;
  function signIn(event: MouseEvent<HTMLButtonElement>) {
    setOpener(event.currentTarget);
    setAccountNotice(true);
  }
  function navigation(mobile: boolean) {
    return links.map(({ href, label, icon }) => (
      <Link
        key={href}
        href={href}
        className="app-nav-link"
        aria-current={
          pathname === href ||
          (href === '/wardrobe' && pathname === '/quick-add')
            ? 'page'
            : undefined
        }
      >
        {mobile && <Icon icon={icon} navigation />}
        {label}
      </Link>
    ));
  }
  return (
    <>
      <header className="app-header">
        <div className="app-container app-header-inner">
          <Link href="/" className="app-wordmark">
            STYLIST.
          </Link>
          <nav
            className="app-top-nav"
            aria-label={
              mode === 'account' ? 'Account navigation' : 'Visitor navigation'
            }
          >
            {navigation(false)}
          </nav>
          {mode === 'visitor' && (
            <Button variant="ghost" onClick={signIn}>
              Sign in <Icon icon={ArrowRight} />
            </Button>
          )}
        </div>
      </header>
      {children}
      <nav
        className="app-mobile-tabs"
        style={{ '--tab-count': mode === 'account' ? 4 : 3 } as CSSProperties}
        aria-label={
          mode === 'account'
            ? 'Mobile account navigation'
            : 'Mobile visitor navigation'
        }
      >
        {navigation(true)}
        {mode === 'visitor' && (
          <Button variant="ghost" onClick={signIn}>
            <Icon icon={ArrowRight} navigation />
            Sign in
          </Button>
        )}
      </nav>
      <Dialog open={accountNotice} onOpenChange={setAccountNotice}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener?.focus();
          }}
        >
          <DialogTitle asChild>
            <h2 tabIndex={-1} data-dialog-heading>
              Your wardrobe, everywhere.
            </h2>
          </DialogTitle>
          <DialogDescription>
            Accounts are not available yet. Sign-in will let you sync your
            wardrobe, upload personal photos, save outfit preferences and log
            wears. No account is created here.
          </DialogDescription>
          <Button onClick={() => setAccountNotice(false)}>
            Back to browsing
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
