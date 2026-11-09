# MVP product decisions — PLAN-02

Status: agreed, 7 November 2026. This record resolves the product choices discussed for issue #2. Technical defaults remain subject to implementation validation. It supplements MVP.md, user-flows.md, architecture.md and root design.md; it does not authorize implementation, provisioning, commits or deployment.

## Quick-add and customization

Choose a garment type and named color, then add the basic item immediately or optionally open Customize. T-shirts support neckline/collar, sleeve length and pattern choices; examples include crew/V-neck/polo, sleeveless/short/long sleeves, and solid/striped/checked/printed. Other garments expose only relevant options. Exact per-type option lists are implementation configuration to review, not permission to introduce new garment groups.

Solid is a default example, not a restriction on catalog clothing. Quick-add tags have sensible editable formality/season defaults. Uploaded garments require tag confirmation, including editable color and customization details needed for matching. These describe clothes the user already owns, not products to buy.

Keep shared catalog templates unique. Save customizations on the user's selected item rather than creating a new shared catalog record for every possible combination. Never add a private photo to the shared catalog. Use realistic licensed representative imagery; label it Representative image when it does not show the exact customization, and list the selected details. Do not pretend to render an exact photo for every combination.

## Similarity, exact matching and import

- Repeated clicks do not add copies of the same quick-add configuration. Add another explicitly if it is a different physical garment; use the similarity warning before saving.
- An exact configuration match includes garment type, named color, neckline/collar, sleeve length, pattern and every other applicable customization. Normalize equivalent defaults; missing or unknown details must not be treated as proof of equality. Removed items are not active duplicates.
- Broader type/color matches trigger You may already have this, not automatic merging. Show the existing item/photo with Keep existing, Replace photo/details (preserving item/history identity), and Add as a different garment after confirmation.
- Automatic visitor import after signup or existing-account sign-in skips an exact active catalog-configuration match and keeps the existing item. Import all other distinct selections once. Never overwrite personal images/tags merely because a visitor item looks similar. Preserve retry idempotency separately from semantic matching.
- After confirmed upload tags match a catalog configuration, suggest linking the garment to that template and choosing My uploaded photo or Catalog photo. Resolve an existing-wardrobe similarity warning first. Either image choice produces one personal item, not two garments or a new catalog template. Do not claim visual AI matching: the suggestion uses confirmed tags.

## Seasons, formality and jackets

- Item seasons: Spring, Summer, Autumn, Winter; allow multiple selections or All seasons. Store All seasons consistently as covering all four. An explicit season includes items tagged for it; Any imposes no season-filter restriction.
- Formality: Casual, Smart-casual, Formal. Prefer exact matches and allow adjacent levels with an accurate styling reason. Casual and Formal do not mix directly; Smart-casual is between them. Any removes the requested formality restriction, not compatibility rules between garments.
- A complete outfit needs top, bottom and shoes. Add a compatible jacket automatically only for explicit Autumn/Winter requests. If none exists, show the jacket-free outfit with an optional suggestion to add a jacket. Never imply the missing jacket is owned.
- Spring, Summer and Any results are jacket-free. Jackets stay optional; exact jacket selection/ranking numbers are technical defaults to validate.

## Ranking and patterns

Eligible favorites remain the first group, neutral next, disliked hidden unless revealed last. Within groups prioritize style compatibility; freshness is a smaller adjustment. Prefer varied tops/bottoms when scores are close, allowing repeats when needed. Diversity must not move neutral items ahead of eligible favorites or override compatibility.

Prefer at most one patterned garment; multiple patterned garments are allowed but receive a lower compatibility ranking, not an automatic exclusion. Pattern tags are user-confirmed/catalog metadata; no automatic image pattern recognition is required. Exact scoring weights, closeness thresholds, color-rule thresholds and performance bounds are tunable implementation defaults requiring tests and representative examples.

## Wear logging and timezone

Log complete outfits only in the MVP; update constituent item wear counts automatically. No standalone garment wear action on wardrobe cards.

Today uses a saved account IANA timezone initialized from the device; users can change it in Profile. Store UTC event timestamps plus the timezone/local date used for that event so later settings changes do not silently rewrite history.

Show Undo for 10 seconds after confirmed wear saving, then dismiss. Keep it keyboard accessible and pause dismissal while focused/hovered or being interacted with. This is a UI availability rule, not an authorization boundary enforced solely by a browser timer. Retry-safe Undo reverses the same event's effects once; exact server retry handling remains technical design. No history-editing feature is added by this decision.

## Authentication, deletion and visitor navigation

Clerk provides Google and email/password. Email/password accounts require email verification before personal saves or automatic visitor import. Preserve local visitor selections until verification and server persistence succeed; unverified users may continue visitor quick-add and suggestions. Do not add a redundant email challenge to an identity already verified by the provider.

Forgot password is included for password accounts. Profile includes account deletion with recent authentication and explicit confirmation. Account deletion removes personal wardrobe records, photos, preferences and wear history; it is distinct from preserving historical wears when removing one garment. Backup retention, cleanup retries and provider configuration must be documented before release, not invented as a product guarantee here.

Visitors see Wardrobe, Outfits and Sign in/Create account actions, without Statistics or Profile destinations. On small screens adapt those same visitor destinations; do not display signed-in bottom tabs exposing account-only routes. Signed-in navigation remains as defined in design.md. Sign-out clears account data and starts a fresh visitor wardrobe.

## Verification checklist

- [ ] Catalog selection/configuration uniqueness and repeated-click behavior; broader similarity warning does not silently merge.
- [ ] Exact import matches include customizations; different patterns/sleeves stay distinct; retries do not duplicate imports.
- [ ] Uploaded/catalog photo choice produces one item and preserves history on replacement.
- [ ] Multi-season/All seasons/Any; adjacent formality; winter no-jacket fallback; Any excludes jackets.
- [ ] Style dominates freshness; deterministic diversity preserves preference groups; patterned combinations are penalized rather than excluded.
- [ ] Account timezone, historical date stability, 10-second accessible Undo and outfit-only logging.
- [ ] Verification-gated saves/import, password recovery, recent-auth account deletion and visitor-only navigation.

Technical feasibility, exact configuration values, scoring/performance defaults and deletion/backup operations remain implementation tasks. This closes product discussion for #2 without claiming those tasks are already built or tested.
