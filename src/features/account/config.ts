export function authConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    env.APP_AUTH_MODE !== 'visitor' &&
    Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY)
  );
}
