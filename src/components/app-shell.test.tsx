import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/quick-add' }));

describe('app shell access boundaries', () => {
  it('shows only visitor destinations and marks the wardrobe active while browsing quick-add', () => {
    render(
      <AppShell>
        <main>Workspace</main>
      </AppShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Visitor navigation' });
    expect(within(nav).getByRole('link', { name: 'Wardrobe' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.queryByRole('link', { name: 'Statistics' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Profile' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Accounts are not available yet',
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('provides the four approved account destinations only when explicitly given account mode', () => {
    render(
      <AppShell mode="account">
        <main>Workspace</main>
      </AppShell>,
    );
    const nav = screen.getByRole('navigation', {
      name: 'Mobile account navigation',
    });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Wardrobe', 'Outfits', 'Statistics', 'Profile']);
    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });
});
