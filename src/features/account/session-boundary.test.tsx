import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SessionBoundary } from './session-boundary';
import {
  VisitorWardrobeProvider,
  useVisitorWardrobe,
} from '@/features/wardrobe/visitor-provider';
import { defaultGarment } from '@/features/wardrobe/model';

const account = vi.hoisted(() => ({ userId: 'user_a' as string | null }));
vi.mock('./runtime', () => ({ useAccount: () => account }));
beforeEach(() => {
  localStorage.clear();
  account.userId = 'user_a';
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
function Clothes() {
  const wardrobe = useVisitorWardrobe();
  return (
    <>
      <output aria-label="clothes">{wardrobe.items.length}</output>
      <button
        disabled={wardrobe.persistence === 'loading'}
        onClick={() =>
          wardrobe.dispatch({
            type: 'add',
            item: { ...defaultGarment('tshirt'), id: 'fixture' },
          })
        }
      >
        Add fixture
      </button>
    </>
  );
}
function Tree() {
  return (
    <VisitorWardrobeProvider>
      <SessionBoundary>
        <Clothes />
      </SessionBoundary>
    </VisitorWardrobeProvider>
  );
}
it('clears retained visitor clothing when the active account changes', async () => {
  const { rerender } = render(<Tree />);
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByLabelText('clothes')).toHaveTextContent('1');
  account.userId = 'user_b';
  rerender(<Tree />);
  await waitFor(() =>
    expect(screen.getByLabelText('clothes')).toHaveTextContent('0'),
  );
  expect(localStorage.getItem('closet-theory.visitor-wardrobe')).toBeNull();
});
it('retains pending visitor work on expiry but clears it on a cross-tab sign-out event', async () => {
  const { rerender } = render(<Tree />);
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  fireEvent.click(screen.getByRole('button'));
  account.userId = null;
  rerender(<Tree />);
  expect(screen.getByLabelText('clothes')).toHaveTextContent('1');
  fireEvent(
    window,
    new StorageEvent('storage', {
      key: 'closet-theory.account-signout-event',
      newValue: 'event-fixture',
    }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('clothes')).toHaveTextContent('0'),
  );
});
