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
