# Account development setup

Issue #11 adds real Clerk entry points and a protected profile foundation to the main application. Visitor import, synced clothing and account outfit paging remain #12, #13 and #31. The isolated harness stays on [its preserved branch](https://github.com/vinay-krishna9/closet-theory/tree/spike/4-clerk-supabase-access); it is not merged or required in the app tree.

## Local configuration

Use the existing Closet Theory Clerk **development** instance and Supabase test project `aghsipccmufzdtqwzxey`. `.env.example` lists the required names with placeholders. Actual values belong in ignored `.env.local`. The previously configured development values were copied locally without printing them; no new app or production keys were created.

`npm.cmd run dev` uses <http://localhost:3000>. Keep the hostname consistent throughout sign-in to avoid Next.js/Clerk loopback rewriting problems. `APP_ORIGIN` must match that exact trusted origin; it controls the token's accepted authorized-party (`azp`) origin. Authentication always returns to local `/profile`, ignoring arbitrary external return destinations. Production deployment requires its separately authorized settings.

Use `APP_AUTH_MODE=visitor` for credential-free visitor checks. With missing credentials the app is also visitor-only: private endpoints deny access and no keyless Clerk app is provisioned. Visitor browser tests use a separate fixed server at `127.0.0.1:4174`; the configured account tests use `localhost:4175` and set their trusted origin explicitly.

## Approved development configuration

On 23 November 2026 the user explicitly approved the named test-project migration, Clerk development claim and temporary fixtures, then reported applying both dashboard changes and passing the manual checks. These settings apply only to the named development services; production and deployment remain outside this authorization.

