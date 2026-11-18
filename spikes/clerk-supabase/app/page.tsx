import { SessionCheck } from './session-check';
import { SupabaseCheck } from './supabase-check';

export default function Home() {
  return (
    <main id="main-content">
      <p>Closet Theory · isolated development harness</p>
      <h1>Clerk development check</h1>
      <p>
        Sign in to test the server session, then sign out and check that access
        is denied.
      </p>
      <p>This test does not import your visitor wardrobe or save clothing.</p>
      <SessionCheck />
      <SupabaseCheck />
    </main>
  );
}
