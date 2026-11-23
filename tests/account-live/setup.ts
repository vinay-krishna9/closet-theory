import { access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { clerkSetup } from '@clerk/testing/playwright';
import { expect } from '@playwright/test';
import {
  clerkApi,
  cleanupFixtures,
  directClient,
  journalPath,
  loadConfiguration,
  saveJournal,
  type Journal,
} from './fixtures';

export default async function setup() {
  loadConfiguration();
  const instance = await clerkApi('instance');
  if (
    instance.id !== 'ins_3MH45Fp6c9tF4VtIiT4wVqyZhSs' ||
    instance.environment_type !== 'development'
  )
    throw new Error('Unexpected development instance.');
  let unfinished = false;
  try {
    await access(journalPath);
    unfinished = true;
  } catch {
    /* No prior run. */
  }
  if (unfinished)
    throw new Error(
      'Unfinished account fixture journal exists. Clean it up before another run.',
    );
  await clerkSetup({ debug: false });
  const journal: Journal = {
    runId: randomUUID(),
    dataStarted: false,
    users: [],
  };
  await saveJournal(journal);
  try {
    for (const letter of ['A', 'B']) {
      const email = `account01-${letter.toLowerCase()}-${journal.runId}+clerk_test@example.com`;
      const user = await clerkApi('users', 'POST', {
        email_address: [email],
        ...(letter === 'B'
          ? { email_address_identification_status: ['reserved'] }
          : {}),
        skip_password_requirement: true,
        private_metadata: { account_test_run: journal.runId },
      });
      journal.users.push({
        id: user.id,
        email,
        rowId: randomUUID(),
        label: `ACCOUNT-01 ${letter}`,
      });
      await saveJournal(journal);
      if (letter === 'B') {
        try {
          const unverifiedSession = await clerkApi('sessions', 'POST', {
            user_id: user.id,
          });
          const unverified = await clerkApi(
            `sessions/${unverifiedSession.id}/tokens`,
            'POST',
          );
          const claims = JSON.parse(
            Buffer.from(unverified.jwt.split('.')[1], 'base64url').toString(),
          );
          expect(claims.email_verified).toBe(false);
          // No browser cookies can mask this signed, unverified identity.
          for (const method of ['GET', 'PATCH']) {
            const response = await fetch(
              'http://localhost:4175/api/account/profile',
              {
                method,
                headers: {
                  Authorization: `Bearer ${unverified.jwt}`,
                  'Content-Type': 'application/json',
                },
                ...(method === 'PATCH'
                  ? { body: JSON.stringify({ timezone: 'UTC' }) }
                  : {}),
                signal: AbortSignal.timeout(10000),
              },
            );
            // Clerk can classify a reserved, pending-verification session as
            // unauthenticated before the app's verified-identity check runs.
            expect([401, 403]).toContain(response.status);
          }
          const db = directClient(unverified.jwt);
          const read = await db
            .from('account_profiles')
            .select('owner_id')
            .retry(false);
          expect(read.data).toEqual([]);
          journal.dataStarted = true;
          await saveJournal(journal);
          const write = await db
            .from('account_profiles')
            .insert({ timezone: 'UTC' })
            .retry(false);
          expect(write.error?.code).toBe('42501');
        } finally {
          await clerkApi(
            `email_addresses/${user.primary_email_address_id}`,
            'PATCH',
            {
              verified: true,
            },
          );
        }
      }
      const session = await clerkApi('sessions', 'POST', { user_id: user.id });
      const token = await clerkApi(`sessions/${session.id}/tokens`, 'POST');
      const payload = JSON.parse(
        Buffer.from(token.jwt.split('.')[1], 'base64url').toString(),
      );
      if (payload.email_verified !== true)
        throw new Error('Clerk verified-email claim is not configured.');
    }
    journal.dataStarted = true;
    await saveJournal(journal);
  } catch (error) {
    await cleanupFixtures();
    throw error;
  }
}
