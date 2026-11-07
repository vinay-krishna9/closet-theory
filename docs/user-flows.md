# Personal Stylist — MVP User Flows

Status: consolidated planning draft for review, 7 November 2026. Read with `PRD.md` and `design.md`. Technical mechanisms and unresolved cases remain for architecture planning.

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
- After successful import, avoid re-importing the same selections on later refreshes or sign-ins. Existing-account merging and post-logout browser behavior need an explicit architecture/product decision.

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
- Delete is separate from Save, with explicit confirmation and consequences. Historical-record behavior must be settled before implementing deletion.
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
- Statistics shows all-time totals and most/least/never-worn lists. Explain an empty history and link to suggestions.
- Distinguish zeros from failed data loading. Do not invent a demo history for a real account.

## 8. Navigation and account boundaries

- Public landing uses public navigation. Visitor wardrobe/outfits must remain usable without authentication; do not present an active personal Statistics page for visitors. Final visitor-shell placement is a wireframe decision.
- Signed-in desktop/tablet: top navigation for Wardrobe, Outfits, Statistics and account/Profile.
- Signed-in mobile: Wardrobe, Outfits, Statistics and Profile bottom links, with safe-area clearance.
- Personal photo uploads, private data and writes require authorization at the server/storage boundaries, not just hidden controls.
- Expired sessions preserve recoverable local form work where safe and explain that authentication is needed. Do not discard unsaved work silently.
- Sign-out, password recovery, verification, deletion and existing-account import edge cases need detailed acceptance criteria in the architecture/backlog phase.

## Next planning deliverables

1. Review these flows and resolve the flagged user-facing edge cases.
2. Define architecture/data model, service choices and image-processing strategy.
3. Break delivery into end-to-end milestones and issues with explicit acceptance checks.
4. Create an issue board after the repository and board location are selected. No external board has been created yet.
