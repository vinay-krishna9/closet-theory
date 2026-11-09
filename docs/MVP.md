# Personal Stylist — MVP Product Requirements

Status: consolidated planning draft for review, 7 November 2026. Records agreed product decisions; does not authorize implementation, service provisioning or deployment.

## Purpose

Help people who struggle to combine clothes they already own find an outfit they can wear today. This is a published portfolio product with real account, storage and recommendation behavior.

Core promise: select or upload clothes you own, then receive understandable, rule-based outfit suggestions.

## Release scope

### Visitors

- Use the actual quick-add catalog without an account; there is no separate sample demo mode or prefilled wardrobe.
- Select garments they own, choose named common-color swatches, edit/remove selections and request outfits.
- Use season and formality filters.
- Retain selected catalog clothes in the same browser until cleared. Clearly state that browser data is not synced or guaranteed against browser storage clearing.
- No personal photo uploads, favorites, wear logging or wear statistics before authentication. Explain account benefits without interrupting browsing.

### Account holders

- Sign up/sign in using Google or email/password.
- Automatically import visitor-selected catalog clothes into their account wardrobe after signup or sign-in to an existing account. Explain this beforehand; do not ask them to select the same clothes again. Prevent duplicate imports and retain local selections until server persistence succeeds.
- Upload and manage personal clothing photos, alongside quick-add items.
- Favorite/dislike outfits, record wears and view all-time statistics.
- Access their private wardrobe across authenticated devices.

## Quick-add catalog and clothing classification

| Group | Launch types |
| --- | --- |
| Tops | Solid T-shirt, shirt, sweater |
| Bottoms | Jeans, chinos, shorts |
| Shoes | Sneakers |
| Outerwear | Simple jacket |

Use realistic, appropriately licensed sample photos and named common-color swatches per garment. Label sample imagery; selections represent clothes users already own. Do not add unselected catalog clothes automatically. Replacing sample imagery with a personal photo preserves item identity and history.

Quick-add items have editable category/type, color, formality and season defaults. Clothing groups define outfit slots; types refine classification, such as Bottoms → Jeans. No custom color picker is required at launch.

## Photo upload and item management

- Add one garment at a time, with Add another after successful saving.
- Automatically attempt background removal; show a preview before saving.
- Offer Retry, Use original and Choose another photo. Failure must not force a new photo or silently save the original.
- User chooses group/type and confirms formality and seasons; detected dominant color is editable. Preserve form work on recoverable errors.
- Desktop uses a side drawer; mobile uses a full-screen editor. Keep group/type choices consistent with the catalog.
- Users can edit and remove their items. Removal preserves wear history, excludes the garment and dependent outfits from new suggestions, and deletes personal images. History displays an existing matching catalog photo or placeholder; nothing is added to the shared catalog. No individual-item favorites.

## Outfit suggestions

- A complete outfit has one top, one bottom and shoes; a jacket is optional.
- Filters: season and casual/smart-casual/formal, each with Any available.
- Show up to six compatible suggestions initially. Show more only when additional matches exist. Never fabricate results to reach six.
- Compose garment images on one restrained neutral/tinted canvas per outfit and provide a short reason based on actual matching rules.
- Matching is deterministic: compatibility, freshness and personal preference are independently testable. Internal ranking scores are not displayed.
- Eligible favorites appear first, neutral suggestions next. Disliked outfits are hidden by default; Show disliked reveals them last. Availability and active filters still apply to favorites.
- Account preference is one value: favorite, neutral/no opinion or disliked. Heart means Favorite; CircleSlash means Not for me. No stars, thumbs or separate favorite field. No opinion is valid and requires no action. Clearing active feedback returns to neutral.

## Wear tracking and statistics

- I wore this records today immediately, with confirmation and Undo. Guard rapid clicks and retries against accidental duplicate events.
- Log an outfit and its constituent items consistently. Preserve stable outfit identity from sorted item IDs.
- Show all-time outfit wears, item wear counts, most worn, least worn and never worn. Lifetime totals include valid wears of removed items; current most/least/never-worn lists include active items only. Explain outfit-event counts versus summed item counts.
- Date-range filters, retrospective wear entry and detailed history editing are not launch requirements.

## Experience, privacy and quality

- `design.md` governs appearance, accessibility, navigation, motion, image handling and the warm stone/charcoal palette. This PRD governs release scope; identify conflicts before implementation.
- Show distinct loading, empty, no-match, error and recovery states. Essential actions work on touch and keyboard.
- Enforce owner-only data/media access. Use isolated test data; no private photos in fixtures or analytics.
- Provide accurate privacy information, account/data deletion access and documented retention behavior before release.
- Unit tests cover recommendation rules; integration tests cover persistence and authorization; browser tests cover important complete journeys. Review mobile and desktop UI.

## Outside the MVP

Shopping/affiliate links, outfit scheduling, AI-generated recommendations, theme toggle, separate demo mode, bulk photo upload, custom catalog color picker, individual-item favorites and expanded date-range reporting.

## Success and release gates

The main success outcome is that a new visitor can select a sufficient wardrobe and obtain an understandable compatible outfit, then sign up without re-entering selections.

Release requires working visitor suggestions, successful account import, photo upload and fallback, private persistence, feedback, wear logging/Undo, accurate basic stats and responsive accessible UI. Relevant tests, checks and a production build must pass; report any unverified behavior honestly.

Do not invent usage targets or add analytics services implicitly. If product measurement is desired, decide metrics and privacy-conscious instrumentation separately.

## Decisions to resolve in architecture and delivery planning

- Confirm actual service configuration for the agreed Clerk authentication, Supabase database/private storage and Vercel hosting. Require email verification before personal saves/import; include password recovery and recent-auth confirmed account deletion. Exact OAuth/provider settings remain setup work.
- Define catalog color sets, assets and editable default tag values.
- Decide browser-storage schema/versioning and recovery when storage is unavailable.
- Implement retry-safe automatic import after signup or existing-account sign-in; skip exact active catalog-configuration matches (including applicable customizations), keeping the existing garment. Sign-out clears account state and starts a fresh visitor wardrobe.
- Validate tunable scoring thresholds, deterministic ties and candidate limits against the agreed style-first, diversity, pattern and seasonal-jacket rules in product-decisions.md.
- Specify retry-safe media cleanup and account deletion retention; item-removal history behavior is settled above. Implement the saved account timezone and 10-second accessible Undo; exact retry/persistence mechanics remain technical work.
- Validate the agreed browser background-removal approach on mobile; choose a compatible library/model and validate image limits/performance. A hosted processing alternative needs a new decision.

These are planning items, not permission to change settled product scope.

## Confirmed technical direction

Clerk authentication; Supabase Postgres/private storage; Vercel hosting; browser background removal with original fallback. Visitor selections use React context/reducer plus browser persistence; account data is stored server-side. See architecture.md for boundaries and implementation proposals.

## Resolved PLAN-02 decisions

Follow [agreed product decisions](product-decisions.md) for optional quick-add customization, exact matching versus similarity warnings, upload/catalog photo choice, season/formality/jacket rules, style-first diverse ranking, patterns, verification, timezone, Undo and visitor navigation. These decisions supersede older provisional wording; only technical defaults and implementation checks remain open.

Quick-add supports optional per-type customization; solid is a default, not a catalog restriction. All accounts use the saved timezone; verification gates personal writes. Outfit-only logging and account deletion/recovery are launch requirements.
