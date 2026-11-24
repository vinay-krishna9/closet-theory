# WARDROBE-01 — Synced catalog wardrobe (#13)

Concrete implementation plan approved on 23 November 2026. Branch `feat/13-synced-wardrobe` starts from main at `5bf42ef`, after #12 merged through PR #33.

## Scope and checkpoints

1. Owner-scoped list/add/update/remove APIs, revisions and minimal mutation receipts, with route and isolated PostgreSQL tests.
2. Connect the existing wardrobe, catalog and editor to an account provider. Await server-confirmed writes, preserve failed drafts, refresh after import, and keep private records in memory only. Preserve the visitor flow and existing responsive/duplicate UI.
3. Browser/security verification, desktop/mobile accessibility review and actual setup/results documentation.

No new application dependencies. Prepare a versioned migration adding an item revision, an owner-only mutation-receipt table and security-invoker list/mutation functions. Receipts contain operation/payload identity and the resulting item ID, not duplicate clothing/photo snapshots. Revisions reject stale edits; operation IDs make lost-response retries safe. Removal sets the existing removal timestamp and retains stable item/history identity. Future account deletion must remove receipts before clothing/profile rows.

The new migration is prepared locally, not authorized for hosted execution by implementation approval. Present its exact effects and disposable live-test scope after local work is reviewable. Use existing official local PostgreSQL tooling for isolated verification; never target production.

## Resulting browser behavior

Verified accounts see only their active saved clothes on Wardrobe and can add catalog garments, edit details or remove them. Import completion refreshes the list. Loading and failed loads are distinct from an empty account. Save failure keeps the editor/draft open; a conflicting edit requires refreshed data and explicit retry. Keep filters, scroll and focus; disable duplicate submissions while saving. Unverified/signed-out users retain visitor behavior. Account switches/sign-out abort requests and discard private state.

Account outfits remain gated until #31. Uploads, item favorites, wear/history controls and identity-only account deletion are not introduced.

## Verification

Meaningful unit/component assertions, real isolated PostgreSQL migration/transaction/RLS checks, existing visitor and Clerk entry journeys, and prepared live owner CRUD/second-context/retry/conflict/account-switch tests. Check phone/desktop editor focus and keyboard recovery. Record actual passes and pending hosted checks before declaring completion.

## Server checkpoint — 24 November 2026

Nine route/boundary tests, relevant lint/types/formatting, and real local PostgreSQL checks passed. The local checks apply all three migrations and exercise active-only lists, exact/broader matches, explicit separate garments, stable replay, changed-payload and stale-revision rejection, soft removal, receipt-failure rollback, owner/anonymous/unverified denial and simultaneous add/update/remove retries. The temporary database is removed afterward. This is synthetic local-claim evidence, not hosted verification. The new #13 migration remains unapplied to Supabase.

## UI checkpoint — 24 November 2026

Connected verified accounts to the existing Wardrobe, Quick-add and editor through an owner-keyed, memory-only provider. Loads and writes validate owner identity; account switches abort pending requests and discard private state. Import completion and window focus refresh the saved list. Failed saves preserve drafts and reuse the operation ID; stale revisions require explicit review of the latest version. Visitors retain their existing synchronous behavior and browser storage.

`npm.cmd run check` passed: formatting, lint, route/types and 197 unit/component tests. New interaction tests cover failed loads, response-loss retries, owner switches, retained editor drafts, focus restoration and explicit conflict review. Production browser and hosted database verification remain pending.
