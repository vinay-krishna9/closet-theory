# Clerk / Supabase access spike

Issue #4 uses an isolated Next.js npm workspace. Its Clerk development application is **Closet Theory**, selected in the user's Dashboard. The user added Clerk as a Supabase third-party provider and configured the development project URL/publishable key locally. Database setup is still pending. This harness does not enable accounts, import wardrobes or change the root visitor application.

## Clerk setup

Use Node 22.18+ within 22.x and npm 10+. Install from the repository root using `npm.cmd ci`; all workspace dependencies use the root lockfile. Clerk SDK 7.10.2 supports the installed Next.js 16.4.6 and React 19.3.1 versions. Next.js 16 uses `proxy.ts` and async `auth()`.

The authenticated Clerk CLI initialized this workspace with the selected application. Local development keys live in ignored `spikes/clerk-supabase/.env.local`. Never print or commit that file. `.env.example` documents names with placeholders. Clerk link metadata is ignored too. No production instance was configured.

If development keys need restoring, authenticate from your own terminal, then run these from `spikes/clerk-supabase/`:

```powershell
npx.cmd -y clerk@latest auth login
npx.cmd -y clerk@latest link --app app_3MH45DkMIqToBgSDYyXDKJGJhfo
npx.cmd -y clerk@latest env pull
npx.cmd -y clerk@latest doctor
```

Confirm you are targeting this development application before restoring keys. Do not use accountless setup or production keys here.

## Run and check

From the repository root:

```powershell
npm.cmd run spike:auth:dev
```

Open <http://localhost:4184>. Use this same hostname throughout authentication. Next.js normalizes loopback URLs in its proxy; binding to `localhost` avoids an external rewrite to a different loopback hostname. In the browser:

1. Confirm **Signed out**. Click **Check server session** and expect **Access denied**.
2. Open **Sign in** or **Create account**. Confirm email and Google options render. Use a designated development account.
3. After authentication, confirm **Signed in** and a profile control. Click **Check server session** and expect **Server session verified**.
4. Refresh and check again. Authentication should survive the refresh.
5. Click **Sign out**. Check the session again and expect **Access denied**. Open `/api/session` directly and expect `{"authenticated":false}` with HTTP 401.
6. Repeat at a phone width; use keyboard Tab/Enter on desktop and check visible focus.

Stop the development server before automated checks. Leave port 4184 free:

```powershell
npm.cmd run spike:auth:build
npm.cmd run spike:auth:test:unit
npm.cmd run spike:auth:test
npm.cmd run typecheck --workspace @closet-theory/clerk-supabase-spike
```

The Playwright suite starts its own production server and refuses reuse. It checks anonymous server denial, no-store responses, signed-out controls, email/Google forms and responsive layout in desktop/mobile Chromium. It creates no users and saves no credentials, browser auth state, traces, videos or screenshots. Complete successful authentication in your own browser; CLI account authentication and app-user authentication are separate.

`/api/session` verifies Clerk on the server and returns only an authenticated boolean, never a user identifier or token. Responses are private and not stored in HTTP caches. This is an identity probe, not proof of Supabase row/storage authorization. Issue #4 stays open until the remaining matrix in [the execution plan](../../docs/plans/SPIKE-02-plan.md) is verified.

## Supabase connection check and proposed SQL

`@supabase/supabase-js` 2.119.0 requires Node 22+ and is pinned in this workspace. The probe targets only development project `aghsipccmufzdtqwzxey` and requires a Clerk development publishable key. The URL and publishable key use the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` names from the Dashboard. Actual values remain in the ignored local environment file. No elevated Supabase credential is used.

After signing in at <http://localhost:4184>, click **Check Supabase connection**. The server obtains the current Clerk session token and creates a fresh token-scoped Supabase client. It performs one read of at most one ID from `spike_access_items`, returns no row contents and disables caching/session persistence. Failed requests have a 10-second network timeout and no automatic SDK retries. Configuration, missing schema, rejected credentials and connection failure have separate sanitized messages. Account switching resets the displayed probe result.

Until the migration is applied, the expected signed-in result is **Supabase needs the test-table migration**, if Supabase accepts the token and reports that table as missing. Signed-out requests return HTTP 401. A successful read later proves only this request succeeded, not cross-account isolation.

The proposed [versioned migration](migrations/202611180001_access_probe.sql) is **unapplied and requires approval before execution**. It creates only `public.spike_access_items` with a UUID ID, Clerk text owner, short sample label and creation timestamp, plus an owner index. It enables/forces RLS, revokes anonymous table access, and grants authenticated CRUD subject to owner-only policies. The update policy checks the old and new owner so a caller cannot transfer a row to another user. It creates no fixtures or storage bucket and does not alter existing tables or rows. It intentionally fails if the table already exists rather than silently accepting a different schema.

Review and confirm this is an isolated development project before running it. The schema has not yet been checked against a live Postgres instance. Applying SQL, adding fixtures, testing both accounts and private media are subsequent steps with their own scoped approval.

## Actual check results

Clerk CLI diagnostics confirmed the selected development application and local development keys. After the Supabase probe addition, harness build/type checking and explicit lint passed, with ten desktop/mobile browser checks and seventeen unit/component tests. The root check passed all 145 existing tests, formatting, lint and types; the root production build passed. Public home/sign-in screens and the new connection panel were visually reviewed at desktop/mobile sizes, with keyboard skip-link focus and reduced motion checked. Successful user sign-in/sign-out, live signed-in Supabase acceptance, SQL execution, two-account boundaries and expired-token checks remain pending until exercised with designated development accounts.
