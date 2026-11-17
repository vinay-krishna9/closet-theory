# ENGINE-01 — Deterministic matching and reasons execution plan

Status implemented locally following user approval, 17 November 2026. Verification results and integration guidance are recorded below.

Tracked in [issue #9](https://github.com/vinay-krishna9/closet-theory/issues/9), M2 — Visitor wardrobe and suggestions. Its dependencies PLAN-02 (#2) and BUILD-01 (#5) are closed. The current repository supplies the catalog, stable visitor item IDs, editable tags and browser persistence. The production Outfits route currently shows an unavailable state.

Follow [product decisions](../product/product-decisions.md), [MVP requirements](../product/MVP.md), [user flows](../product/user-flows.md), [architecture](../technical/architecture.md), [development plan](development-plan.md) and [design.md](../../design.md). The numeric defaults below are proposals for this feature's approval and validation.

## Change

- Build a pure TypeScript engine that returns complete, eligible outfits with stable identities, deterministic ordering and short explanations derived from applied rules.
- Support season/formality filters, seasonal optional jackets, color/formality/pattern compatibility, smaller freshness adjustments and diversity among close-scoring outfits.
- Accept optional preference and wear inputs so the same rules can later serve account suggestions. Visitor calls use neutral preferences and empty history.
- Supply structured missing-group, filtered-out and generation-limit information for the visitor journey in OUTFITS-01 (#10).

## Implementation

### 1. Define the engine boundary and identity

- Add focused modules under `src/lib/outfits/`, with co-located Vitest tests. Separate the public contract, identity, eligibility, compatibility, freshness and generation/ranking where each has meaningful independent behavior.
- Accept immutable normalized items with stable ID, group, named color, formality, seasons, pattern and availability. Reuse existing catalog vocabulary through type-only imports. Keep runtime catalog lookup and conversion of `WardrobeItem` outside the core rules. Preserve deliberately separate garments with identical tags.
- Accept explicit season/formality values including Any, preference values keyed by outfit identity, optional item/outfit last-worn timestamps, an injected current timestamp and generation configuration. Reading browser storage, React context, the system clock or image data belongs to callers.
- Derive the canonical combination key from a collision-safe serialization of sorted item IDs. Use the complete canonical key for engine identity and deterministic ties. Account persistence can scope and hash that key at its boundary. A jacket changes the combination identity. Names, photo references, list order and scoring configuration do not change it.
- Return ordered candidates with slot/item IDs and structured reason codes plus display text. Keep ranking details internal. Return diagnostics separately, including missing required groups before and after filters and whether generation was exhaustive.
- Validate normalized inputs at the boundary. Reject duplicate/empty IDs, malformed tags, invalid time and invalid configuration with a structured error. Ignore stale preference/history references to unavailable combinations. Preserve input arrays and records.

### 2. Apply eligibility and completeness

- Exclude unavailable/removed items before applying filters or resolving preferences. Current visitor removal already removes the item from the input array. The normalized availability field supports later account removal.
- Require exactly one top, one bottom and one pair of shoes. Report missing required groups without adding catalog garments automatically.
- An explicit season requires every selected garment to include that season. Any adds no season restriction. Existing four-season arrays already represent All seasons.
- Map Casual, Smart-casual and Formal to adjacent ordered levels. Explicit formality accepts exact or adjacent item levels. Reject any complete combination containing both Casual and Formal, including through a Smart-casual intermediary. Any retains this garment-to-garment compatibility rule.
- Add a compatible owned jacket automatically for explicit Autumn/Winter requests. Evaluate jacket compatibility against the full base outfit. Choose the best compatible jacket deterministically for each base combination using the same style-first rules. Spring, Summer and Any produce jacket-free outfits.
- When no compatible jacket exists, retain the eligible base outfit and return an optional add-jacket hint. The reason must accurately describe jacket availability.

### 3. Implement transparent compatibility rules

- Use confirmed metadata for matching. Define an explicit named-color family/neutral table covering all 15 current color IDs. Keep this table separate from image hex values and decorative canvas styling.
- Start with explainable color preferences for neutral combinations, a neutral with an accent, and related color families. Color combinations affect ranking. Hard rejection comes from the documented eligibility rules. Validate examples such as white/indigo/white, navy/beige/white and multiple accent colors.
- Prefer exact requested formality and consistent garment levels. Adjacent mixtures remain eligible and receive an accurate styling explanation.
- Prefer zero or one patterned garment. Apply a bounded penalty for each additional patterned garment, including a jacket. Multiple patterns stay eligible.
- Generate reasons from rule results using a small set of templates and item/color references. Return at most two concise reasons plus an optional jacket hint. An explanation may mention a filter, color relationship, pattern balance or freshness only when the evaluated evidence supports it.

### 4. Rank style first, then freshness and close-score diversity

- Proposed style scale is 0–100, composed of color harmony up to 40 points, formality compatibility up to 40 and pattern balance up to 20. Store component calculations and constants centrally for review. Evaluate representative examples before settling the detailed color table and component values.
- Proposed freshness adjustment is 0–3 points, derived separately from item and combination recency with an injected timestamp and a seven-day saturation window. Missing history has no freshness effect. Clamp future timestamps to zero elapsed time and validate malformed timestamps. Visitor results therefore receive no invented wear-history explanation.
- Apply preference groups after eligibility. Favorites come first, neutral next, and disliked appear last only when requested. Absence of a preference means neutral. Preference persistence and controls are delivered in their account features.
- Within each group order by combined style/freshness, with a stable canonical-identity tie-break. Proposed diversity window is three style points. Within that window prefer less-repeated tops, then bottoms, retaining a maximum three-point style displacement from the best remaining candidate. Use identity as the final tie-break. Repeat garments when alternatives are exhausted.
- Compute the ordered result sequence once per complete request. Paging slices that sequence so later pages preserve earlier results and remain distinct. Any input change creates a new request.

### 5. Bound generation and expose its limits

- Stream combinations instead of materializing the full Cartesian product. Canonically sort inputs and use deterministic interleaved traversal across garment slots so input order cannot favor the first items.
- Proposed starting limits are 50,000 complete candidate evaluations and 240 retained generated candidates per request. Include jacket evaluations in the work budget. Keep a bounded best-candidate pool with top/bottom diversity representation, then apply final ranking.
- Evaluate supplied favorite combinations directly for availability, filters and jacket policy before ordinary generation, preserving eligible favorites when the generated pool is capped. Account for this work separately in diagnostics. Hidden disliked candidates must not consume the visible result pool.
- Treat an interrupted jacket search as incomplete evaluation. Never claim no compatible jacket exists solely because the budget ended.
- Return evaluated/retained counts and explicit truncation metadata. A budget-limited search with no results must remain distinguishable from an exhaustive no-match result. `hasMore` describes additional retained results, with search exhaustion reported separately.
- Compare bounded generation with an exhaustive reference on small fixtures. Validate larger wardrobes, rare compatible combinations, diverse slot coverage and deterministic budget boundaries before accepting these defaults. Record measured runtime and memory behavior with the actual machine/runtime. Adjust technical limits within the approved behavior when measurements justify it.

### 6. Prepare the visitor integration handoff

- Add a small pure wardrobe-to-engine adapter alongside the wardrobe model, deriving group through existing catalog lookup and copying only required matching fields. Test current catalog items and restored version-1 selections without changing their stored schema or IDs.
- Document the request/result contract and six-result paging usage for OUTFITS-01. That feature will connect the provider, filters, composition cards, recovery guidance and Show more to this engine.
- Update the README repository map and architecture's current engine status after implementation. Record actual verification and tuned defaults here, and link this plan from the documentation index.
- Existing tools cover the implementation. The proposed work adds no dependencies or schema changes.

## Checks

### Rules and identity

- Expected matches, rejected Casual/Formal mixtures, exact/adjacent formality and both Any filters. Explicit filters are never silently relaxed.
- Empty wardrobe, each missing required group, sufficient raw wardrobe with filter-eliminated groups and combinations that fail compatibility despite all groups being present.
- Multi-season and all-four-season items. Autumn/Winter jacket attachment, incompatible or unavailable jackets, jacket-free fallback, Spring/Summer/Any jacket exclusion and jacket-inclusive pattern/formality checks.
- Every supported color has a rule mapping. Representative neutral/accent/related-family examples yield the documented ranking and truthful reasons. Multiple patterns lower rank while preserving eligibility.
- Input permutations yield identical identity, candidates, reasons and ordering. Distinct IDs preserve distinct garments. Identity survives tag/name/photo changes, changes with jacket membership and avoids delimiter collisions.
- Invalid IDs, tags, time and limits produce the specified error. Inputs remain unmodified.

### Ranking and bounds

- Favorites/neutral/disliked grouping follows eligibility. Removed items and filtered favorites cannot reappear. Missing preference is neutral and hidden dislikes do not reduce visible capacity.
- With fixed time/history, repeated calls return the same order. Freshness uses the injected time, saturates at the configured boundary, handles future timestamps and cannot overcome a style gap larger than its allowance.
- Diversity stays within its configured style window and preference group. Exhausted alternatives permit repeats. Empty history has no effect or freshness claim.
- Exhaustive small-fixture comparison, exact budget boundaries, deterministic truncation, bounded retained memory, large wardrobes and sparse compatible candidates. Verify direct favorite evaluation and incomplete jacket-search diagnostics.
- Paging yields six or fewer distinct results initially and stable subsequent slices, with honest exhaustion/truncation information. Fewer valid outfits remain fewer outfits.

### Repository verification and evidence

- Run focused engine/adapter Vitest tests, then `npm.cmd run check` and `npm.cmd run build`.
- Run existing browser regressions with `npm.cmd run test:e2e -- --workers=2` after the build, with port 4174 free and server reuse disabled.
- This feature's delivery is a tested engine contract. Mobile/desktop result-card, keyboard and accessibility review accompanies the UI integration in OUTFITS-01. Record any unexpected UI changes discovered by existing regressions.
- Record actual commands, results, representative ranking examples, measured generation limits and remaining limitations before marking issue #9 complete.

## Approval and completion

Review this plan before implementation under the repository's AGENTS.md workflow. Scoring weights, freshness window, diversity window and generation limits above are proposed technical defaults. Implementation approval covers their measurement-driven tuning while preserving the settled product rules.

The user approved implementation on 17 November 2026. The following record describes the delivered engine, adapter and verification.

## Integration contract

Use `generateOutfits` and `getOutfitPage` from `src/lib/outfits/engine.ts`, `outfitIdentity` from `src/lib/outfits/identity.ts`, and request/result types from `src/lib/outfits/types.ts`. The pure wardrobe adapter is `toOutfitItems` in `src/features/wardrobe/outfit-items.ts`.

```typescript
const result = generateOutfits({
  items: toOutfitItems(wardrobeItems),
  filters: { season: 'Winter', formality: 'Any' },
  now: Date.now(),
});

if (result.ok) {
  const firstPage = getOutfitPage(result.candidates);
  const nextPage = getOutfitPage(result.candidates, firstPage.nextOffset);
}
```

The caller supplies the current timestamp in UTC milliseconds. Optional `history.items` and `history.outfits` contain last-worn timestamps in the same unit, keyed by item ID or canonical outfit identity. Account adapters must derive those timestamps from valid, non-undone events belonging to the current account. Missing history has zero effect. Future timestamps contribute zero elapsed time. Unknown valid history references are ignored. Malformed timestamps produce `ok: false` with `error.code` equal to `invalid-input` and a list of invalid fields.

Optional `preferences` maps canonical identity to favorite, neutral or disliked. Missing entries mean neutral. `showDisliked` defaults to false. Valid favorite combinations are evaluated directly before generated candidates. This preserves compatible favorite jacket choices even when ordinary generation selects a different jacket. Jacket-free Autumn/Winter favorites require the absence of an eligible compatible owned jacket. Caller identity scoping and persistence belong at the account boundary.

Successful results include slot IDs, identity, preference, up to two rule-derived reasons and an optional jacket hint. Public results omit scores. `outcome` distinguishes results, missing groups, filter-eliminated groups, incompatible combinations, hidden disliked results and budget-limited emptiness. Reasons reference owned item IDs. Patterned outfits can receive a pattern explanation, and known wear history can supply a freshness explanation.

`diagnostics.searchExhaustive` reports whether all base/jacket combinations in this request were considered. `poolTruncated` reports retention beyond the generated pool capacity. `evaluations` counts ordinary base/jacket work, while `favoriteEvaluations` reports direct favorite checks separately. Eligible favorites can increase the final result count beyond the 240-generated-candidate cap. `incompleteJacketSearches` reports a budget interruption without making a missing-jacket claim. `hiddenDisliked` counts generated suggestions suppressed by preference.

`getOutfitPage` returns `candidates`, `nextOffset` and `hasMore`, with at most six candidates per page. `hasMore` covers retained results. Read the diagnostics separately to understand search/retention limits. Preserve the generated sequence while appending pages. Regenerate on wardrobe, filter, preference or wear-history changes. Visitor integration must wait for wardrobe restoration before treating its items as a completed input snapshot.

## Delivered defaults and representative results

- Color rules explicitly cover all 15 current named colors. Neutral palettes receive 40 color points. One accent family with neutral pieces receives 38, an all-accent related family receives 36, and mixed accent families receive 22. Color affects ranking while eligibility enforces the documented season/formality rules.
- Formality contributes up to 40 points. With Any, matching levels receive 40 and an adjacent mixture receives 32. An explicit formality uses 30 plus up to 10 for the fraction of exact matches, less four for an adjacent mixture. Casual/Formal combinations remain ineligible.
- Patterns contribute 20 points for zero/one patterned garment, then 12, four and zero for two, three and four patterned garments. This includes jackets.
- Freshness averages known item/outfit elapsed times, capped at seven days, and adds zero to three points. Close-score diversity uses a three-style-point window and prefers less-repeated tops, then bottoms, within each preference group. Canonical identity resolves remaining ties.
- Under Any filters, solid casual navy/beige/white scores 100 internally, white/indigo/white scores 98, and burgundy/indigo/white scores 82. These examples use metadata only. Adding a second patterned piece reduces style by eight points. Public candidates expose the matching explanations.
- Default work is capped at 50,000 base/jacket evaluations and retention at 240 generated candidates. Requests may set smaller positive integer limits through `limits.maxEvaluations` and `limits.maxCandidates`. Values above the defaults or malformed limits are rejected.

Measured on Windows x64 with Node 22.18.0, using in-memory CommonJS transpilation of the production TypeScript modules in one Node context. These are single-run local observations. Heap growth is the change in `heapUsed` during the call, including temporary allocations, rather than a peak-memory measurement.

| Synthetic wardrobe                          | Filter | Elapsed | Evaluations | Retained | Search exhaustive | Heap growth |
| ------------------------------------------- | ------ | ------- | ----------- | -------- | ----------------- | ----------- |
| 10 tops, 10 bottoms, 10 shoes, four jackets | Any    | 25 ms   | 1,000       | 240      | Yes               | 4.0 MiB     |
| Same wardrobe                               | Winter | 27 ms   | 5,000       | 240      | Yes               | 6.6 MiB     |
| 50 tops, 50 bottoms, 50 shoes, four jackets | Any    | 521 ms  | 50,000      | 240      | No                | 7.3 MiB     |
| Same larger wardrobe                        | Winter | 132 ms  | 50,000      | 240      | No                | 6.1 MiB     |

All examples use compatible solid garments to exercise generation and pool retention. The larger wardrobe has 125,000 possible base combinations. The product is streamed up to the work budget. Browser/mobile execution speed and interactive scheduling require validation during OUTFITS-01.

## Repeatable user verification

1. From the repository root, run `npm.cmd test -- src/lib/outfits src/features/wardrobe/outfit-items.test.ts --reporter=verbose`. The output names each rule and recovery case. All engine/adapter tests should pass.
2. Run `npm.cmd test -- src/lib/outfits/engine.test.ts -t "optional seasonal jackets" --reporter=verbose`. Verify the named Autumn/Winter attachment, Spring/Summer/Any exclusion and incomplete-search cases pass.
3. Run `npm.cmd test -- src/lib/outfits/engine.test.ts -t "preferences, bounds and paging" --reporter=verbose`. Verify preference grouping, retained favorites, distinct pages and budget behavior pass.
4. Run `npm.cmd test -- src/lib/outfits/rules.test.ts --reporter=verbose` to inspect color, pattern, freshness and diversity checks. Run `npm.cmd test -- src/features/wardrobe/outfit-items.test.ts --reporter=verbose` to verify version-1 restored selections feed the engine with their original IDs.
5. Run `npm.cmd run build`, then `npm.cmd run test:e2e -- --workers=2` with port 4174 free to verify the existing desktop/mobile visitor journeys. OUTFITS-01 (#10) supplies the visitor filter/result-card integration and its interactive acceptance steps.

## Completion evidence

Implemented locally on 17 November 2026 in eight engine/rule/test modules and the wardrobe adapter with its co-located test. The approved 50,000-evaluation, 240-generated-candidate, seven-day freshness and three-point freshness/diversity defaults were retained after the representative checks above.

| Verification                                                 | Actual result                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`                                               | Passed 130 tests in 12 files, including 76 engine/adapter tests                                                         |
| Final public pattern-reason assertion                        | Rules suite rerun passed all 11 tests after adding this assertion                                                       |
| `npm.cmd run lint`                                           | Passed                                                                                                                  |
| `npm.cmd run typecheck`                                      | Passed                                                                                                                  |
| `npm.cmd run build`                                          | Passed production compilation, TypeScript and all static routes                                                         |
| `npm.cmd run test:e2e -- --workers=2`                        | Passed all 48 desktop/mobile Chromium checks in 36.8 seconds on the completed rerun                                     |
| Formatting of new source and changed formatted documentation | Passed                                                                                                                  |
| `npm.cmd run check`                                          | Passed formatting, lint, type checking and all 130 tests after resolving the 14 Windows checkout line-ending mismatches |
| Local documentation links                                    | All 165 checked Markdown/HTML references resolve                                                                        |
| `git diff --check`                                           | Passed                                                                                                                  |

The initial engine test run exposed insufficient bottom diversity in the retained pool. Retention now removes overrepresented tops/bottoms among similarly scored candidates, and the regression passes. The first browser run reported success for all cases but stalled during restricted-process cleanup. Its specific runner/server processes were stopped, then the suite was rerun with elevated local process permissions and exited successfully. Port 4174 was free before that rerun.

The tests cover exhaustive small fixtures, sparse compatibility, default large-wardrobe work/retention limits, stable identities and ties, both Any filters, direct favorite eligibility, hidden disliked results, seasonal jackets, incomplete searches, truthful explanations and version-1 storage adaptation. Existing browser coverage exercises mobile/desktop layouts, focus, reduced motion and visitor recovery. The feature adds pure logic and its adapter. Interactive engine integration, physical-mobile engine performance, Safari/Firefox and live account inputs remain unverified until their respective features.

Formatting follow-up on 17 November 2026 resolved the earlier 14-file failure. Those files already matched the committed LF content after normalization. Windows Git had checked them out as CRLF through its system `core.autocrlf=true` setting. The repository now uses `.gitattributes` with `* text=auto eol=lf`, matching the existing Prettier/EditorConfig convention and preserving automatic binary detection. All 14 normalized files were compared with their committed content, and a simulated Git checkout confirmed LF output. The complete `npm.cmd run check` passed after the fix.
