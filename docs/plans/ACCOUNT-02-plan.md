# ACCOUNT-02 — Automatic visitor import (#12)

Implementation approved on 23 November 2026. Branch: `feat/12-visitor-import`, based on merged ACCOUNT-01 in main. This approval covers implementation and local checkpoint commits, not new hosted changes, pushes or main merges.

## Behavior and boundaries

Verified sign-in/signup automatically saves visitor selections to the private account. Cancelled auth and pending verification retain the visitor source. Failures offer Retry without repeating signup. A successful owner-bound mapping is required before removing only the acknowledged, unchanged selections. Account clothing display/editing remains #13 and account outfit paging remains #31.

Match exact active configurations one-for-one, including applicable customization, seasons and formality. Names remain display text. Preserve distinct selected garments, existing names/details and removed-item history. Similarity alone never merges clothing. Stable operation IDs and database-computed canonical payload hashes protect retries, lost responses and concurrent tabs.

## Checkpoints

1. Server validation and atomic owner-scoped import, versioned migration, boundary tests and real local PostgreSQL verification.
2. Durable browser snapshot, automatic verified import, acknowledged-source cleanup, owner/cancellation/conflict recovery and component/browser tests.
3. Full verification, setup instructions and actual results. Report hosted tests separately from local evidence.

No new application dependencies. `scripts/test-import-db.mjs` uses an existing official `postgres:17-alpine` Docker image without pulling images, network access, host volumes or published ports. It creates a uniquely named disposable container and removes it afterward. This is separate from normal credential-free CI and never targets Supabase.

## Database change awaiting separate authorization

`supabase/migrations/202611230002_visitor_import.sql` adds two nonnegative count columns to `visitor_imports` and two security-invoker functions. The helper validates catalog configurations; the transaction derives the verified owner, locks imports per owner, initializes a missing profile without overwriting timezone, hashes canonical input and atomically saves items/mappings/completion counts. Existing owner RLS remains enforced. Anonymous execution is revoked. No new table, bucket, extension, elevated application credential, data deletion or production change.

Technical request limits: 2,000 selections and 1 MiB; invalid/oversized batches retain local data and do not partially import. The transaction also validates direct RPC input rather than trusting only the Next.js route.

## Verification

Local PostgreSQL tests cover actual migration execution, intentional duplicate multiplicity, exact/broader matches, removed items, stable replay, changed-payload rejection, rollback after an insertion, empty/invalid batches, simultaneous requests and owner/anonymous/unverified access denial. Route tests cover validation, identity, origin, stale owners, missing setup and incomplete/foreign receipts.

Browser/component checks cover durable IDs, cancellation/verification, retries/lost responses, two tabs, changed source, storage failures and sign-out/account switching. Hosted verification requires this exact migration and a separately approved disposable fixture scope; do not call it complete before those checks run.

## Local implementation record — 23 November 2026

- Server transaction/validation checkpoint: `8ae8e95`; database readiness formatting follow-up: `b7ed426`.
- Durable browser carryover and recovery checkpoint: `893f34b`. The authenticated entry screen waits for a durable snapshot when visitor selections exist. Provider storage writes, source acknowledgement and clearing coordinate with the same Web Lock. Browsers without that coordination retain visitor use and source data, with an explicit transfer limitation rather than unsafe cleanup.
- Follow-up `da0252b` verifies anonymous import denial in both browser configurations and pending-snapshot cleanup before Clerk sign-out navigation. The affected boundary/entry journeys were rerun successfully after the assertions were added.
- An edited/new source remains after the original mapping is acknowledged and needs an explicit retry. Ordinary network/setup retries keep the original operation; a permanent payload conflict offers explicit recovery with a fresh batch while retaining the current source. Cancelled/stale-owner requests cannot acknowledge another account's source. Sign-out clears pending import data before provider navigation.
- Passed formatting, lint, types, all **181 unit/component tests**, production build, **66 visitor browser journeys** and **four configured Clerk entry/boundary journeys**. Signed-out desktop/mobile screenshots were reviewed. Local PostgreSQL migration/RLS tests passed, including real insertion rollback and simultaneous sessions; their synthetic JWT claims do not establish hosted signature validation.
- The hosted configuration discovers **six import tests** with `npm.cmd run test:import:live -- --list`. They have **not run**. Hosted import success/error visual review and actual Clerk/Supabase import verification are still pending. No new hosted migration, fixture creation, push, merge or deployment was performed for #12.

## Pending hosted approval and user setup

Apply `202611230002_visitor_import.sql` once, only in Supabase test project `aghsipccmufzdtqwzxey`. This adds counts/functions described above; keep the existing Clerk development session claim unchanged. Then authorize the six import journeys using two unique `account01-…+clerk_test@example.com` fixture identities in the existing Clerk development instance, their catalog-only profile/clothing/import rows, initially unverified fixture denial followed by verification, and cleanup of those exact rows/identities. The guards and ignored journal are shared with the approved #11 test helpers. No real user's wardrobe is a fixture.

The suite checks lost response after actual persistence, same-operation retry, refresh, keyboard Retry, two same-origin tabs, exact matching/multiplicity, conflicting payloads and cross-owner API/direct-RLS denial. It disables automatic traces/video/screenshots and explicitly captures only its disposable fixture import status for visual review.

## Manual browser checks

At <http://localhost:3000/wardrobe>, signed out, add clothing and open Sign in. The page explains carryover; Back to your wardrobe retains selections. On desktop/mobile, verify Tab/Enter navigation and no horizontal scrolling.

Before the migration, completed sign-in shows a clear transfer-setup error and Retry while retaining local source. A successful clothing save must not be claimed. Existing timezone profile saves continue independently.

After approved setup, add visitor clothes and sign in: the profile should show the saved selection count. Refresh should not add copies. The signed-in wardrobe/outfits pages still show the foundation placeholder; displaying/editing saved clothes belongs to #13. Automated hosted checks verify the database counts and lost-response/two-tab cases. Sign-out must return to an empty visitor wardrobe.
