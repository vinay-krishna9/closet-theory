# Personal Stylist — MVP User Flows

Status: consolidated planning draft for review, 7 November 2026. Read with `MVP.md` and `design.md`. Technical mechanisms and unresolved cases remain for architecture planning.

## 1. Visitor gets a first outfit

Landing → Try with quick-add clothes → select garment types and named colors → visitor wardrobe → choose season/formality or Any → Suggest outfits → up to six results → Show more when available.

- Start with no garments selected. Do not preload a demo wardrobe.
- Explain: select clothes you already own; sample photos are illustrative.
- Permit editing tags and removing selections. Persist selected catalog clothes in this browser and disclose that they are not synced.
- If a required group is absent, identify it and link directly to its catalog choices. Complete outfits require top, bottom and shoes.
- If the wardrobe is sufficient but filters eliminate all matches, explain the result and offer relaxed filters. Never silently change filters.
- Keep account benefits visible: save/sync the wardrobe, upload photos, favorite outfits and log wears. Visitors do not receive functioning favorite/wear controls.
- If browser persistence is unavailable, preserve in-memory use and clearly explain the limitation rather than blocking suggestions.

## 2. Signup preserves selected clothes

Visitor wardrobe or landing → Create account → Google or email/password → successful account creation/authentication → automatic import of selected quick-add clothes → personal wardrobe.

- Explain automatic carryover before signup. No extra import-choice dialog.
- An empty visitor selection creates an empty personal wardrobe; no catalog defaults are silently added.
- Do not treat import as successful until the server confirms it. Preserve local source selections on failure; offer retry without duplicate items.
- Cancellation/authentication errors keep visitor selections intact and allow continued visitor use.
- If signup succeeds but import fails, state that the account exists and the wardrobe import needs retry. Do not force another signup.
- After successful import, avoid re-importing the same selections on later refreshes or sign-ins. Existing-account sign-in also imports selections automatically. Retry idempotency is required; skip an exact active catalog-configuration match, including applicable customizations; keep broader matches distinct. Sign-out clears account data and starts fresh visitor state.

## 3. New account starts a wardrobe

Account with no items → choose Quick-add clothes or Upload a photo → add clothes → personal wardrobe → Suggest outfits.

- The setup choice can be skipped. Skipping opens an honest empty wardrobe with both entry points available.
- Quick-add and photo items coexist. Show what required outfit groups remain missing without blocking access to other pages.

## 4. Add one photographed garment

Add item → upload one image → validate → background removal → review preview → choose Group → Type → confirm editable color, formality and seasons → Save item → wardrobe card → optional Add another.

| State | Required behavior |
| --- | --- |
| Invalid file | Explain what is unsupported; allow another file |
| Processing | Show honest status, cancel/reselect access; keep form usable |
| Successful cutout | Preview; allow retry or original if the cutout is poor |
| Processing failure | Retry, Use original, Choose another photo; preserve tags |
| Invalid tags | Associate errors with fields and focus the first invalid field |
| Upload/save failure | Keep recoverable work and offer retry; no fake success |
| Saving | Prevent duplicate submission |
| Saved | Confirm success, update wardrobe without resetting filters/scroll |
| Add another | Reset editor only after the prior save succeeds |

Group/type options match the release catalog: Tops → T-shirt/shirt/sweater; Bottoms → jeans/chinos/shorts; Shoes → sneakers; Outerwear → jacket. Type selection must not become invalid if the group changes.

Desktop/tablet uses the side drawer; below 768px uses the full-screen editor. Unsaved close/cancel offers a discard confirmation. Focus returns to the opener on close; form/footer remains usable with the mobile keyboard.

## 5. Manage saved clothes

Wardrobe → search/filter → open item → edit tags or replace photo → review → save → updated card.

