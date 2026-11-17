# ENGINE-01 — Deterministic matching and reasons execution plan

Status awaiting implementation approval, 17 November 2026.

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

Completion requires the engine, adapter, meaningful tests, integration contract and updated implementation evidence. The current document records planning only. Implementation checks and performance measurements are pending.
