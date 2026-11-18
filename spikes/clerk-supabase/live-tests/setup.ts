import { randomUUID } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
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
  await mkdir(path.resolve(process.cwd(), 'spikes/clerk-supabase/artifacts'), {
    recursive: true,
  });
  const instance = await clerkApi('instance');
  if (
    instance.id !== 'ins_3MH45Fp6c9tF4VtIiT4wVqyZhSs' ||
    instance.environment_type !== 'development'
  )
    throw new Error('Unexpected Clerk development instance.');
  let exists = false;
  try {
    await access(journalPath);
    exists = true;
  } catch {
    /* No prior run. */
  }
  if (exists)
    throw new Error(
      'A prior fixture journal exists. Run the approved cleanup command before creating new fixtures.',
    );
  await clerkSetup({ debug: false });
  const journal: Journal = { runId: randomUUID(), users: [] };
  await saveJournal(journal);
  try {
    for (const letter of ['A', 'B']) {
      const email = `spike02-${letter.toLowerCase()}-${journal.runId}+clerk_test@example.com`;
      const user = await clerkApi('users', 'POST', {
        email_address: [email],
        skip_password_requirement: true,
        private_metadata: { spike_run: journal.runId },
      });
      journal.users.push({
        id: user.id,
        email,
        rowId: randomUUID(),
        label: `SPIKE-02 ${letter}`,
      });
      await saveJournal(journal);
    }
    console.log(
      'Created two dedicated development test accounts. No passwords or tokens saved.',
    );
  } catch {
    await cleanupFixtures();
    throw new Error(
      'Could not prepare development fixtures; attempted cleanup.',
    );
  }
}
