import { cleanupFixtures, loadConfiguration } from './fixtures.ts';
loadConfiguration();
try {
  await cleanupFixtures();
} catch {
  console.error('Account fixture cleanup incomplete; journal retained.');
  process.exitCode = 1;
}
