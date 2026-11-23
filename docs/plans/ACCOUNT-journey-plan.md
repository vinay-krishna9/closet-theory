# Real account journey execution plan

Status: implementation approved on 23 November 2026, starting with #11. The user approved preserving the spike separately and moving this plan onto a main-based documentation branch. This document does not authorize running new migrations, production changes or deployment.

The real #11 foundation is now implemented locally: main-app Clerk entry points, verified profile APIs, owner-scoped draft/session recovery and a prepared four-table schema. [Account development setup](../technical/account-development.md) records the exact unapplied migration/claim/fixture authorization scope and actual checks. #11 remains incomplete until the hosted setup and live security journeys pass; #12/#13/#31 are not implemented by this checkpoint.

## Outcome and issue ownership

Connect the main application's Sign in/Create account actions to Clerk, carry visitor selections into a private Supabase wardrobe, restore that wardrobe after reload/sign-in, and generate account outfits from persisted clothing. Sign-out clears account state and starts a fresh empty visitor wardrobe.

Keep coherent tasks separate: [ACCOUNT-01 #11](https://github.com/vinay-krishna9/closet-theory/issues/11) owns auth/schema and session security; [ACCOUNT-02 #12](https://github.com/vinay-krishna9/closet-theory/issues/12) owns automatic import; [WARDROBE-01 #13](https://github.com/vinay-krishna9/closet-theory/issues/13) owns synced catalog-item management. [OUTFITS-02 #31](https://github.com/vinay-krishna9/closet-theory/issues/31) tracks account suggestions and six-result paging, which the existing visitor issue did not implement. This is one delivery plan, not one combined issue or commit.

Follow [product decisions](../product/product-decisions.md), [architecture](../technical/architecture.md), [design.md](../../design.md) and [AGENTS.md](../../AGENTS.md). Preserve the visitor allowance of three, confirmed verification/merge rules, deterministic matching and current catalog/editor behavior.

## Sequencing change and security gates

- The existing [SPIKE-02 #4](https://github.com/vinay-krishna9/closet-theory/issues/4) established the development integration and both directions of owner isolation using real sessions, server operations and direct Supabase requests. Its latest code checkpoint is `df92821`; the execution record contains actual checks and limitations. The spike branch is pushed for reference and will remain separate from main.
- The user approved proceeding with real app implementation rather than building further throwaway auth/storage screens. #4 remains open as the verification tracker. It no longer blocks starting #11 solely because prototype media or expired-token checks are unfinished.
- #11 must reject anonymous, altered and genuinely expired tokens on actual account operations and demonstrate cross-account/relationship denial before it is complete. Use independently issued requests without valid cookies masking an invalid token. Handle expiry in the UI without losing pending work.
- [PHOTO-02 #15](https://github.com/vinay-krishna9/closet-theory/issues/15) must prove private-media ownership, anonymous/expired/altered-token denial and cache behavior using its real upload/read/delete paths before private photos are considered complete. Avoid a circular dependency that requires #4 to close before implementing the paths needed to finish #4.
- [RELEASE-02 #20](https://github.com/vinay-krishna9/closet-theory/issues/20) retains #4 as a release gate. Link real-feature evidence back to #4 and close it only after its full matrix passes. No security requirement is waived or checked off by this plan.

## 1. Main-app authentication and schema — #11

**Change:** real Google/email-password sign-in and signup, verification/recovery, authenticated shell and protected server adapters. Retain the existing visitor routes and shared UI rather than introducing a second app experience.

**Implementation:**

- Reuse the installed Clerk/Supabase versions proven by the harness. Make `@clerk/nextjs` and `@supabase/supabase-js` explicit dependencies of the root app, with the single npm lockfile. Reuse `@clerk/testing`, Vitest and Playwright. No additional package is currently proposed; present any material new dependency before installing it.
- Add the Next.js 16 `src/proxy.ts`, a narrowly placed Clerk provider, and accessible `/sign-in` and `/sign-up` routes. Replace the shared account-availability dialog with real entry links and explain automatic clothing carryover before authentication. Keep return destinations local and validated.
- Use server-verified Clerk identity on every operation, not client-submitted owner IDs. Gate personal saves/import on provider-verified identity. Email/password users complete email verification; already verified Google identities do not get a redundant challenge. Preserve visitor selections through cancellation, verification and recovery.
- Put account components in `src/features/account/`, private wardrobe adapters alongside wardrobe code and token-scoped server clients in `src/lib/supabase/`. Routes remain thin. Never copy probe endpoints, fixture users, labels or cleanup controls into the app.
- Request-scoped clients use the publishable key and current Clerk token. Keep account responses and media out of shared caches. Protect callbacks, actions and route handlers, validate inputs, and prevent unrelated origins from issuing authenticated mutations. No elevated Supabase key is used for normal data access.
- Prepare versioned migrations under `supabase/migrations/` for minimal owner profiles, catalog wardrobe items, import operations and selection mappings. Owner IDs are Clerk text subjects. Profiles hold a validated IANA timezone initialized from the device; items retain stable server UUIDs, catalog/type/color references, confirmed garment fields and a removal timestamp. Add owner-safe keys/foreign keys, uniqueness for idempotency and RLS on every private table. Do not prematurely create wear/preference/media tables; add their constraints with their features.
- Account-scoped state must be keyed by identity and discarded on sign-out/switch. Cancel stale requests, reject late results from the previous account and clear saved visitor sources according to the confirmed lifecycle. Avoid persisting account records or application-managed tokens in visitor localStorage. Authenticated data comes from Supabase.
- Configure local root development credentials privately using the approved development services; placeholders only in `.env.example`. Do not repoint deployed environments. Keep credential-free visitor CI usable with an explicit visitor-only configuration: private endpoints still deny access, with no authentication bypass. Run real-service account tests separately against an allowlisted test project. Missing configuration must not silently create a replacement Clerk app.
- Keep unavailable photo, preference, wear and statistics actions honest until their issues are implemented. Password recovery and account controls must work; coordinated account deletion remains #19. Do not expose an identity-only deletion shortcut that would leave app data behind.

**Checks:** verification-gated mutations; signup/sign-in/recovery/cancellation; session refresh/expiry; anonymous and two-account CRUD/relationship denial at app and direct database boundaries; expired/altered signed tokens; sign-out and same-browser A-to-B transitions with refresh/back navigation. Review mobile/desktop keyboard focus, errors and reduced motion. Do not claim Google credential-entry coverage from backend-assisted test sign-in.

## 2. Automatic visitor carryover — #12

**Change:** signup and existing-account sign-in automatically import selected catalog clothing once; failure keeps the source and offers Retry without repeating signup.

**Implementation:**

- Reuse the existing versioned visitor decoder, `configurationKey`, catalog validation and stable selection identities. Never use a list position as identity or include private photos in this payload.
- Before redirect, retain the source snapshot with a stable import operation ID. The server validates all clothing, derives the owner and performs item writes plus mapping/completion records in one transaction. Bind repeat operation IDs to the validated payload so a changed payload cannot impersonate a completed import.
- Enforce owner-scoped operation/mapping uniqueness and serialize concurrent imports as needed. A transaction failure rolls back the batch. Lost responses, refreshes, repeated clicks and two tabs cannot duplicate the same import.
- Match only exact active configurations, including customizations and applicable tags. Broader similarity does not merge items or replace a personal photo. Preserve explicitly distinct identical garments; do not impose a global unique configuration constraint that destroys that distinction. Test existing matches, intentional duplicates and mixed cases separately.
- Acknowledge the persisted mapping before removing the corresponding local source. Do not clear later visitor edits or overwrite another tab's changed source. Corrupt/unreadable browser storage requires recovery, not a silently empty import.

**Checks:** empty/new/existing accounts; verification pending; cancellation; existing exact/broader matches; intentional duplicate garments; interrupted/failed transactions; lost responses; retries/refresh/two tabs; source changes during import; sign-out during an in-flight import; cross-owner batch/mapping attempts. Retain work and show accurate saved state.

## 3. Synced wardrobe — #13

**Change:** the existing Quick-add/Wardrobe editor saves and loads the signed-in owner's catalog items from Supabase, including on a second authenticated browser/device.

**Implementation:** reuse the established forms, validation, garment imagery and duplicate/similarity decisions. Use an account repository/provider with loading/error/empty/retry behavior and server-confirmed writes. Keep visitor persistence separate. Preserve filters, scroll and unsaved edits; cancel/ignore stale account requests. Removal marks the item unavailable and preserves identity for future history; no personal-media cleanup is needed for catalog-only items. No individual-item favorites.

**Checks:** add/edit/remove/reload/second-context sync; server failures and retries; rapid submissions; account switch while a request is pending; exact/similar configuration behavior; accessible desktop drawer/mobile fullscreen editor; removed garments excluded from suggestions.

## 4. Account outfit suggestions — #31

**Change:** authenticated users see up to six compatible suggestions, with Show more only when another page exists. Visitors keep their three-result allowance.

**Implementation:** reuse the deterministic engine and approved composition cards. Generate account results from server-loaded owner-scoped active clothing, not the visitor storage copy. Bind paging to the verified owner and a stable wardrobe/filter snapshot; invalidate it after wardrobe changes, sign-out or account switch. Do not accept another owner's item IDs or snapshot as authority. Keep matching rules and stable sorted-item outfit identities unchanged. Until feedback/wear persistence ships, use empty preference/history inputs and do not claim those features work.

**Checks:** fewer than six/exactly six/more than six results; distinct subsequent pages; season/formality eligibility; deterministic reruns; changed/removed garments; stale requests and owner switching; anonymous fallback to three; no account-benefit copy promising already available actions incorrectly.

## Migration and environment authorization

The approved test target is `aghsipccmufzdtqwzxey` (`closet-theory-dev`) with the existing Closet Theory Clerk development instance. The prior permission applied to the probe migration and named disposable fixtures. It does not cover new account tables, new stored routines, storage buckets, production, paid plans or deployment.

Implementation approval will cover preparing the root-app code, dependency placement and versioned SQL in this plan. Present the exact migration and its effects before requesting permission to apply it to the hosted test project. Finish all work that can be checked without that mutation first. Request authorization for the named account-test fixtures and cleanup once their scope is concrete, then run that scope without repeated approval. Never run automated tests against a real production project.

## Branches, checkpoints and completion

- The main-based planning branch is `docs/11-account-delivery`. The harness is preserved on remote `spike/4-clerk-supabase-access` and is not a merge prerequisite. Implement #11 from main with only these documentation changes as a stacked dependency; reuse patterns/tests without importing the prototype tree.
- After implementation approval, use `feat/11-account-auth`, `feat/12-visitor-import`, `feat/13-synced-wardrobe` and `feat/31-account-outfits`. If downstream work starts before an upstream merge, stack it on that branch and record the PR base. Keep one primary issue in progress at a time.
- Commit coherent checked subtasks before starting the next substantial implementation: auth/provider/entry points; schema/adapters and authorization; import transaction and recovery; synced wardrobe; account suggestions. Keep supporting tests and docs in each checkpoint. Do not mark issues complete from a successful prototype alone.
- Run appropriate co-located unit/component tests, integration/live-service authorization tests, relevant visitor/account Playwright journeys, formatting, lint, types and production builds. Review affected UI on desktop/mobile with keyboard, loading/error/recovery, reduced motion and accessibility checks. Record actual provider form coverage and device limits.
- A complete account journey needs #11, #12, #13 and OUTFITS-02 verified together. #4 remains open until the real account and later PHOTO-02 evidence covers all outstanding security cases; #20 prevents release before that gate is met.

Issue #11 is authorized to begin after this documentation checkpoint. No new account schema, real-app auth change, deployment or issue closure is claimed by this planning deliverable.
