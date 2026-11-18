import { auth } from '@clerk/nextjs/server';
import { checkSupabase } from './check';

export async function GET() {
  const identity = await auth();
  return checkSupabase(identity, process.env);
}
