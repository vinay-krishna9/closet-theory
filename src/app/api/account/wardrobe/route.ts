import { accountIdentity } from '@/features/account/server';
import { accountDatabase } from '@/lib/supabase/server';
import { wardrobeOperation } from '@/features/wardrobe/account-operation';
export async function GET(request: Request) {
  return wardrobeOperation(request, await accountIdentity(), accountDatabase);
}
export async function POST(request: Request) {
  return wardrobeOperation(request, await accountIdentity(), accountDatabase);
}
