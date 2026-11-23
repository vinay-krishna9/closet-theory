import { access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { clerkSetup } from '@clerk/testing/playwright';
import {
  clerkApi,
  cleanupFixtures,
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
  } catch {
    await cleanupFixtures();
    throw new Error(
      'Account fixture setup failed; cleanup attempted. Verify approved service configuration.',
    );
  }
}
