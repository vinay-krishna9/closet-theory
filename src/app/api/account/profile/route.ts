import { accountIdentity } from '@/features/account/server';
import { profileOperation } from '@/features/account/profile-operation';
import { accountDatabase } from '@/lib/supabase/server';
async function handle(request: Request) {
  return profileOperation(request, await accountIdentity(), accountDatabase);
}
export { handle as GET, handle as POST, handle as PATCH };