- Quick-add items start with editable defaults; replacing their sample image preserves item identity/history.
- Retain existing media until replacement saving succeeds.
- Delete is separate from Save, with explicit confirmation and consequences. Keep historical wears, remove personal images, display matching catalog imagery or a placeholder, and exclude removed items/dependent outfits from new suggestions. Never promote a removed item into the shared catalog.
- Distinguish empty wardrobe, no filtered matches and failed loading. Provide Add clothing, Clear filters or Retry respectively.
- No item-favorite controls or filter.

## 6. Account holder chooses an outfit

Outfits → season/formality filters → Suggest outfits → up to six eligible compositions → inspect reason/items → optional Favorite or Not for me → optional I wore this.

- All suggestions start with no opinion unless persistent preference already exists.
- Feedback is optional. Activating a reaction selects it and clears the opposite; activating the selected reaction clears to neutral.
- Order eligible favorites first, neutral next; disliked hidden unless Show disliked is on, then last. Maintain stable score ordering within groups.
- On feedback failure, reconcile any optimistic state and offer recovery; do not falsely show a saved preference.
- Show more appends additional distinct compatible results without losing existing feedback or focus.
- No numerical ranking scores. Explanations describe the actual matching rules.

## 7. Log wear and inspect statistics

Outfit → I wore this → record today → confirmation with Undo → Statistics updates.

- One intentional event updates the outfit and constituent item records consistently. Retries must not multiply records.
- Undo reverses the same event and its item effects. If it fails, explain the remaining saved state and offer recovery.
- Favorite/disliked/neutral preference does not block intentional wear logging.
- Statistics shows all-time totals including valid historical wears of removed items; current most/least/never-worn lists include active items only. Explain an empty history and link to suggestions.
- Distinguish zeros from failed data loading. Do not invent a demo history for a real account.

## 8. Navigation and account boundaries

- Public landing uses public navigation. Visitor wardrobe/outfits must remain usable without authentication; do not present an active personal Statistics page for visitors. Visitors see Wardrobe, Outfits and Sign in/Create account only, adapted to small screens without Statistics or Profile destinations.
- Signed-in desktop/tablet: top navigation for Wardrobe, Outfits, Statistics and account/Profile.
- Signed-in mobile: Wardrobe, Outfits, Statistics and Profile bottom links, with safe-area clearance.
- Personal photo uploads, private data and writes require authorization at the server/storage boundaries, not just hidden controls.
- Expired sessions preserve recoverable local form work where safe and explain that authentication is needed. Do not discard unsaved work silently.
- Sign-out clears private client data and starts a fresh visitor wardrobe. Clerk handles Google/email-password authentication. Require verified email/password identity before personal saving/import, preserve visitor selections meanwhile, and include Forgot password. Account deletion requires recent authentication and confirmation. Backup retention and cleanup mechanics remain technical release tasks.

## Next planning deliverables

1. Review these flows and resolve the flagged user-facing edge cases.
2. Define architecture/data model, service choices and image-processing strategy.
3. Break delivery into end-to-end milestones and issues with explicit acceptance checks.
4. Track delivery on the existing [Closet Theory MVP board](https://github.com/users/vinay-krishna9/projects/1), with [21 repository issues](https://github.com/vinay-krishna9/closet-theory/issues). Initial status columns are Todo → In Progress → Done; no task is automatically authorized for implementation.

## Resolved PLAN-02 decisions

Follow [agreed product decisions](product-decisions.md) for optional quick-add customization, exact matching versus similarity warnings, upload/catalog photo choice, season/formality/jacket rules, style-first diverse ranking, patterns, verification, timezone, Undo and visitor navigation. These decisions supersede older provisional wording; only technical defaults and implementation checks remain open.

Quick-add → choose type/color → Add basic item or Customize → resolve existing-item warning → save. Upload → review image → confirm tags/customizations → resolve similarity → choose uploaded or matching catalog photo → save one garment. Signup/sign-in → verify identity if required → automatically import nonmatching selections once. Keep local data until success.
