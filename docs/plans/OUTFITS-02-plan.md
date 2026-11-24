# OUTFITS-02 — Account suggestions and paging (#31)

Approved 24 November 2026. Branch `feat/31-account-outfits` starts from main at `101d5b5`, after #13/PR #34. Target main; remote delivery requires a separate explicit request.

User scope update, 24 November: cap signed-in suggestions at the best 10 ranked options per wardrobe/filter snapshot. Keep six initially and Show more for at most four additional results. Apply the cap after the shared engine ranks its full bounded pool, preserving ranking/diversity; do not shrink the engine's candidate pool to ten. Visitors retain three. Server offsets cannot bypass the cap, and the client rejects results beyond ten. This supersedes wording below about further six-result pages. No migration or dependency is needed.

Cap verification: formatting/lint/types, all 221 unit/component tests and production build passed. Focused hosted desktop/mobile journeys passed for 1, 6, 8, 10 and 14 compatible matches; Show more stops at ten and reload preserves the ordering. Two visitor allowance journeys also passed. Temporary Clerk identities and sample rows were cleaned up; the journal is absent. Shared engine comparisons verify the account results equal its ranked prefix, capped after ranking. User instructions, design, product decisions and setup documentation reflect the new allowance.

## Checked implementation boundaries

1. Authenticated owner generation/paging using the existing active-wardrobe RPC and deterministic engine. Validate filters and page offsets, bind snapshots to owner/items/revisions/filters, reject stale or foreign snapshots. No client garment IDs or history/preferences accepted; use empty history/preferences until #16/#17. Existing engine bounds remain honest in the UI. No schema or dependency changes.
2. Reuse cards, filters and recovery UI. Six initial account results, append up to four more from the best ten using Show more only when matches remain. Owner, wardrobe and filter changes cancel/discard results. Keep visitor allowance at three and update account availability messaging.
3. Unit/component, production build, visitor/entry regressions, and approved real-service desktop/mobile tests. Two temporary tagged Clerk development identities, synthetic catalog rows and owner-token guarded cleanup in test project `aghsipccmufzdtqwzxey`. Existing migration is already applied and will not be rerun. Inspect phone/desktop screenshots, keyboard/focus and reduced-motion behavior. Record actual results and manual checks before completion.

Implementation approval includes local checked checkpoint commits and the named temporary test fixtures/cleanup. No production deployment or migration is included.

## Server checkpoint — 24 November

Added `/api/account/outfits` using the existing token-scoped active-wardrobe operation. Requests accept only owner guard, validated filters and paging values. SHA-256 snapshots bind algorithm version, verified owner, complete item/revision data and filters. Every page reloads the current owner list; no client-supplied garment IDs or cached private result store is trusted. Generate with empty history/preferences and a fixed clock for repeatable paging; retain the existing 240-candidate/50,000-evaluation bounds and report bounded-search diagnostics.

Fourteen focused tests passed for one/exactly-six/more-than-six results, engine equality, distinct/repeatable pages, item revisions/removal/filter/owner snapshot conflicts, unsigned/unverified/origin/invalid-input denial, empty/filter outcomes and sanitized failures. Lint, type checks and relevant formatting passed. Hosted execution and UI verification remain for the following checkpoints.

## UI checkpoint — 24 November

The shared `OutfitSuggestions` view now selects visitor worker generation or authenticated account generation. Accounts load six results, append the next distinct page, preserve results on a failed page and move focus to the first appended heading. Invalidated snapshots clear the results and ask for regeneration. Abort/version guards discard late responses; filters, owner changes and wardrobe changes clear completed results without reviving an older snapshot. Visitor limits/cards are preserved; configured visitor prompts now offer actual signup/sign-in and describe future preference/wear controls honestly.

`npm.cmd run check` passed formatting, lint, type checking and all 218 unit/component tests. Six new interaction assertions cover duplicate submits, page retry, owner/filter/wardrobe invalidation, explicit Any recovery, unmount cancellation and appended-result focus. Production build and hosted/visitor browser verification follow before final completion.

## Verification and handoff — 24 November

Production build passed. All 66 desktop/mobile visitor journeys and all eight approved real-service account outfit journeys passed. The latter cover fewer/exactly/more than six, distinct pages and stable reload, failed-page preservation, removal snapshot invalidation, filtered empty states and Try Any, foreign-owner snapshots and supplied IDs, real server membership/RLS isolation, and pending responses across filter change/sign-out/different-account sign-in. The existing guarded fixture teardown removed synthetic rows and dedicated Clerk development identities; the ignored fixture journal is absent. No migration was executed and no real-user records or photos were used.

Reviewed desktop/mobile results screenshots from sample fixture garments. Cards, reasons, details, focus after appended results, reduced-motion use and page overflow were checked. The configured account-entry suite additionally checks anonymous/altered-token outfit POST denial. Final formatting, lint, types and all 218 unit/component tests passed. No account feedback or wear controls are introduced. Physical-device/browser-engine coverage and a full screen-reader audit remain unverified; the broader #4/#15/#20 release gates remain open.

### Manual browser checks

Use `http://localhost:3000/outfits` with the existing configured development server (restart `npm.cmd run dev` after switching branches if it serves stale code).

1. Sign in with a verified account that has a top, bottoms and shoes. Choose Suggest outfits; receive up to six compatible results from saved clothing. Fewer matches stay honestly fewer. Reload and suggest again; the same wardrobe/filters produce the same ordering.
2. For a wardrobe with more than six compatible combinations, choose Show more. It appends up to four distinct results, moves focus to the first new outfit and disappears at ten total or when fewer matches exist. Even a wardrobe with more than ten compatible combinations shows at most ten. A bounded-search notice appears when the engine could not exhaust the complete combination space.
3. Open Filters, choose a season/formality and suggest. Previous results disappear when filters change. If a required group is filtered out, Try Any filters restores the broad search.
4. Edit/remove clothing in Wardrobe and return to Outfits; generate again and confirm current details/availability. Change clothing in a second session before Show more; stale paging clears results and asks for regeneration.
5. Block `/api/account/outfits` in browser network tools or go offline during Show more. Existing cards stay visible; Retry more outfits resumes without duplicates. Sign out/switch accounts during a pending request; no old private results appear.
6. At phone width, verify readable cards, no page overflow and reachable actions above bottom navigation. Use Tab/Enter for filters, generation, Show more and garment details; appended result focus should be visible. Signed-out visitors still see at most three outfits and working signup/sign-in prompts when configured.

No extra user setup or approval is needed to try this implementation in the already configured test project. Changes are locally committed on the issue branch; no #31 push, main merge, issue closure or production deployment is authorized by implementation approval alone.
