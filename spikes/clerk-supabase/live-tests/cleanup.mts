import { cleanupFixtures, loadConfiguration } from './fixtures.ts';

loadConfiguration();
try {
  await cleanupFixtures();
} catch {
  console.error(
    'Fixture cleanup did not complete. Journal retained; investigate before retrying.',
  );
  process.exitCode = 1;
}
