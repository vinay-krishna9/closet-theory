import { Suspense } from 'react';
import { AuthScreen } from '@/features/account/auth-screen';
export default function Page() {
  return (
    <Suspense fallback={<p>Loading signup…</p>}>
      <AuthScreen signup />
    </Suspense>
  );
}
