import { clerkMiddleware } from '@clerk/nextjs/server';
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from 'next/server';
import { authConfigured } from '@/features/account/config';

const middleware = clerkMiddleware({
  authorizedParties: [process.env.APP_ORIGIN ?? 'http://localhost:3000'],
});
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return authConfigured() ? middleware(request, event) : NextResponse.next();
}
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
