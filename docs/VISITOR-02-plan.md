# VISITOR-02 — Local wardrobe persistence execution plan

Status: approved and implemented locally, 16 November 2026. Branch `visitor/02-local-persistence`, created from main at `b22f2c9`. The user approved execution after reviewing this plan.

Tracked in [issue #8](https://github.com/vinay-krishna9/closet-theory/issues/8) under M2 — Visitor wardrobe and suggestions. VISITOR-01 and VISITOR-03 are merged. Follow [architecture](architecture.md), [product decisions](product-decisions.md) and [design.md](../design.md).

## Change

- Restore visitor clothing after refresh and reopening the same browser. Preserve selection IDs, customizations, order and intentionally separate garments.
- Explain that selections are saved only in this browser and can be lost when browser data is cleared. Show an honest persistent notice when saving is unavailable.
- Add Clear visitor wardrobe with a confirmation describing the loss of local selections. Cancel preserves everything; confirm returns to the empty wardrobe.
- Keep quick-add, editing and removal usable in memory when storage fails. Recovery must preserve current work.

## Implementation

### 1. Versioned storage boundary

- Add `src/features/wardrobe/visitor-storage.ts` with pure decoding/validation and a small browser-storage adapter. Use existing tooling and `localStorage`; no new dependency or service is required.
- Use the namespaced key `closet-theory.visitor-wardrobe` and a versioned envelope containing `version` and `items`. Persist only allowed catalog references, selection IDs and editable garment tags. Derive images and groups from the catalog. Exclude image bytes, arbitrary URLs, tokens, account data, notices and search/filter state.
- Validate parsed JSON as unknown input before calling typed model helpers. Check supported type/color/detail combinations, names, seasons and unique nonempty IDs. Reconstruct allowed fields instead of passing arbitrary properties into application state.
- Keep intentionally identical garments with different IDs. Do not restore through ordinary Add deduplication or generate replacement IDs during hydration.
- Include an explicit migration dispatcher. Version 1 is the first shipped format, so there is no real older schema to invent. Test the migration boundary and document how future versions add fixture-backed migrations. Reject unsupported older and future versions safely.
- Treat malformed or unsupported payloads as unavailable saved data. Preserve the original storage value, explain the problem and suspend automatic writes until explicit reset. Do not silently discard individual garments or overwrite an unreadable wardrobe.

### 2. Safe provider lifecycle

- Extend `visitor-provider.tsx` and the reducer with validated restore/reset operations and separate persistence status. Keep ordinary add/edit/remove rules intact.
- Read storage on the client after hydration. Do not write the initial empty state over saved items. Prevent edits until restoration finishes, using a concise accessible loading status and the shared Spinner where appropriate. Avoid a misleading empty-wardrobe flash.
- Persist completed item changes after restoration. Catch both storage access and write/quota failures. Preserve in-memory changes and expose an accurate warning rather than claiming they were saved.
- Offer Retry saving for a recoverable write failure, using the current in-memory wardrobe. Clear/reset affects only this feature's storage key and state. If clearing storage fails, explain that older saved selections may return after reload.
- Guard initialization and effects against React Strict Mode repeats. Keep persistence warnings separate from transient item announcements so an Add confirmation cannot hide a storage failure.
- Initial scope is restoration and saving in the same browser. Live cross-tab merging is deferred. Detect external changes to this key, pause automatic writes and ask the visitor to reload to use that saved version or explicitly keep/save their current wardrobe. Do not silently overwrite another tab's changes.

### 3. Visitor surfaces and documentation

- Replace reset-on-refresh copy in `quick-add.tsx`, `wardrobe.tsx` and `item-editor.tsx` with wording driven by actual persistence status. Keep successful item actions distinct from successful browser saving.
- Place browser-storage disclosure and persistent recovery controls near existing visitor notes. Reuse current buttons, status styles and confirmation dialogs. Follow design.md for keyboard focus, destructive-action confirmation and responsive layout.
- Clear visitor wardrobe resets selections and wardrobe filters after confirmation; it does not clear unrelated browser storage. Keep the clear/recovery action available when stored data cannot be read.
- Update README and the architecture's current-state paragraph after implementation. Record actual results in this plan and update issue #8 when authorized. Authentication/import, outfit matching and personal photo storage remain their existing later tasks.

## Checks

- Unit tests for valid round trips, explicit field serialization, preserved IDs/duplicates, invalid JSON and field shapes, duplicate IDs, unsupported versions and migration dispatch. Exercise blocked reads, blocked writes and quota errors through the adapter.
- Provider/component tests for hydration before writes, repeat initialization, retained edits on failure, retry with the latest items, reset confirmation/cancel, failed reset and external storage changes.
- Update the existing reload-reset browser test to assert persistence. Cover add → customize → reload → edit → reload → remove → reload, same-browser reopening, intentional duplicate garments and explicit clear followed by reload.
- Browser recovery tests for corrupted data, unknown versions and unavailable storage. Confirm usable in-memory actions, accurate notices and preservation of unreadable data until reset.
- Review desktop and mobile, keyboard/focus, 320px reflow, reduced motion and accessible loading/error announcements. Confirm visitor account-only restrictions remain unchanged.
- Run `npm.cmd run check`, `npm.cmd run build`, then `npm.cmd run test:e2e -- --workers=2` with port 4174 free. Record actual evidence and unverified device/browser behavior before declaring completion.

## Next delivery steps

1. Review the implemented VISITOR-02 changes and completion evidence for issue #8.
2. Prepare ENGINE-01 (#9), the pure deterministic outfit rules and explanations.
3. Prepare OUTFITS-01 (#10), connecting visitor filters and result cards to that engine.
4. Complete SPIKE-02 (#4) before account/private-data implementation.

Implementation was authorized by the user. Commit, push and merge require separate explicit requests.

## Completion evidence

Implemented locally on 16 November 2026. The provider restores a validated version-1 payload after hydration, then saves completed reducer actions. Wardrobe and Quick-add show a restoration status before allowing edits; Home remains available immediately. No empty initialization write occurs. Item IDs, order and intentional duplicates survive reload. Confirmed clearing resets only the visitor storage key, items and wardrobe filters. Retrying a failed clear requires confirmation again.

Unreadable/unsupported data remains untouched during memory-only use. Failed saves retain edits and Retry saving writes the latest wardrobe. Storage changes from another tab pause automatic saving; explicit reload or keep/save resolves the choice. Automatic saving also compares against the last stored value before writing to catch a delayed storage event. Serialization reconstructs only supported catalog references and garment fields.

| Verification                                                                | Actual result                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`                                                         | Passed formatting, lint, type checking and 54 unit/component tests in 9 files after the final change                                                                                                |
| `npm.cmd run build`                                                         | Passed after the final change                                                                                                                                                                       |
| `npm.cmd run test:e2e -- --workers=2`                                       | All 48 desktop/mobile Chromium checks passed in 36.2 seconds                                                                                                                                        |
| Focused persistence browser suite after the final retry-confirmation change | All 12 checks passed in 9.1 seconds                                                                                                                                                                 |
| Responsive and accessibility review                                         | Desktop and mobile recovery screenshots inspected; browser checks cover 320px reflow, reduced motion, confirmation Cancel focus and focus restoration, plus existing shell keyboard/contrast checks |
| `git diff --check`                                                          | Passed                                                                                                                                                                                              |

The browser journeys cover customized add/edit/remove across reload, stable duplicate identities, same-context page reopening, confirmed clear/cancel, corrupt/unsupported schemas, blocked reads/deletes, failed writes with retry, and actual cross-tab storage events. Existing shell expectations were updated because reset-on-refresh is no longer the intended behavior. The initial browser run exposed those two obsolete assertions; the corrected full suite passed. Restricted-process cleanup stalled after that initial run, so successful reruns used elevated local process permissions for Playwright cleanup.

No dependencies, account operations, services or database changes were introduced. Version 1 is the first shipped format; unsupported older versions are rejected rather than assigned a fictional migration. Future schema changes require real migration fixtures. Cross-tab conflict detection does not provide atomic transactions for simultaneous writes. Physical devices, Safari/Firefox and a full screen-reader session remain unverified. Remote CI and merge evidence are tracked in the pull request and issue #8. The user authorized commit, push, merge and issue updates on 16 November 2026.

## Acceptance audit

- [x] Catalog selections survive refresh and same-browser reopening with stable IDs, customizations, order and intentional duplicates.
- [x] Corrupt, unsupported and blocked storage preserves usable in-memory behavior and exposes an honest notice. Unreadable saved data is retained until confirmed clearing.
- [x] Only supported catalog references, IDs and garment tags are serialized. Photos, arbitrary URLs, tokens and account data are excluded.
- [x] Confirmed clearing, cancellation, failed clearing, failed saving/retry and cross-tab conflict choices are covered by tests.
- [x] Version dispatch and rejection of unsupported schemas are tested. There is no older shipped schema requiring a real migration yet.
- [x] Visitor account-only restrictions remain intact. Relevant checks, responsive review and documentation are complete within the limitations above.
