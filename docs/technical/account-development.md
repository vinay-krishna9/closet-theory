# Account development setup

Issue #11 adds real Clerk entry points and a protected profile foundation to the main application. Visitor import, synced clothing and account outfit paging remain #12, #13 and #31. The isolated harness stays on [its preserved branch](https://github.com/vinay-krishna9/closet-theory/tree/spike/4-clerk-supabase-access); it is not merged or required in the app tree.

## Local configuration

Use the existing Closet Theory Clerk **development** instance and Supabase test project `aghsipccmufzdtqwzxey`. `.env.example` lists the required names with placeholders. Actual values belong in ignored `.env.local`. The previously configured development values were copied locally without printing them; no new app or production keys were created.

`npm.cmd run dev` uses <http://localhost:3000>. Keep the hostname consistent throughout sign-in to avoid Next.js/Clerk loopback rewriting problems. `APP_ORIGIN` must match that exact trusted origin; it controls the token's accepted authorized-party (`azp`) origin. Authentication always returns to local `/profile`, ignoring arbitrary external return destinations. Production deployment requires its separately authorized settings.

Use `APP_AUTH_MODE=visitor` for credential-free visitor checks. With missing credentials the app is also visitor-only: private endpoints deny access and no keyless Clerk app is provisioned. Visitor browser tests use a separate fixed server at `127.0.0.1:4174`; the configured account tests use `localhost:4175` and set their trusted origin explicitly.

## Hosted changes awaiting approval

The following changes are prepared, **not applied**. Existing permission for the probe migration does not authorize this migration or these settings.

1. In the selected Clerk development instance, add this **session token claim**, merging it with the existing claims and preserving the native Supabase integration's role:

   ```json
   { "email_verified": "{{user.email_verified}}" }
   ```

   This is a custom session claim, not a deprecated Supabase JWT template. The provider supports this boolean shortcode. See [Clerk shortcodes](https://clerk.com/docs/guides/sessions/jwt-templates) and [custom session claims](https://clerk.com/docs/guides/sessions/customize-session-tokens). A refreshed token is needed after changing claims. The server independently checks current primary-email verification; database policies require a signed verified-email claim. Claim data can lag account changes until token refresh/expiry; do not claim immediate revocation of already-issued bearer tokens.

2. Review and apply [202611230001_account_foundation.sql](../../supabase/migrations/202611230001_account_foundation.sql) only to the named test project. It creates four new tables: `account_profiles`, `wardrobe_items`, `visitor_imports` and `visitor_import_items`, plus owner/variant constraints, owner-safe composite foreign keys, an active-owner index, RLS policies and the `account_owner()`/`account_timezone_valid(text)` helpers. Owners with verified claims can access only their own rows. Anonymous grants are revoked. There is no global configuration uniqueness that would collapse intentional garments.

   The transaction does not modify existing tables, delete records or create storage buckets. It deliberately fails on conflicting object names instead of accepting an unknown schema. The earlier spike table is untouched. The import tables are schema foundations; transactional automatic import is still #12. Do not rerun the migration after it has been applied.

3. Authorize the prepared live test scope: two uniquely named `account01-…+clerk_test@example.com` users in the same Clerk development instance, only their profile/sample clothing/import rows in the test project, temporary verification-state changes on the second fixture's email, restoration, actual signed-token expiry checks and cleanup of those exact fixtures. Existing users and their data are excluded. No password, token, auth state or elevated Supabase key is saved.

The live configuration checks the expected Clerk instance and Supabase project before creating fixtures. A local ignored journal identifies its new users; unfinished runs require cleanup before another run. Cleanup checks the run tag, deletes only those owners' fixture rows in foreign-key order and deletes those dedicated identities. The normal browser suite does not create users or database fixtures.

## Commands and browser checks

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e -- --workers=2
npm.cmd run test:account:entry
# Run only after the hosted changes and fixture scope above are approved:
npm.cmd run test:account:live
# Recovery after an interrupted approved live run:
npm.cmd run test:account:cleanup
```

The visitor and configured account suites use separate artifact directories. Account suites disable traces, video and automatic screenshots; the entry suite saves only signed-out forms for visual review. Do not use real wardrobe photos or account credentials in artifacts. Live tests authenticate via the provider's test helper, which does not establish manual Google/password credential-entry coverage.

In the browser, open `/wardrobe` and click **Sign in**. Confirm Google/email entry, then cancel using **Back to your wardrobe** and confirm your visitor clothes remain. After signing in, `/profile` shows the real account identity. Until the approved schema/claim setup is executed, it reports that setup is required and does not claim a successful save. After setup, the initial timezone is detected from the device without overwriting an existing profile; save another valid timezone and refresh to check persistence. Sign out to return to a fresh visitor wardrobe.

Profile drafts store only owner ID and the unsaved timezone in per-tab session storage to support reauthentication. They contain no token or wardrobe data and are removed on explicit sign-out or owner change. If storage is blocked the form retains its current in-memory edit and explains the limitation. Cross-tab explicit sign-out clears retained visitor state using a nonsensitive event marker. Account responses are private/no-store and pending profile requests are aborted on unmount/identity change.

## Verification status

Implementation is in progress on `feat/11-account-auth`, based on the main-derived documentation checkpoint `63623e7`. The new migration and claim setting are unapplied, and the mutating live suite is prepared but unrun. Do not mark #11 or #4 complete until actual profile persistence, real signed-token expiry/alteration, unverified identity, owner relationships and account-switch checks pass. Private-photo/cache checks remain #15.

Local checkpoint, 23 November 2026: `npm.cmd run check` passed formatting, lint, type checks and all 157 unit/component tests. The production build passed. All 66 visitor browser checks passed with two workers, and all four configured Clerk entry/boundary checks passed on desktop/mobile Chromium. The live test configuration was checked with `--list` only; its two mutating journeys have not run.

An initial concurrent browser run had seven visitor failures (timing and shared artifact-directory errors). The configured account suite now has its own artifact directory, and the visitor suite passed when run alone with two workers, with its assertions unchanged. Visual review found an overly broad heading selector affecting Clerk's card; it was scoped to the page heading, the form target sizes were set to at least 44px and the account suite passed again. The final signed-out desktop/mobile screenshots were inspected. Signed-in profile review, manual Google/password/recovery entry, physical devices, non-Chromium browsers and a full screen-reader review remain unverified.

`npm audit` reported seven moderate advisories in the existing ESLint/typescript-eslint/minimatch toolchain. Their affected package versions match main; they were not introduced by the auth SDK addition. This checkpoint does not claim a clean audit or include unrelated toolchain upgrades.
