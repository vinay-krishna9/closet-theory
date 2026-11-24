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

## Browser regression correction — 24 November 2026

Production desktop checks caught a layout regression introduced by using a native fieldset as the editor grid. Restored its existing div and used `inert` while a save is pending, preserving the grid, preview loading and keyboard protection. After correction, the production build, all 66 visitor desktop/mobile journeys and all four configured Clerk entry/boundary journeys passed. Reviewed the shared editor screenshots at 1440px and 390px; pinned preview and footer remain usable. The complete check suite passed with 198 unit/component tests, including pending-save cancellation on sign-out. Private account browser states still await the migration and fixture approval below.

## Hosted migration and fixture scope

Current status, 24 November 2026: the user applied the migration manually using the supplied SQL Editor instructions and confirmed saved loading, add/edit/remove/reload and second-browser-context sync. The user subsequently approved temporary test fixtures and cleanup, plus push/merge/issue completion. All eight real-service wardrobe journeys passed on desktop/mobile. The guarded teardown removed temporary database rows and Clerk identities; the cleanup journal was removed. Do not rerun the migration.

The applied `supabase/migrations/202611230003_synced_wardrobe.sql` targets only the existing isolated test project `aghsipccmufzdtqwzxey`. It adds a positive revision defaulting to 1 on existing items, the owner-only `wardrobe_mutations` receipt table, and verified-owner security-invoker list/mutation functions. It deletes no existing garments, changes no Clerk settings, and adds no storage bucket. App removal is a soft removal; future account deletion must delete receipts before clothing/profile rows.

`npm.cmd run test:wardrobe:live` passed all eight journeys using two temporary tagged Clerk development identities and synthetic catalog rows/profiles/receipts only. Tests verified desktop/mobile CRUD, second-context reload, lost-response retry without extra revision, stale editor draft retention and explicit latest-version review, sign-out with a held response, different-account empty state, foreign-ID mutation denial, direct RLS read denial and forged cross-owner receipt denial. The first run stopped on an incorrect test selector expecting a Sign in button; the actual configured UI correctly uses a link. Corrected the selector and reran the full suite successfully. Both runs cleaned up their fixtures. Traces/video/automatic screenshots are off; explicit editor screenshots contain sample fixture clothing only. No production or real-user data was used. Existing #12 live-test cleanup now removes optional wardrobe receipts before clothing, allowing both suites to work after this migration.

Commands: `npm.cmd run test:wardrobe:db` runs the disposable local PostgreSQL checks; `npm.cmd run test:wardrobe:live -- --list` discovers hosted journeys without creating fixtures. Future hosted runs require an authorized fixture scope. The user authorized push/merge; branch delivery is through PR #34 targeting main. No production deployment is included.

## Manual browser checks

Final verification: reviewed the account editor viewport screenshots on desktop and mobile, including visible focus, preview and footer access. Reran the two hosted CRUD journeys with viewport screenshots; both passed and cleanup completed. Configured entry checks also assert anonymous/altered-token wardrobe reads and unsigned writes are denied. The full existing unit/component, visitor and local database results remain valid; only test selectors, screenshots and documentation changed during final review.

Available now at `http://localhost:3000`: signed-out `/quick-add` → Customize → choose a color → add → `/wardrobe` → edit/remove; reload preserves visitor selections. On a narrow screen, the preview and footer stay available while details scroll. Tab/Shift+Tab stay in the editor; Escape/Cancel warn about unsaved changes and closing restores focus.

After applying the approved test migration: sign in, open `/wardrobe`, add via `/quick-add`, edit and reload; the same clothing appears in a second authenticated browser context. Search/group filters remain after a save. Remove a garment; it disappears after reload in both contexts. Turn the network offline while saving; the draft stays open, then retry online. Open the same item in two sessions, save in one, then save in the other; review the latest saved version before explicitly replacing it. Sign out and sign in as a different test account; no previous account clothing appears. Repeat the editor checks at phone width and using only the keyboard.

Issue completion is supported by the user-confirmed manual checks, 198 unit/component tests, local PostgreSQL checks, production build, 66 visitor browser journeys, configured account-entry checks and eight hosted wardrobe journeys. Account outfits remain #31; the broader security/private-media release gate remains #4/#15/#20. Physical devices, non-Chromium browsers and a full screen-reader audit remain outside the automated evidence. No additional setup or approval is pending for this issue in the named test environment.
