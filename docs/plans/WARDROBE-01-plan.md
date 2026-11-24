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

Current status, 24 November 2026: the user applied the migration manually using the supplied SQL Editor instructions and confirmed that saved clothing loads. The user then confirmed the manual add → edit name → save → refresh and remove → refresh checks work. This is user-reported hosted CRUD evidence, not an automated hosted-suite result. Do not rerun the migration. Second-context sync, recovery/conflict/account-switch checks and hosted signed-token/RLS verification remain pending. The user chose manual setup/checks; temporary automated fixtures have not been authorized or executed.

Target only the existing isolated test project `aghsipccmufzdtqwzxey` and existing Clerk development instance. Apply `supabase/migrations/202611230003_synced_wardrobe.sql` once, after confirming the preceding two migrations exist. It adds a positive revision defaulting to 1 on existing items, the owner-only `wardrobe_mutations` receipt table, and verified-owner security-invoker list/mutation functions. It deletes no existing garments, changes no Clerk settings, and adds no storage bucket. App removal is a soft removal; future account deletion must delete receipts before clothing/profile rows.

Then run `npm.cmd run test:wardrobe:live`: two temporary tagged Clerk test identities, synthetic catalog rows/profiles/receipts only, desktop/mobile real-service CRUD, second-context reload, lost responses, stale editor review, sign-out with a held response, and direct API/RLS isolation checks. Guarded owner-token cleanup removes only these fixtures, then deletes those temporary identities; an ignored journal survives interrupted runs. Traces/video/automatic screenshots are off; explicit editor screenshots contain sample fixture clothing only. No production or real-user data is used. The suite is prepared and discoverable but has not been run. Existing #12 live-test cleanup now removes optional wardrobe receipts before clothing, allowing both suites to work after this migration.

Commands: `npm.cmd run test:wardrobe:db` runs the disposable local PostgreSQL checks; `npm.cmd run test:wardrobe:live -- --list` discovers hosted journeys without creating fixtures. Actual hosted execution requires the approval above. No remote push/main merge or deployment has been performed for #13.

## Manual browser checks

Available now at `http://localhost:3000`: signed-out `/quick-add` → Customize → choose a color → add → `/wardrobe` → edit/remove; reload preserves visitor selections. On a narrow screen, the preview and footer stay available while details scroll. Tab/Shift+Tab stay in the editor; Escape/Cancel warn about unsaved changes and closing restores focus.

After applying the approved test migration: sign in, open `/wardrobe`, add via `/quick-add`, edit and reload; the same clothing appears in a second authenticated browser context. Search/group filters remain after a save. Remove a garment; it disappears after reload in both contexts. Turn the network offline while saving; the draft stays open, then retry online. Open the same item in two sessions, save in one, then save in the other; review the latest saved version before explicitly replacing it. Sign out and sign in as a different test account; no previous account clothing appears. Repeat the editor checks at phone width and using only the keyboard.

Remaining criteria: second-context persistence, hosted recovery/conflict/account-switch behavior, cross-account signed-token/RLS checks and private-state desktop/mobile visual review. Basic hosted loading/add/edit/remove/reload were confirmed manually by the user. Physical devices, non-Chromium browsers and a full screen-reader audit remain outside the automated evidence.
