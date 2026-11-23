import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { authConfigured } from './config';

export type Identity = {
  userId: string;
  verified: boolean;
  databaseVerified: boolean;
  getToken: () => Promise<string | null>;
};
export async function accountIdentity(): Promise<Identity | null> {
  if (!authConfigured()) return null;
  try {
    const session = await auth();
    if (!session.userId) return null;
    const user = await currentUser();
    if (!user || user.id !== session.userId) return null;
    const email = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    return {
      userId: session.userId,
      verified: email?.verification?.status === 'verified',
      databaseVerified:
        (session.sessionClaims as { email_verified?: unknown } | null)
          ?.email_verified === true,
      getToken: () => session.getToken(),
    };
  } catch {
    return null;
  }
}
