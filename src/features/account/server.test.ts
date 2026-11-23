import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const calls = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => calls);
vi.mock('./config', () => ({ authConfigured: () => true }));
import { accountIdentity } from './server';

beforeEach(() => {
  vi.clearAllMocks();
});
describe('verified server identity', () => {
  it('contains authentication errors and never accepts another user object', async () => {
    calls.auth.mockRejectedValueOnce(new Error('invalid token'));
    expect(await accountIdentity()).toBeNull();
    calls.auth.mockResolvedValueOnce({ userId: 'user_a' });
    calls.currentUser.mockResolvedValueOnce({ id: 'user_b' });
    expect(await accountIdentity()).toBeNull();
  });
  it('requires actual primary email verification independently of the token claim', async () => {
    calls.auth.mockResolvedValue({
      userId: 'user_a',
      sessionClaims: { email_verified: true },
      getToken: async () => 'test-token',
    });
    calls.currentUser.mockResolvedValue({
      id: 'user_a',
      primaryEmailAddressId: 'email_a',
      emailAddresses: [
        { id: 'email_a', verification: { status: 'unverified' } },
        { id: 'email_b', verification: { status: 'verified' } },
      ],
    });
    expect((await accountIdentity())?.verified).toBe(false);
    calls.currentUser.mockResolvedValue({
      id: 'user_a',
      primaryEmailAddressId: 'email_a',
      emailAddresses: [{ id: 'email_a', verification: { status: 'verified' } }],
    });
    expect((await accountIdentity())?.verified).toBe(true);
  });
});
