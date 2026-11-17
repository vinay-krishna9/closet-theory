'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight,
  ChartNoAxesColumn,
  LayoutGrid,
  Shirt,
  UserRound,
} from 'lucide-react';
import { Icon } from './ui/icon';
import { AccountAccess } from './account-access';

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
  const mobileTabs = useRef<HTMLElement>(null);
  useEffect(() => {
    const tabs = mobileTabs.current;
    if (!tabs) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--mobile-tabs-height');
    function measure() {
      root.style.setProperty(
        '--mobile-tabs-height',
        `${tabs!.getBoundingClientRect().height}px`,
      );
    }
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(tabs);
    function revealFocus(event: FocusEvent) {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.closest('main') ||
        !target.matches('a,button,input,select,textarea,summary')
      )
        return;
      const tabBox = tabs!.getBoundingClientRect();
      if (
        tabBox.height &&
        target.getBoundingClientRect().bottom > tabBox.top - 8
      )
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    document.addEventListener('focusin', revealFocus);
    return () => {
      observer?.disconnect();
      document.removeEventListener('focusin', revealFocus);
      if (previous) root.style.setProperty('--mobile-tabs-height', previous);
      else root.style.removeProperty('--mobile-tabs-height');
    };
  }, []);
  const links = mode === 'account' ? accountLinks : visitorLinks;
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
            <AccountAccess>
              Sign in <Icon icon={ArrowRight} />
            </AccountAccess>
          )}
        </div>
      </header>
      {children}
      <nav
        ref={mobileTabs}
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
          <AccountAccess>
            <Icon icon={ArrowRight} navigation />
            Sign in
          </AccountAccess>
        )}
      </nav>
    </>
  );
}
