# SPIKE-02 — Clerk and private Supabase access execution plan

Status Clerk harness, Supabase read probe and initial test table set up, 18 November 2026. The user reported successful migration execution and a signed-in Supabase read. Cross-account, expired-token and private-media verification remain pending.

Tracked in [issue #4](https://github.com/vinay-krishna9/closet-theory/issues/4). The development plan schedules this spike after OUTFITS-01 (#10) and before ACCOUNT-01 (#11). The visitor journey is merged. This spike establishes the identity/data access boundary needed for private account features. The user requested one service at a time, supplied the selected Clerk application's setup prompt and completed CLI authentication. The current implementation covers Clerk and a Supabase read probe in [the isolated harness](../../spikes/clerk-supabase/README.md).

Follow [architecture](../technical/architecture.md), [product decisions](../product/product-decisions.md), [development plan](development-plan.md) and [AGENTS.md](../../AGENTS.md). Initial inspection found no installed Clerk/Supabase SDK. Clerk is now linked to the user-selected Closet Theory development application, with SDK 7.10.2 in an npm workspace and ignored local keys. The user created Supabase project `aghsipccmufzdtqwzxey`, added Clerk as its third-party provider and configured its URL/publishable key locally. Code/SQL preparation is approved; running SQL remains subject to approval and confirmation that this is the isolated development target.

## Change

### Migration execution record — 18 November 2026

- The user explicitly confirmed project `aghsipccmufzdtqwzxey` is a new test project and authorized the prepared migration. The dashboard project name was observed as `closet-theory-dev`. Its default `main / Production` label does not change the user's designation of this isolated project for testing.
- Computer Use could read the dashboard but stopped before SQL execution because it could not reliably determine the browser URL. No SQL was submitted by the agent.
- The user ran `spikes/clerk-supabase/migrations/202611180001_access_probe.sql` manually in the project SQL Editor and reported **Success. No rows returned**. Record this as user-reported application of the migration, not an independently inspected database catalog or CLI migration-history entry. Keep the applied SQL unchanged; its opening review-only comment describes its preparation state.
- The user then signed in to the harness, clicked **Check Supabase connection** and reported **Supabase accepted the read request. Cross-account isolation still needs testing.** This establishes a user-observed successful signed-in probe. No row contents or credentials were collected.
- This check does not prove owner CRUD, both directions of cross-account denial, anonymous access at the direct database boundary, expired/altered tokens, sign-out/cache behavior or private-media protection. Those checks remain pending, and issue #4 stays incomplete.
- Completed implementation checkpoints: `465c05a` for Clerk and `24d2f02` for the Supabase read probe and prepared SQL. This execution record is a separate documentation checkpoint before the next implementation subtask. No push or merge is authorized by this update.

### Clerk checkpoint — 18 November 2026

- Selected existing development application linked through Clerk CLI; ignored local keys pulled without printing values. No new application, production instance or global agent skills were created.
- Isolated npm workspace uses pinned `@clerk/nextjs` 7.10.2, shared root lockfile, provider, TypeScript auth routes and `proxy.ts`. The server session endpoint returns only an authenticated boolean with HTTP 401 for anonymous requests and private/no-store caching.
- CLI diagnostics passed. Harness build/type checking and explicit source lint passed. Six desktop/mobile Chromium checks and three focused component tests passed. The root check passed all 145 existing tests, formatting, lint and type checks; the root production build also passed.
- Reviewed signed-out home and sign-in screenshots at 1280px and 390px. Checked keyboard skip-link focus with reduced motion enabled. A Next.js loopback rewrite failure was resolved by binding and navigating consistently through `localhost:4184`.
- The local harness is ready for the user to sign in, verify the server session, refresh, sign out and verify denial. CLI login alone does not prove app-user authentication. No test users were created. Real successful sign-in/sign-out, expired-token denial and cross-account/data/media checks remain unverified.
- Clerk checkpoint committed as `465c05a`. No push or merge has occurred. Issue #4 remains incomplete.

### Supabase connection checkpoint — 18 November 2026

- Approved scope: install the official SDK, add a read-only connection probe and prepare SQL for review. Installed `@supabase/supabase-js` 2.119.0, compatible with the project's Node 22 runtime. No `@clerk/testing` or new test users were added.
- Added `/api/supabase` with server-verified Clerk identity, a per-request token-scoped client, pinned development project, development/publishable key checks, sanitized statuses, no-store responses and a bounded read. The browser displays separate sign-in/configuration/schema/denial/failure states and resets the result on account switching.
- Prepared `spikes/clerk-supabase/migrations/202611180001_access_probe.sql`: one probe table and owner index, forced RLS, authenticated owner-only CRUD and revoked anonymous table access. No fixtures, existing-table modifications or private bucket are included. SQL remains unapplied; its live Postgres behavior has not been verified.
- Seventeen unit/component tests passed using the real SDK with a fake transport. These verify token separation, read-only requests, configuration refusal, sanitized errors and UI recovery. They do not establish real token acceptance, expiry or database policy enforcement.
- All ten desktop/mobile Chromium checks passed, including anonymous probe denial and the visible sign-in prompt. Harness build/type checks, explicit source lint and formatting passed. Root checks passed all 145 existing tests, lint, types and formatting; the root production build passed. Reviewed the new signed-out panel at 1280px and 390px with reduced motion. Live signed-in Supabase acceptance remains unverified until the user runs the check.

- Build a small isolated Next.js harness that signs in two designated development users and exercises protected server operations against test rows and a private storage bucket.
- Prove each user can access their own records/media, with anonymous, expired-token, forged-owner and cross-account requests denied at the server and Supabase boundaries.
- Verify private-image responses and account switching avoid exposing one user's image through another session's cache.
- Record setup, reproducible results and limitations, then recommend whether ACCOUNT-01 can use the tested approach.

## Proposed implementation

### 1. Confirm the isolated service setup

- Use a Clerk development instance and a dedicated Supabase development/test project, with two designated test users and public sample assets. Record the approved project reference and local callback origin before service changes or live tests.
- Prefer existing isolated projects when available. If new projects are needed, present the target names, ownership, provider plan/costs and proposed settings for explicit authorization. Confirm current service limits during setup.
- Enable Clerk's native Supabase integration and register the development Clerk issuer with Supabase. Current provider guidance uses Clerk session tokens directly through the SDK's `accessToken` callback. This is the integration to validate. [Clerk integration guide](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- Clerk remains the identity provider. Use the JWT subject as a text owner identifier and RLS claims through `auth.jwt()`. Native third-party integration covers database and Storage authorization. [Supabase Clerk guide](https://supabase.com/docs/guides/auth/third-party/clerk)
- Setup authorization must name the development target and cover applying the probe migrations, creating the private bucket and creating/removing the designated fixtures. Production remains outside the test target.

### 2. Add the isolated harness and supported SDKs

- Work on `spike/4-clerk-supabase-access` after plan approval. Put the harness, its versioned probe migrations, test configuration and README under `spikes/clerk-supabase/`. Keep the visitor application credential-free through its normal commands.
- Reuse the installed Next.js, React, TypeScript, npm and Playwright tooling, with dedicated spike dev/build/test commands. Validate the harness directory, middleware/proxy convention and SDK peer dependencies against Next.js 16.4.6, React 19.3.1 and Node 22.18 before integration. Use the root npm lockfile.
- Proposed runtime additions are `@clerk/nextjs` for the actual Next.js identity/server boundary and `@supabase/supabase-js` for token-scoped data/storage calls. Pin compatible versions after inspection. These SDKs exercise the provider-supported integration required by this spike.
- Proposed development addition is `@clerk/testing` for Clerk's Playwright setup and sign-in helpers with development-instance testing tokens. It allows repeatable auth journeys with the existing test runner. Its setup requires development keys and configured test users. [Clerk Playwright guide](https://clerk.com/docs/guides/development/testing/playwright/overview)
- Use a fixed loopback port such as 4184 for the harness and a separate test configuration. Check the port before starting and keep server reuse disabled. Root visitor CI continues using its existing isolated, credential-free checks. Live-service spike tests run explicitly against the approved target.
- Document placeholder environment names in a spike example file. Expected names include `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` for test setup, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and an approved `SPIKE_SUPABASE_PROJECT_REF`. Confirm the SDK's actual requirements during setup. Keep actual values in ignored local configuration or an authorized secret store.

### 3. Prove the server and database boundaries

- Add a minimal probe UI and Route Handlers for the test operations. Verify the Clerk identity inside every protected operation and derive its owner from the verified session. Keep runtime credentials and token retrieval on the server.
- Create a Supabase client per server request with the publishable key and current Clerk session token. Keep authenticated queries and private responses out of shared caches. Administrative setup credentials, if needed for applying a migration, remain isolated from request clients and browser bundles.
- Create versioned probe tables for an owner-scoped item and its media metadata. Use text owner IDs, RLS policies for select/insert/update/delete and an owner-aware foreign key between media and item. The fixture schema should permit proving ownership without implementing the full account wardrobe.
- Exercise direct Supabase requests as well as the Next.js routes. This checks that RLS/relationship constraints still deny access when the UI/server route is bypassed.
- Check both directions, A against B and B against A. Include record enumeration, guessed IDs, owner substitution on insert/update and a cross-owner media/item relationship. Assert both the denial response and absence of the unauthorized write.

### 4. Prove private media delivery and cache behavior

- Create a private test bucket and token-based policies for owner-prefixed paths. Use public catalog/sample images as fixtures, with server-side ID/path mapping and validation. Test owner upload/read/delete plus cross-owner listing, download, overwrite, deletion and signed-URL issuance denial.
- Proposed app delivery uses an authenticated server endpoint that reads Storage with the requesting Clerk token and streams the image with `Cache-Control: private, no-store`. Validate authorization again for each request. This keeps access tied to the current session at the delivery boundary.
- Test the same image endpoint after A signs out and B signs in in the same browser context. Check direct requests, image rendering, refresh and back navigation. Document any retained browser pixels or cache behavior requiring account UI cleanup before private features ship.
- Investigate signed URLs only as a documented alternative. A valid signed URL grants time-limited access to its holder, so session switching alone must not be reported as revoking it. Record expiry and caching observations if tested. [Supabase private downloads](https://supabase.com/docs/guides/storage/serving/downloads)
- Disable sensitive auth/media traces and request-body/header logging in this suite. Keep passwords, session tokens, signed URLs, browser auth state and service keys outside published artifacts. Report sanitized assertions and public sample screenshots only.

## Verification matrix

| Actor or condition                            | Required observation                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Anonymous caller                              | Protected server operations and direct private data/media access denied                               |
| User A / user B acting as owner               | Own row CRUD and sample-media operations succeed                                                      |
| A requests B's data, then B requests A's data | No rows or bytes disclosed, and no unauthorized mutation succeeds                                     |
| Forged owner or cross-owner relationship      | Database/storage policies or owner-safe constraints reject the operation                              |
| Expired real Clerk session token              | Server and direct Supabase requests deny access after actual expiry                                   |
| Invalid or altered token                      | Authentication fails without accepting client-supplied identity claims                                |
| A signs out, then B uses the same browser     | A's protected rows/image remain inaccessible through fresh requests and tested navigation/cache paths |
| Missing/invalid setup                         | Harness explains configuration failure without exposing keys or targeting an unintended project       |

Use real signed development tokens for expiry checks, waiting until the recorded token expires and preventing automatic refresh for that request. Expired/invalid-token probes use independent requests without valid session cookies that could supply another authentication path. A mocked expired payload alone cannot establish provider behavior. Record any difference between JWT expiry, session revocation and already-issued media capabilities.

Run the spike's type, lint, build and authorization/browser checks alongside the existing `npm.cmd run check`, production build and visitor browser regressions as appropriate. Store sanitized outcomes, tested versions, device/browser scope, response behavior and required recovery steps in this plan. Clean up only the fixtures covered by the approved setup scope.

## Commit checkpoints

1. Commit the compatible isolated harness, configuration example and local setup validation after its checks pass.
2. Commit probe migrations, token-scoped server/database access and the two-user denial tests after proving those paths.
3. Commit private-media delivery, cache/session tests and sanitized findings after verification.

Keep supporting tests with each subtask. Record failures and decisions as findings. ACCOUNT-01 starts after the spike's isolation evidence has been reviewed and its access approach accepted.

## Review outcome and approvals needed

Recommend the verified Clerk-session → Next.js server → token-scoped Supabase approach if all required success/denial cases pass. If a required boundary fails, record the failing case and a proposed correction before treating the spike as complete.

Implementation approval covers the proposed SDK additions and isolated harness work. The repository's service rules separately require explicit authorization for provisioning and changes to a live development project. Once the target and permitted setup/cleanup operations are approved, execute that scope without repeated approval requests.

Clerk and the Supabase URL/publishable key are configured locally. The user confirmed `aghsipccmufzdtqwzxey` as the isolated test project, approved and manually ran the initial migration, and reported a successful signed-in read. Keep actual keys local. Before the next implementation, present the two-account test plan with its exact fixture creation/cleanup scope for approval. Two-user access denial, expired-token behavior and private-media/cache checks remain outstanding; the spike is not complete.
