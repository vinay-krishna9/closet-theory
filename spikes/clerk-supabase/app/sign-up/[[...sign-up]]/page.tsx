import { SignUp } from '@clerk/nextjs';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <main id="main-content" className="auth-page">
      <Suspense fallback={<p>Loading sign-up…</p>}>
        <SignUp />
      </Suspense>
    </main>
  );
}
