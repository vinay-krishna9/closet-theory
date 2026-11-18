import { describe, expect, it, vi } from 'vitest';
import { checkSupabase } from './check';

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://aghsipccmufzdtqwzxey.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fake_unit_test_key',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_fake_unit_test_key',
};
const identity = {
  userId: 'user_fixture_a',
  getToken: async () => 'fake-unit-token-a',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Supabase read probe with the real SDK and a fake transport', () => {
  it('denies anonymous users before retrieving credentials or contacting Supabase', async () => {
    const getToken = vi.fn();
    const transport = vi.fn();
    const response = await checkSupabase(
      { userId: null, getToken },
      {},
      transport,
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: 'sign_in_required' });
    expect(getToken).not.toHaveBeenCalled();
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([
    {
      ...environment,
      NEXT_PUBLIC_SUPABASE_URL: 'https://another-project.supabase.co',
    },
    {
      ...environment,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_forbidden',
    },
    { ...environment, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_forbidden' },
    {},
  ])(
    'refuses missing or unintended project/credential configuration',
    async (config) => {
      const transport = vi.fn();
      expect((await checkSupabase(identity, config, transport)).status).toBe(
        503,
      );
      expect(transport).not.toHaveBeenCalled();
    },
  );

  it('denies a missing session token without making a request', async () => {
    const transport = vi.fn();
    const response = await checkSupabase(
      { ...identity, getToken: async () => null },
      environment,
      transport,
    );
    expect(response.status).toBe(401);
    expect(transport).not.toHaveBeenCalled();
  });

  it('uses each caller token separately, reads only, and never returns row contents', async () => {
    const transport = vi.fn(async () => json([{ id: 'private-row-id' }]));
    const first = await checkSupabase(identity, environment, transport);
    const second = await checkSupabase(
      { userId: 'user_fixture_b', getToken: async () => 'fake-unit-token-b' },
      environment,
      transport,
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ code: 'read_succeeded' });
    expect(await second.json()).toEqual({ code: 'read_succeeded' });
    expect(first.headers.get('Cache-Control')).toBe('private, no-store');
    for (const [index, token] of [
      'fake-unit-token-a',
      'fake-unit-token-b',
    ].entries()) {
      const [url, options] = transport.mock.calls[index] as unknown as [
        string,
        RequestInit,
      ];
      expect(String(url)).toContain(
        '/rest/v1/spike_access_items?select=id&limit=1',
      );
      expect(options.method).toBe('GET');
      expect(options.cache).toBe('no-store');
      expect(new Headers(options.headers).get('Authorization')).toBe(
        `Bearer ${token}`,
      );
      expect(new Headers(options.headers).get('apikey')).toBe(
        environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      );
    }
  });

  it.each([
    [401, 'bad_jwt', 403, 'supabase_denied'],
    [403, '42501', 403, 'supabase_denied'],
    [404, 'PGRST205', 409, 'schema_required'],
    [500, 'unknown', 502, 'connection_failed'],
  ])(
    'sanitizes upstream status %s',
    async (status, code, expectedStatus, expectedCode) => {
      const transport = vi.fn(async () =>
        json({ code, message: 'sensitive upstream detail' }, Number(status)),
      );
      const response = await checkSupabase(identity, environment, transport);
      expect(response.status).toBe(expectedStatus);
      expect(await response.json()).toEqual({ code: expectedCode });
    },
  );

  it('contains token retrieval and network failures', async () => {
    const transport = vi.fn(async () => {
      throw new Error('sensitive network detail');
    });
    expect((await checkSupabase(identity, environment, transport)).status).toBe(
      502,
    );
    expect(
      (
        await checkSupabase(
          {
            ...identity,
            getToken: async () => {
              throw new Error('sensitive token detail');
            },
          },
          environment,
          transport,
        )
      ).status,
    ).toBe(502);
  });
});
