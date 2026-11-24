import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { AccountWardrobeProvider, useWardrobe } from './account-provider';
import { VisitorWardrobeProvider } from './visitor-provider';
import { defaultGarment } from './model';
import { encodeWardrobe, visitorStorageKey } from './visitor-storage';

const account = vi.hoisted(() => ({
  enabled: true,
  loaded: true,
  verified: true,
  userId: 'user_a' as string | null,
}));
vi.mock('@/features/account/runtime', () => ({ useAccount: () => account }));
const item = {
  ...defaultGarment('tshirt'),
  id: '22222222-2222-4222-8222-222222222222',
  revision: 1,
  name: 'Account clothing',
};
const added = {
  ...defaultGarment('sneakers'),
  id: '33333333-3333-4333-8333-333333333333',
};
function Controls() {
  const wardrobe = useWardrobe();
  const [error, setError] = useState('');
  return (
    <>
      <p aria-label="mode">{wardrobe.mode}</p>
      <p aria-label="clothes">
        {wardrobe.items.map((item) => item.name).join(',')}
      </p>
      <p role="alert">{wardrobe.loadError || error}</p>
      <button onClick={wardrobe.retrySaving}>Reload</button>
      <button
        disabled={!wardrobe.loaded || wardrobe.pending}
        onClick={() => {
          void Promise.resolve(
            wardrobe.dispatch({ type: 'add', item: added }),
          ).catch((error) => setError(error.message));
        }}
      >
        Save garment
      </button>
    </>
  );
}
function Tree() {
  return (
    <VisitorWardrobeProvider>
      <AccountWardrobeProvider>
        <Controls />
      </AccountWardrobeProvider>
    </VisitorWardrobeProvider>
  );
}
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
beforeEach(() => {
  account.userId = 'user_a';
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(
    visitorStorageKey,
    encodeWardrobe([{ ...item, id: 'visitor', name: 'Visitor only' }]),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});
it('keeps account data separate, retains one operation after a lost response, and reloads after confirmation', async () => {
  let saved = false;
  const posts: Record<string, unknown>[] = [];
  const original = localStorage.getItem(visitorStorageKey);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body);
        posts.push(body);
        saved = true;
        if (posts.length === 1)
          throw new Error('Lost response after persistence');
        return reply({
          ownerId: 'user_a',
          operationId: body.operationId,
          itemId: added.id,
          matched: false,
        });
      }
      return reply({
        ownerId: 'user_a',
        items: saved ? [item, { ...added, revision: 1 }] : [item],
      });
    }),
  );
  render(<Tree />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save garment' })).toBeEnabled(),
  );
  expect(screen.getByLabelText('clothes')).toHaveTextContent(
    'Account clothing',
  );
  expect(screen.getByLabelText('clothes')).not.toHaveTextContent(
    'Visitor only',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save garment' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('retry safely'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save garment' }));
  await waitFor(() =>
    expect(screen.getByLabelText('clothes')).toHaveTextContent(added.name),
  );
  expect(posts).toHaveLength(2);
  expect(posts[1]).toEqual(posts[0]);
  expect(localStorage.getItem(visitorStorageKey)).toBe(original);
  expect(sessionStorage.length).toBe(0);
});
it('does not treat failed private loading as an empty or visitor wardrobe', async () => {
  let failed = true;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      failed
        ? reply({ code: 'wardrobe_setup_required' }, 503)
        : reply({ ownerId: 'user_a', items: [item] }),
    ),
  );
  render(<Tree />);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('not available yet'),
  );
  expect(screen.getByLabelText('mode')).toHaveTextContent('account');
  expect(screen.getByLabelText('clothes')).toBeEmptyDOMElement();
  expect(screen.getByRole('button', { name: 'Save garment' })).toBeDisabled();
  failed = false;
  fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() =>
    expect(screen.getByLabelText('clothes')).toHaveTextContent(item.name),
  );
});
it('ignores old-owner responses after account switching, even if transport ignores abort', async () => {
  let finish!: (value: Response) => void;
  const transport = vi.fn();
  transport
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(
      reply({
        ownerId: 'user_b',
        items: [{ ...item, name: 'Account B clothing' }],
      }),
    );
  vi.stubGlobal('fetch', transport);
  const { rerender } = render(<Tree />);
  await waitFor(() => expect(transport).toHaveBeenCalledOnce());
  account.userId = 'user_b';
  rerender(<Tree />);
  await waitFor(() =>
    expect(screen.getByLabelText('clothes')).toHaveTextContent(
      'Account B clothing',
    ),
  );
  await act(async () => finish(reply({ ownerId: 'user_a', items: [item] })));
  expect(screen.getByLabelText('clothes')).not.toHaveTextContent(
    'Account clothing',
  );
  expect(screen.getByLabelText('clothes')).toHaveTextContent(
    'Account B clothing',
  );
});

it('aborts an in-flight save on sign-out and never refreshes its old private records', async () => {
  let finish!: (value: Response) => void;
  let savingSignal: AbortSignal | undefined;
  let operationId = '';
  let reads = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      if (init?.method === 'POST') {
        savingSignal = init.signal;
        operationId = JSON.parse(init.body).operationId;
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      }
      reads++;
      return reply({ ownerId: 'user_a', items: [item] });
    }),
  );
  const { rerender } = render(<Tree />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save garment' })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save garment' }));
  await waitFor(() => expect(savingSignal).toBeDefined());
  account.userId = null;
  rerender(<Tree />);
  expect(savingSignal!.aborted).toBe(true);
  await act(async () =>
    finish(
      reply({
        ownerId: 'user_a',
        operationId,
        itemId: added.id,
        matched: false,
      }),
    ),
  );
  expect(screen.getByLabelText('mode')).toHaveTextContent('visitor');
  expect(screen.getByLabelText('clothes')).not.toHaveTextContent(item.name);
  expect(screen.getByLabelText('clothes')).not.toHaveTextContent(added.name);
  expect(reads).toBe(1);
  expect(localStorage.getItem(visitorStorageKey)).not.toContain(item.name);
});
