import { cleanupFixtures, loadConfiguration } from './fixtures';
export default async function teardown() {
  loadConfiguration();
  await cleanupFixtures();
}
