import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  return Response.json(
    { authenticated: Boolean(userId) },
    {
      status: userId ? 200 : 401,
      headers: {
        'Cache-Control': 'private, no-store',
        Vary: 'Cookie, Authorization',
      },
    },
  );
}
