import { accountIdentity } from '@/features/account/server';
import { privateReply } from '@/features/account/profile-operation';
export async function GET() {
  const identity = await accountIdentity();
  return privateReply(identity ? 200 : 401, {
    authenticated: Boolean(identity),
    verified: Boolean(identity?.verified),
  });
}
