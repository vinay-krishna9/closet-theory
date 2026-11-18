import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <main id="main-content" className="auth-page">
      <Suspense fallback={<p>Loading sign-in…</p>}>
        <SignIn />
      </Suspense>
    </main>
  );
}
