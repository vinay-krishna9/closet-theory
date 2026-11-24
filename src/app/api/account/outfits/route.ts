import { accountIdentity } from '@/features/account/server';
import { accountDatabase } from '@/lib/supabase/server';
import { accountOutfitsOperation } from '@/features/outfits/account-operation';

export async function POST(request: Request) {
  return accountOutfitsOperation(
    request,
    await accountIdentity(),
    accountDatabase,
  );
}
