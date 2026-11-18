import { auth } from '@clerk/nextjs/server';
import { operateItems } from './operations';

async function handle(request: Request) {
  return operateItems(request, await auth(), process.env);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
