import { describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { profileOperation, validTimezone } from './profile-operation';

const owner = {
  userId: 'user_a',
  verified: true,
  databaseVerified: true,
  getToken: async () => 'fixture-token',
};
const req = (body?: unknown) =>
  new Request(
    'http://localhost:3000/api/account/profile',
    body
      ? {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
          body: JSON.stringify(body),
        }
      : {},
  );
const unused = () => {
  throw new Error('Database must not be called');
};
function database(transport: typeof fetch) {
  return () =>
    createClient('https://fixture.supabase.co', 'sb_publishable_test', {
      accessToken: async () => 'fixture-token',
      global: { fetch: transport },
    });
}

describe('private profile boundary', () => {
  it('initializes a profile without overwriting a concurrently saved timezone', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('[]', { headers: { 'Content-Type': 'application/json' } }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ timezone: 'UTC' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const request = new Request('http://localhost:3000/api/account/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ timezone: 'Europe/Berlin' }),
    });
    const result = await profileOperation(request, owner, database(transport));
    expect(await result.json()).toEqual({ profile: { timezone: 'UTC' } });
    expect(
      new Headers(
        (transport.mock.calls[0] as unknown as [string, RequestInit])[1]
          .headers,
      ).get('Prefer'),
    ).toContain('resolution=ignore-duplicates');
  });
  it('denies anonymous, unverified and missing verification claims before database access', async () => {
    expect((await profileOperation(req(), null, unused)).status).toBe(401);
    expect(
      (await profileOperation(req(), { ...owner, verified: false }, unused))
        .status,
    ).toBe(403);
    expect(
      (
        await profileOperation(
          req(),
          { ...owner, databaseVerified: false },
          unused,
        )
      ).status,
    ).toBe(503);
    expect(
      (
        await profileOperation(
          req(),
          { ...owner, getToken: async () => null },
          unused,
        )
      ).status,
    ).toBe(401);
  });
  it('rejects submitted owners, invalid timezones and cross-origin mutation', async () => {
    expect(
      (
        await profileOperation(
          req({ timezone: 'Europe/Berlin', owner_id: 'user_b' }),
          owner,
          unused,
        )
      ).status,
    ).toBe(400);
    expect(
      (await profileOperation(req({ timezone: 'Invalid/Zone' }), owner, unused))
        .status,
    ).toBe(400);
    const request = req({ timezone: 'UTC' });
    request.headers.set('Origin', 'https://other.example');
    expect((await profileOperation(request, owner, unused)).status).toBe(403);
    expect(validTimezone('Europe/Berlin')).toBe(true);
  });
  it('filters reads by verified owner and keeps responses private', async () => {
    const transport = vi.fn(
      async () =>
        new Response(JSON.stringify({ timezone: 'Europe/Berlin' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const response = await profileOperation(req(), owner, database(transport));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      profile: { timezone: 'Europe/Berlin' },
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(
      new URL(
        String((transport.mock.calls[0] as unknown as [string])[0]),
      ).searchParams.get('owner_id'),
    ).toBe('eq.user_a');
  });
  it('uses the verified owner when saving and sanitizes upstream failures', async () => {
    const transport = vi.fn(
      async () =>
        new Response(JSON.stringify({ timezone: 'UTC' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    expect(
      (
        await profileOperation(
          req({ timezone: 'UTC' }),
          owner,
          database(transport),
        )
      ).status,
    ).toBe(200);
    const options = (
      transport.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(JSON.parse(options.body as string)).toEqual({
      owner_id: 'user_a',
      timezone: 'UTC',
    });
    const failure = async () =>
      new Response(
        JSON.stringify({
          code: 'PGRST205',
          message: 'private database detail',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    const response = await profileOperation(req(), owner, database(failure));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: 'schema_required' });
  });
});
