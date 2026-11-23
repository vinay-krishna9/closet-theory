import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import {
  VisitorImportProvider,
  VisitorImportNotice,
  VisitorImportRecovery,
} from './visitor-import';
import {
  VisitorWardrobeProvider,
  useVisitorWardrobe,
} from '@/features/wardrobe/visitor-provider';
import { defaultGarment } from '@/features/wardrobe/model';
import {
  encodeWardrobe,
  visitorStorageKey,
  visitorImportStorageKey,
} from '@/features/wardrobe/visitor-storage';

const account = vi.hoisted(() => ({
  enabled: true,
  loaded: true,
  verified: true,
  userId: 'user_a' as string | null,
}));
vi.mock('./runtime', () => ({ useAccount: () => account }));
const shirt = { ...defaultGarment('tshirt'), id: 'shirt' };
const bodies: Record<string, unknown>[] = [];
beforeEach(() => {
  account.userId = 'user_a';
  account.verified = true;
  localStorage.clear();
  bodies.length = 0;
  localStorage.setItem(visitorStorageKey, encodeWardrobe([shirt]));
  vi.stubGlobal('navigator', {
    locks: {
      request: async (_name: string, callback: () => unknown) => callback(),
    },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});
function EditSource() {
  const wardrobe = useVisitorWardrobe();
  return (
    <button
      onClick={() =>
        wardrobe.dispatch({
          type: 'update',
          id: 'shirt',
          garment: { ...shirt, name: 'Edited during transfer' },
        })
      }
    >
      Edit source
    </button>
  );
}
function Tree({ editable = false }: { editable?: boolean }) {
  return (
    <VisitorWardrobeProvider>
      <VisitorImportProvider>
        <VisitorImportNotice />
        <VisitorImportRecovery />
        {editable && <EditSource />}
      </VisitorImportProvider>
    </VisitorWardrobeProvider>
  );
}
function success(body: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      ownerId: body.expectedOwner,
      operationId: body.operationId,
      imported: 1,
      matched: 0,
      mappings: [
        {
          selectionId: 'shirt',
          itemId: '22222222-2222-4222-8222-222222222222',
        },
      ],
    }),
    { status: 200 },
  );
}
it.each(['network', 'setup'])(
  'retains source after %s failure and retries the same operation without signup',
  async (failure) => {
    const transport = vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      if (bodies.length === 1) {
        if (failure === 'network') throw new Error('Lost response');
        return new Response(JSON.stringify({ code: 'import_setup_required' }), {
          status: 503,
        });
      }
      return success(body);
    });
    vi.stubGlobal('fetch', transport);
    render(<Tree />);
    await screen.findByRole('button', { name: 'Retry clothing transfer' });
    expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry clothing transfer' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        '1 visitor selection is saved',
      ),
    );
    expect(bodies[1]).toEqual(bodies[0]);
    expect(localStorage.getItem(visitorStorageKey)).toBeNull();
    expect(localStorage.getItem(visitorImportStorageKey)).toBeNull();
  },
);
it('waits for verification and keeps the durable selection snapshot', async () => {
  account.verified = false;
  const transport = vi.fn();
  vi.stubGlobal('fetch', transport);
  render(<Tree />);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Verify your email'),
  );
  expect(transport).not.toHaveBeenCalled();
  expect(
    JSON.parse(localStorage.getItem(visitorImportStorageKey)!).ownerId,
  ).toBeNull();
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
});
it('ignores a late success after the active account changes', async () => {
  let resolve!: (value: Response) => void;
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      bodies.push(JSON.parse(init.body));
      return new Promise<Response>((done) => {
        resolve = done;
      });
    }),
  );
  const { rerender } = render(<Tree />);
  await waitFor(() => expect(bodies).toHaveLength(1));
  account.userId = 'user_b';
  rerender(<Tree />);
  await screen.findByRole('button', { name: 'Retry clothing transfer' });
  await act(async () => resolve(success(bodies[0])));
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
  expect(screen.queryByText(/selection is saved/)).not.toBeInTheDocument();
  expect(bodies).toHaveLength(1);
});

it('retains an edited source until a new explicit retry and ignores an older response', async () => {
  const replies: ((response: Response) => void)[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      bodies.push(JSON.parse(init.body));
      return new Promise<Response>((resolve) => {
        replies.push(resolve);
      });
    }),
  );
  render(<Tree editable />);
  await waitFor(() => expect(bodies).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: 'Edit source' }));
  await waitFor(() => expect(bodies).toHaveLength(2));
  expect(bodies[1]).toEqual(bodies[0]);
  await act(async () => replies[1](success(bodies[1])));
  await screen.findByRole('button', { name: 'Retry clothing transfer' });
  expect(localStorage.getItem(visitorStorageKey)).toContain(
    'Edited during transfer',
  );
  await act(async () => replies[0](success(bodies[0])));
  expect(localStorage.getItem(visitorStorageKey)).toContain(
    'Edited during transfer',
  );
  expect(bodies).toHaveLength(2);
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry clothing transfer' }),
  );
  await waitFor(() => expect(bodies).toHaveLength(3));
  expect(bodies[2].operationId).not.toBe(bodies[0].operationId);
  expect(JSON.stringify(bodies[2].items)).toContain('Edited during transfer');
  await act(async () => replies[2](success(bodies[2])));
  await waitFor(() =>
    expect(localStorage.getItem(visitorStorageKey)).toBeNull(),
  );
});
it('retains corrupt transfer data and exposes the existing confirmed reset flow', async () => {
  localStorage.setItem(visitorImportStorageKey, '{broken');
  const transport = vi.fn();
  vi.stubGlobal('fetch', transport);
  render(<Tree />);
  await screen.findByRole('button', { name: 'Clear visitor wardrobe' });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'saved transfer record could not be read',
  );
  expect(transport).not.toHaveBeenCalled();
  expect(localStorage.getItem(visitorImportStorageKey)).toBe('{broken');
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
});

it('uses an explicit retry with a new batch after a permanent payload conflict, preserving source until saved', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      return bodies.length === 1
        ? new Response(JSON.stringify({ code: 'import_conflict' }), {
            status: 409,
          })
        : success(body);
    }),
  );
  render(<Tree />);
  await screen.findByRole('button', { name: 'Retry clothing transfer' });
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry clothing transfer' }),
  );
  await waitFor(() =>
    expect(localStorage.getItem(visitorStorageKey)).toBeNull(),
  );
  expect(bodies[1].items).toEqual(bodies[0].items);
  expect(bodies[1].operationId).not.toBe(bodies[0].operationId);
});