1. In the selected Clerk development instance, add this **session token claim**, merging it with the existing claims and preserving the native Supabase integration's role:

   ```json
   { "email_verified": "{{user.email_verified}}" }
   ```

   This is a custom session claim, not a deprecated Supabase JWT template. The provider supports this boolean shortcode. See [Clerk shortcodes](https://clerk.com/docs/guides/sessions/jwt-templates) and [custom session claims](https://clerk.com/docs/guides/sessions/customize-session-tokens). A refreshed token is needed after changing claims. The server independently checks current primary-email verification; database policies require a signed verified-email claim. Claim data can lag account changes until token refresh/expiry; do not claim immediate revocation of already-issued bearer tokens.

2. The user applied [202611230001_account_foundation.sql](../../supabase/migrations/202611230001_account_foundation.sql) only to the named test project. It creates four new tables: `account_profiles`, `wardrobe_items`, `visitor_imports` and `visitor_import_items`, plus owner/variant constraints, owner-safe composite foreign keys, an active-owner index, RLS policies and the `account_owner()`/`account_timezone_valid(text)` helpers. Owners with verified claims can access only their own rows. Anonymous grants are revoked. There is no global configuration uniqueness that would collapse intentional garments.

   The transaction does not modify existing tables, delete records or create storage buckets. It deliberately fails on conflicting object names instead of accepting an unknown schema. The earlier spike table is untouched. The import tables are schema foundations; transactional automatic import is still #12. Do not rerun the migration after it has been applied.

3. Approved live test scope: two uniquely named `account01-…+clerk_test@example.com` users in the same Clerk development instance, only their profile/sample clothing/import rows in the test project, an initially reserved/unverified address on the second fixture, denial checks followed by verification, actual signed-token expiry checks and cleanup of those exact fixtures. Existing users and their data are excluded. No password, token, auth state or elevated Supabase key is saved.

The live configuration checks the expected Clerk instance and Supabase project before creating fixtures. A local ignored journal identifies its new users; unfinished runs require cleanup before another run. Cleanup checks the run tag, deletes only those owners' fixture rows in foreign-key order and deletes those dedicated identities. The normal browser suite does not create users or database fixtures.

## Commands and browser checks

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e -- --workers=2
npm.cmd run test:account:entry
# Requires the approved development configuration and fixture scope above:
npm.cmd run test:account:live
# Recovery after an interrupted approved live run:
npm.cmd run test:account:cleanup
```

The visitor and configured account suites use separate artifact directories. Account suites disable traces, video and automatic screenshots. The entry suite saves signed-out forms; the live suite explicitly saves only its disposable fixture profile for desktop/mobile visual review. Do not use real wardrobe photos or account credentials in artifacts. Live tests authenticate via the provider's test helper, which does not establish manual Google/password credential-entry coverage.

In the browser, open `/wardrobe` and click **Sign in**. Confirm Google/email entry, then cancel using **Back to your wardrobe** and confirm your visitor clothes remain. Cancellation is the selection-preservation check: after completed sign-in, `/wardrobe` and `/outfits` intentionally show the account foundation placeholder and profile link. The visitor source remains local, but importing/displaying account clothes belongs to #12/#13. After signing in, `/profile` shows the real account identity. Without schema/claim setup, it reports that setup is required and does not claim a successful save. With the approved development configuration, the initial timezone is detected from the device without overwriting an existing profile; save another valid timezone and refresh to check persistence. Sign out to return to a fresh visitor wardrobe.

Profile drafts store only owner ID and the unsaved timezone in per-tab session storage to support reauthentication. They contain no token or wardrobe data and are removed on explicit sign-out or owner change. If storage is blocked the form retains its current in-memory edit and explains the limitation. Cross-tab explicit sign-out clears retained visitor state using a nonsensitive event marker. Account responses are private/no-store and pending profile requests are aborted on unmount/identity change.

## Verification status

ACCOUNT-01 is implemented on `feat/11-account-auth`, based on main-derived documentation checkpoint `63623e7`. The user applied the approved test-project migration and development session claim. Both desktop/mobile foundation journeys and both Back-navigation journeys passed against those real services, including profile persistence, owner-safe relationships, genuine signed-token expiry/alteration and same-browser account switching. Explicit Back navigation after sign-out and owner switching also passed without restoring the previous private profile. The unverified reserved fixture was denied by the server and database before verification. All dedicated users and rows were cleaned up; the ignored fixture journal is removed. #4 remains open for private-photo/cache checks in #15 and the release gate in #20.

Local checkpoint, 23 November 2026: `npm.cmd run check` passed formatting, lint, type checks and all 158 unit/component tests. The production build passed. All 66 visitor browser checks passed with two workers, and all four configured Clerk entry/boundary checks passed on desktop/mobile Chromium. All four live browser journeys passed (foundation and Back navigation, each desktop/mobile). The user also reported passing the listed manual authentication, cancellation, password-recovery and profile checks.

An initial concurrent browser run had seven visitor failures (timing and shared artifact-directory errors). The configured account suite now has its own artifact directory, and the visitor suite passed when run alone with two workers, with its assertions unchanged. Visual review found an overly broad heading selector affecting Clerk's card; it was scoped to the page heading, the form target sizes were set to at least 44px and the account suite passed again. The final signed-out desktop/mobile screenshots were inspected. Disposable-fixture signed-in profile screenshots were reviewed on desktop/mobile, with keyboard save and no horizontal overflow checked. Real credential-entry checks are user-reported rather than automated. Physical devices, non-Chromium browsers and a full screen-reader review remain unverified.

`npm audit` reported seven moderate advisories in the existing ESLint/typescript-eslint/minimatch toolchain. Their affected package versions match main; they were not introduced by the auth SDK addition. This checkpoint does not claim a clean audit or include unrelated toolchain upgrades.

Live verification exposed and resolved a sign-out race: Clerk can navigate before its promise settles, so draft removal and the cross-tab event now happen before provider sign-out. Regression test and fix are checkpoint `a7940bb`; provider-aware live tests are `5697932`. Initial attempts also showed that the required-email invariant prevents removing the only usable address, and that reissued tokens can retain verification state. The fixture now starts with a reserved/unverified address, checks denial, then verifies it before normal journeys. No global authentication settings were weakened.

The expiry test first proves a valid cookie-free bearer request succeeds, then denies altered and genuinely expired tokens. It waits 45 seconds beyond `exp` to exceed PostgREST's documented [30-second clock-skew allowance](https://docs.postgrest.org/en/v14/references/auth.html), with margin. This records the provider tolerance; it does not promise instantaneous revocation at `exp` or on sign-out for already-issued direct database tokens.

## ACCOUNT-02 verified development implementation

The account auth results above describe completed #11. The automatic-import implementation is on `feat/12-visitor-import` with its own [setup, approval scope and actual results](../plans/ACCOUNT-02-plan.md). Do not rerun the foundation migration. The approved `202611230002_visitor_import.sql` was applied once to the named test project on 23 November 2026. All six hosted import journeys passed and dedicated fixtures were cleaned up. Other environments missing this migration report transfer unavailable and retain source; profile persistence remains independent.

`npm.cmd run test:import:db` uses an existing `postgres:17-alpine` Docker image, creates an isolated network-free temporary database, applies both migrations and checks rollback, replay, multiplicity, concurrency and RLS. It pulls no image and does not use service credentials. `npm.cmd run test:import:live -- --list` discovers the six real-service journeys without creating fixtures. Run the actual live suite only after the new migration and #12 fixture scope are separately authorized.

## WARDROBE-01 hosted setup and manual CRUD confirmation

The [#13 plan and handoff](../plans/WARDROBE-01-plan.md) contains migration effects, fixture scope, checked commits and manual steps. The user applied the third migration manually on 24 November and confirmed loading, add/edit/remove and reload persistence in the test project. Do not rerun the applied migrations. The third migration adds revisions, owner-only operation receipts and security-invoker wardrobe functions. Second-context sync, failure/conflict/account-switch behavior and hosted signed-token/RLS checks remain pending. No automated hosted wardrobe fixtures have been authorized or run.

`npm.cmd run test:wardrobe:db` uses the same existing network-free disposable PostgreSQL tooling and tests all three migrations. `npm.cmd run test:wardrobe:live -- --list` only discovers the eight prepared desktop/mobile journeys; actual execution creates tagged temporary Clerk identities and owner-scoped synthetic catalog data, requiring separate approval. The shared guarded teardown deletes mutation receipts before clothing rows. No new credentials, service dependency, Clerk claim change or storage configuration is required.
