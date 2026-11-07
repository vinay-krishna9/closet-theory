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
- Automatically import visitor-selected catalog clothes into their account wardrobe after signup. Explain this beforehand; do not ask them to select the same clothes again. Prevent duplicate imports and retain local selections until server persistence succeeds.
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
- Users can edit and delete their items. No individual-item favorite feature.

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
- Show all-time outfit wears, item wear counts, most worn, least worn and never worn. Explain outfit-event counts versus summed item counts.
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

- Confirm Supabase and hosting setup; determine email verification, password recovery and OAuth configuration.
- Define catalog color sets, assets and editable default tag values.
- Decide browser-storage schema/versioning and recovery when storage is unavailable.
- Define retry-safe visitor import, including the existing-account sign-in case.
- Define recommendation weights, minimum compatibility, optional-jacket selection and tie-breaking.
- Specify deletion effects on historical outfits/wears, Undo persistence and user-facing date/timezone rules.
- Confirm background-removal implementation/provider, image limits and processing performance.

These are planning items, not permission to change settled product scope.
