import { accountIdentity } from '@/features/account/server';
import { importOperation } from '@/features/account/import-operation';
import { accountDatabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  return importOperation(request, await accountIdentity(), accountDatabase);
}
