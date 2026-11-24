import { createElement } from 'react';
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { beforeAll, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { AccountWardrobeProvider } from './account-provider';
import { VisitorWardrobeProvider } from './visitor-provider';
import { Wardrobe } from './wardrobe';
import { defaultGarment } from './model';

vi.mock('@/features/account/runtime', () => ({
  useAccount: () => ({
    enabled: true,
    loaded: true,
    verified: true,
    userId: 'user_a',
  }),
}));
vi.mock('next/image', () => ({
  default: ({
    fill,
    priority,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => {
    void fill;
    void priority;
    void sizes;
    return createElement('img', props);
  },
}));
beforeAll(() =>
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  }),
);
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());
const initial = {
  ...defaultGarment('tshirt'),
  id: '22222222-2222-4222-8222-222222222222',
  revision: 1,
  name: 'Saved shirt',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
async function editor() {
  render(
    <VisitorWardrobeProvider>
      <AccountWardrobeProvider>
        <Wardrobe />
      </AccountWardrobeProvider>
    </VisitorWardrobeProvider>,
  );
  await screen.findByRole('article', { name: 'Saved shirt' });
  fireEvent.click(screen.getByRole('button', { name: 'Edit clothing' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.load(within(dialog).getAllByRole('img')[0]);
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    ).toBeEnabled(),
  );
  return dialog;
}
it('keeps failed save drafts open and retries the original operation before closing', async () => {
  let current = initial;
  const posts: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body);
        posts.push(body);
        if (posts.length === 1)
          return reply({ code: 'wardrobe_unavailable' }, 503);
        current = { ...current, name: body.item.name, revision: 2 };
        return reply({
          ownerId: 'user_a',
          operationId: body.operationId,
          itemId: current.id,
          matched: false,
        });
      }
      return reply({ ownerId: 'user_a', items: [current] });
    }),
  );
  const dialog = await editor();
  fireEvent.change(within(dialog).getByLabelText('Garment name'), {
    target: { value: 'My edited shirt' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'draft is retained',
    ),
  );
  expect(within(dialog).getByLabelText('Garment name')).toHaveValue(
    'My edited shirt',
  );
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(posts[1]).toEqual(posts[0]);
  expect(
    screen.getByRole('article', { name: 'My edited shirt' }),
  ).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Edit clothing' })).toHaveFocus(),
  );
});
it('requires explicit review before overwriting a newer saved version and keeps the draft', async () => {
  let current = initial;
  const posts: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body);
        posts.push(body);
        if (posts.length === 1) {
          current = {
            ...current,
            name: 'Changed in another browser',
            revision: 2,
          };
          return reply({ code: 'wardrobe_changed' }, 409);
        }
        current = { ...current, name: body.item.name, revision: 3 };
        return reply({
          ownerId: 'user_a',
          operationId: body.operationId,
          itemId: current.id,
          matched: false,
        });
      }
      return reply({ ownerId: 'user_a', items: [current] });
    }),
  );
  const dialog = await editor();
  fireEvent.change(within(dialog).getByLabelText('Garment name'), {
    target: { value: 'My draft' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  await within(dialog).findByRole('region', { name: 'Latest saved clothing' });
  expect(within(dialog).getByLabelText('Garment name')).toHaveValue('My draft');
  expect(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  ).toBeDisabled();
  expect(within(dialog).getByText(/Changed in another browser/)).toBeVisible();
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: 'Save my draft over this version',
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(posts[0].expectedRevision).toBe(1);
  expect(posts[1].expectedRevision).toBe(2);
  expect(posts[1].operationId).not.toBe(posts[0].operationId);
});
