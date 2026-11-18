import { describe, expect, it, vi } from 'vitest';
import { operateItems } from './operations';

const env = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://aghsipccmufzdtqwzxey.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fake',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_fake',
};
const identity = { userId: 'user_a', getToken: async () => 'fake_test_token' };
const id = '11111111-1111-4111-8111-111111111111';
const request = (method: string, data?: unknown) =>
  new Request('http://localhost:4184/api/items', {
    method,
    ...(data
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      : {}),
  });

describe('server item boundary', () => {
  it.each(['GET', 'POST', 'PATCH', 'DELETE'])(
    'requires verified identity for %s',
    async (method) => {
      const transport = vi.fn();
      expect(
        (
          await operateItems(
            request(method),
            { ...identity, userId: null },
            env,
            transport,
          )
        ).status,
      ).toBe(401);
      expect(transport).not.toHaveBeenCalled();
    },
  );
  it.each(['POST', 'PATCH'])(
    'rejects submitted ownership on %s before contacting the database',
    async (method) => {
      const transport = vi.fn();
      expect(
        (
          await operateItems(
            request(method, { id, label: 'SPIKE-02 A', owner_id: 'user_b' }),
            identity,
            env,
            transport,
          )
        ).status,
      ).toBe(400);
      expect(transport).not.toHaveBeenCalled();
    },
  );
  it('derives ownership on insert and keeps output limited to requested fixture fields', async () => {
    const transport = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id, label: 'SPIKE-02 A' }]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const response = await operateItems(
      request('POST', { id, label: 'SPIKE-02 A' }),
      identity,
      env,
      transport,
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    const options = (
      transport.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(JSON.parse(options.body as string)).toEqual({
      id,
      label: 'SPIKE-02 A',
      owner_id: 'user_a',
    });
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer fake_test_token',
    );
  });
  it.each(['PATCH', 'DELETE'])(
    'filters %s by verified owner and ID and reports inaccessible rows as missing',
    async (method) => {
      const transport = vi.fn(
        async () =>
          new Response('[]', {
            headers: { 'Content-Type': 'application/json' },
          }),
      );
      const response = await operateItems(
        request(method, { id, label: 'SPIKE-02 A' }),
        identity,
        env,
        transport,
      );
      expect(response.status).toBe(404);
      const url = new URL((transport.mock.calls[0] as unknown as [string])[0]);
      expect(url.searchParams.get('owner_id')).toBe('eq.user_a');
      expect(url.searchParams.get('id')).toBe(`eq.${id}`);
      expect(url.searchParams.get('label')).toBe('in.(SPIKE-02 A,SPIKE-02 B)');
    },
  );
  it('rejects cross-origin writes, malformed input and unintended projects', async () => {
    const transport = vi.fn();
    const crossOrigin = request('POST', { id, label: 'SPIKE-02 A' });
    crossOrigin.headers.set('Origin', 'https://unrelated.example');
    expect(
      (await operateItems(crossOrigin, identity, env, transport)).status,
    ).toBe(403);
    expect(
      (
        await operateItems(
          request('POST', { id: 'bad', label: 'SPIKE-02 A' }),
          identity,
          env,
          transport,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await operateItems(
          request('GET'),
          identity,
          { ...env, NEXT_PUBLIC_SUPABASE_URL: 'https://unrelated.example' },
          transport,
        )
      ).status,
    ).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
});
