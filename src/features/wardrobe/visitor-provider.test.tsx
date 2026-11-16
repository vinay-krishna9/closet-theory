import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGarment } from './model';
import {
  VisitorWardrobeProvider,
  useVisitorWardrobe,
} from './visitor-provider';
import { VisitorStorageNotice } from './visitor-storage-notice';
import {
  encodeWardrobe,
  decodeWardrobe,
  visitorStorageKey,
} from './visitor-storage';
const item = { ...defaultGarment('tshirt'), id: 'stable' };
function Controls() {
  const { items, dispatch, filters, setFilters } = useVisitorWardrobe();
  return (
    <>
      <VisitorStorageNotice />
      <output aria-label="items">{items.map((i) => i.name).join(',')}</output>
      <output aria-label="filter">{filters.search}</output>
      <button onClick={() => dispatch({ type: 'add', item })}>Add</button>
      <button
        onClick={() =>
          dispatch({
            type: 'update',
            id: 'stable',
            garment: { ...item, name: 'Latest name' },
          })
        }
      >
        Edit
      </button>
      <button onClick={() => setFilters({ search: 'tee', group: 'Tops' })}>
        Filter
      </button>
    </>
  );
}
async function setup() {
  const view = render(
    <StrictMode>
      <VisitorWardrobeProvider>
        <Controls />
      </VisitorWardrobeProvider>
    </StrictMode>,
  );
  await screen.findByRole('button', { name: 'Add' });
  return view;
}
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
describe('visitor persistence lifecycle', () => {
  it('detects a changed saved value even before its storage event arrives', async () => {
    await setup();
    const remote = { ...item, id: 'other-tab', name: 'Other tab tee' };
    localStorage.setItem(visitorStorageKey, encodeWardrobe([remote]));
    fireEvent.click(screen.getByText('Add', { exact: true }));
    expect(decodeWardrobe(localStorage.getItem(visitorStorageKey))).toEqual([
      remote,
    ]);
    expect(screen.getByLabelText('items')).toHaveTextContent(item.name);
    expect(screen.getByText(/Another tab changed/)).toBeVisible();
  });
  it('ignores unrelated keys and session-storage changes', async () => {
    await setup();
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'unrelated',
          storageArea: localStorage,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: visitorStorageKey,
          storageArea: sessionStorage,
        }),
      );
    });
    fireEvent.click(screen.getByText('Add', { exact: true }));
    expect(decodeWardrobe(localStorage.getItem(visitorStorageKey))).toEqual([
      item,
    ]);
  });
  it('restores before edits without an initial empty write, including Strict Mode', async () => {
    localStorage.setItem(visitorStorageKey, encodeWardrobe([item]));
    const write = vi.spyOn(Storage.prototype, 'setItem');
    await setup();
    expect(screen.getByLabelText('items')).toHaveTextContent(item.name);
    expect(write).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Edit', { exact: true }));
    expect(
      decodeWardrobe(localStorage.getItem(visitorStorageKey))[0],
    ).toMatchObject({ id: 'stable', name: 'Latest name' });
  });
  it('keeps the latest in-memory edits on write failure and retries them', async () => {
    await setup();
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('full');
      });
    fireEvent.click(screen.getByText('Add', { exact: true }));
    fireEvent.click(screen.getByText('Edit', { exact: true }));
    expect(screen.getByLabelText('items')).toHaveTextContent('Latest name');
    expect(screen.getByText(/Browser saving failed/)).toBeVisible();
    write.mockRestore();
    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }));
    expect(
      decodeWardrobe(localStorage.getItem(visitorStorageKey))[0].name,
    ).toBe('Latest name');
  });
  it('preserves unreadable data until confirmed reset and resets filters', async () => {
    localStorage.setItem(visitorStorageKey, '{broken');
    localStorage.setItem('unrelated', 'keep');
    await setup();
    fireEvent.click(screen.getByText('Add', { exact: true }));
    expect(localStorage.getItem(visitorStorageKey)).toBe('{broken');
    fireEvent.click(screen.getByText('Filter', { exact: true }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear visitor wardrobe' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('items')).toHaveTextContent(item.name);
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear visitor wardrobe' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear all selections' }),
    );
    expect(screen.getByLabelText('items')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('filter')).toBeEmptyDOMElement();
    expect(localStorage.getItem(visitorStorageKey)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
  it('keeps browsing available after a blocked read and reports failed clearing', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const remove = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    await setup();
    fireEvent.click(screen.getByText('Add', { exact: true }));
    expect(screen.getByLabelText('items')).toHaveTextContent(item.name);
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear visitor wardrobe' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear all selections' }),
    );
    expect(screen.getByText(/Older saved selections may return/)).toBeVisible();
    remove.mockRestore();
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry clearing saved wardrobe' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear all selections' }),
    );
    await waitFor(() =>
      expect(screen.getByText(/saved in this browser only/)).toBeVisible(),
    );
  });
  it('pauses writes after another tab changes storage until explicit keep', async () => {
    await setup();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: visitorStorageKey,
          storageArea: localStorage,
        }),
      ),
    );
    fireEvent.click(screen.getByText('Add', { exact: true }));
    expect(localStorage.getItem(visitorStorageKey)).toBeNull();
    expect(screen.getByText(/Another tab changed/)).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep and save this wardrobe' }),
    );
    expect(decodeWardrobe(localStorage.getItem(visitorStorageKey))).toEqual([
      item,
    ]);
  });
});
