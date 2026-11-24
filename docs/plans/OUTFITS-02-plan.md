# OUTFITS-02 — Account suggestions and paging (#31)

Approved 24 November 2026. Branch `feat/31-account-outfits` starts from main at `101d5b5`, after #13/PR #34. Target main; remote delivery requires a separate explicit request.

## Checked implementation boundaries

1. Authenticated owner generation/paging using the existing active-wardrobe RPC and deterministic engine. Validate filters and page offsets, bind snapshots to owner/items/revisions/filters, reject stale or foreign snapshots. No client garment IDs or history/preferences accepted; use empty history/preferences until #16/#17. Existing engine bounds remain honest in the UI. No schema or dependency changes.
2. Reuse cards, filters and recovery UI. Six initial account results, append distinct six-result pages using Show more only when retained matches remain. Owner, wardrobe and filter changes cancel/discard results. Keep visitor allowance at three and update account availability messaging.
3. Unit/component, production build, visitor/entry regressions, and approved real-service desktop/mobile tests. Two temporary tagged Clerk development identities, synthetic catalog rows and owner-token guarded cleanup in test project `aghsipccmufzdtqwzxey`. Existing migration is already applied and will not be rerun. Inspect phone/desktop screenshots, keyboard/focus and reduced-motion behavior. Record actual results and manual checks before completion.

Implementation approval includes local checked checkpoint commits and the named temporary test fixtures/cleanup. No production deployment or migration is included.

## Server checkpoint — 24 November

Added `/api/account/outfits` using the existing token-scoped active-wardrobe operation. Requests accept only owner guard, validated filters and paging values. SHA-256 snapshots bind algorithm version, verified owner, complete item/revision data and filters. Every page reloads the current owner list; no client-supplied garment IDs or cached private result store is trusted. Generate with empty history/preferences and a fixed clock for repeatable paging; retain the existing 240-candidate/50,000-evaluation bounds and report bounded-search diagnostics.

Fourteen focused tests passed for one/exactly-six/more-than-six results, engine equality, distinct/repeatable pages, item revisions/removal/filter/owner snapshot conflicts, unsigned/unverified/origin/invalid-input denial, empty/filter outcomes and sanitized failures. Lint, type checks and relevant formatting passed. Hosted execution and UI verification remain for the following checkpoints.
