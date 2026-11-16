# VISITOR-03 — Stable editor actions and custom loading spinner execution plan

Status updated 16 November 2026. Complete locally on `visitor/03-loading-spinner`, created from merged main at `f58bb20`. The user initially approved implementation of the shirt → dress → sneaker tracing animation on 15 November 2026. The later single-garment carousel supersedes the initial three-icon tracing design. Its final verification is recorded below.

Tracked in [issue #23](https://github.com/vinay-krishna9/closet-theory/issues/23) under M2 — Visitor wardrobe and suggestions. Builds on [VISITOR-01, issue #7](https://github.com/vinay-krishna9/closet-theory/issues/7).

## User need

Changing a color in Customize currently inserts “A loaded color preview is required before saving.” beside the footer actions. The extra content moves the buttons until the new garment image loads. Keep the actions stationary and communicate preview loading inside the primary button.

## Change

- Show a compact custom spinner inside Add to wardrobe while the selected garment preview loads. Apply the same behavior to Save changes when editing wardrobe clothing.
- Center the spinner in place of the action text while loading, then restore the text when loading ends. Preserve the label's layout space and accessible button name so button and footer positions stay stable.
- Remove the conditional footer helper sentence. Continue showing the reserved garment preview skeleton and explicit image-error recovery.
- Enable submission after the current type/color preview succeeds. Failed previews retain the draft and expose Retry photo. The spinner reflects active loading and stops on success or failure.

## Spinner appearance

Show one larger garment at a time, cycling from shirt to dress to sneaker. Each complete outline rests in the center, then slides left while the next garment enters from the right. The user requested this carousel after reviewing the small three-icon treatment. Preserve natural garment proportions within a larger shared frame.

| Property       | Chosen treatment                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Size           | Each garment is 2em square inside a 2.5em wide, 2em high clipped viewport; 28px icons at the current 14px action text size |
| Stroke         | Rounded 1.6-unit strokes in a 24-unit SVG viewBox                                                                          |
| Detail         | Curved shirt neckline and hem, shaped dress waist/skirt, rounded sneaker toe and sole/laces                                |
| Motion         | 3.6-second cycle with 1.2 seconds per garment, centered hold followed by a horizontal slide                                |
| Placement      | Centered over the action text in the same button area                                                                      |
| Ready/error    | Restore visible action text and remove the animation                                                                       |
| Reduced motion | Show one still shirt and retain the accessible loading status                                                              |
| Forced colors  | System text color outlines                                                                                                 |

Build the shared Spinner with full inline SVG outlines and CSS transform/opacity animation. Fixed negative phase offsets cycle the three stacked garments. The carousel is clipped within its own viewport. Existing content skeletons retain their layout role. Use the shared component in primary busy actions and the existing design-review loading row.

## Execution sequence

### 1. Connect preview states

- Extend `src/features/wardrobe/garment-photo.tsx` with an optional status callback for `loading`, `ready` and `error`. Preserve the existing `onReady` contract used by catalog cards.
- In `src/features/wardrobe/item-editor.tsx`, associate reported status with the selected type/color key. Derive the primary action's busy/readiness state from that key and status. A changed color immediately becomes loading, including a previously loaded color.
- Preserve the keyed preview remount and stale-result guard. Retry reports loading before another image attempt. Failure reports error and keeps the draft intact. Initial and cached-image loads must resolve correctly.

### 2. Render the custom spinner and stable actions

- Add `src/components/ui/spinner.tsx` and its CSS in `src/styles/components.css`. Use the installed React and CSS tooling with existing semantic colors.
- Overlay the centered animation on the action label. Hide the visible text during loading while preserving its layout size, and retain the button's accessible action name. Restore the visible label on success or error. Limit feature-specific layout styling to `src/styles/wardrobe.css`.
- Remove the conditional footer helper sentence responsible for the shift. Keep Cancel available and keep submission guarded until the selected preview is ready. Retain existing conflict/duplicate handling.
- Hide decorative spinner markup from assistive technology and set `aria-busy` on the primary action only during loading. Reuse the preview loading status. Inspect the actual disabled-button appearance for readable contrast.

### 3. Verify behavior and layout

- Extend `src/features/wardrobe/visitor-catalog.test.tsx` to exercise loading → error → retry → ready, including saved color and retained draft values. Check the busy state ends on failure and submission follows current preview readiness.
- Extend the held-image and failure/retry journeys in `tests/e2e/visitor-catalog.spec.ts`. Compare both footer button bounds and primary-label position before, during and after loading for Customize and Edit clothing. Cover rapid switching back to a cached color and late previous-color results.
- Use desktop and mobile Chromium projects, narrow 320px reflow and 200% text. Review keyboard color switching and focus, short landscape layout, static reduced-motion rendering and forced-colors visibility. Capture only the evidence needed for visual review.
- Run `npm.cmd run check`, `npm.cmd run build`, then `npm.cmd run test:e2e -- --workers=2` with port 4174 free. Use the existing verified worker setting. Record actual results and any device/assistive-technology limits.

### 4. Record completion

- Add actual implementation/check results to this document and update its status. Keep VISITOR-03 evidence with its own task.
- Update the editor interaction text in `design.md` to describe the implemented busy action and stable footer. Update the documentation index and issue #23 with actual results.

## Preview state behavior

| State                                 | Primary action                                                                          | Preview and recovery                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Initial load / selected color loading | Disabled, busy, centered spinner replaces visible action text; accessible name retained | Reserved image frame and existing loading skeleton/status           |
| Current preview ready                 | Visible action text; enabled when existing form/conflict rules permit                   | Selected garment image                                              |
| Preview failed                        | Visible action text, disabled, busy cleared                                             | Existing Photo unavailable and Retry photo controls, retained draft |
| Retry                                 | Disabled, busy, spinner visible                                                         | Same selected color reloads                                         |
| Late result for an earlier color      | Current action state follows the current selection                                      | Current preview retains control of readiness                        |

## Acceptance criteria

- Initial preview load, color switches and retry show the custom spinner inside the appropriate primary action.
- Cancel and Add to wardrobe/Save changes retain their positions and dimensions before, during and after loading at desktop and mobile widths, including enlarged text.
- Ready/error labels remain readable; loading replaces them with a centered spinner within the same button dimensions. The accessible action name persists.
- The primary action becomes available only after the currently selected preview loads successfully.
- Image failure stops the spinner, keeps submission disabled and preserves color and edited tags. Retry restarts loading and can recover.
- Rapid color switching cannot enable submission from an earlier preview result or save a mismatched image.
- Keyboard focus remains stable through preview updates. Reduced motion provides one still shirt with an accessible loading announcement.

## Preparation and documentation cleanup

- Created local branch `visitor/03-loading-spinner` and moved #23 to In Progress on the Closet Theory — MVP project board.
- Removed the completed VISITOR-01 plan from active docs and retained its approved version through an immutable Git link in the completion record. Current rules and evidence live in the product decisions, design, catalog asset record and VISITOR-01 completion record.
- Removed duplicate jeans/sneaker review PNGs after verifying matching SHA-256 values against the canonical studio sources, and updated the comparison page to reference those sources.
- Refreshed stale delivery status and recorded the passing PR #24 CI run. The unique T-shirt review sample, prompts, screenshots, completion records and required credits retain their purpose.

## References

- [Existing implementation and verification](VISITOR-01.md)
- [Catalog assets and provenance](catalog-assets.md)
- [Design system](../design.md), especially motion, accessibility and the item editor refinements

## Completion evidence

- Added the shared decorative `Spinner` in `src/components/ui/spinner.tsx`. Three inline garment paths trace in sequence, hold, fade together and repeat. `design.md` establishes this as the shared indeterminate loading treatment. The design-review loading row uses the same component.
- Following the user correction, Add to wardrobe and Save changes switch between centered animation during loading and visible action text when ready or failed. The label preserves its layout size and the button retains its accessible name. The footer helper sentence was removed. The editor tracks loading, ready and error for the current preview key, and the existing catalog-card readiness callback remains supported.
- Existing skeletons and Retry photo remain. Busy state ends on failure, retry restarts it, and current-preview success controls submission. Cached-color switches and late results retain matching image/color behavior.
- Short-screen header/footer spacing was compacted after the browser regression exposed insufficient field space at 320px with 200% text. The existing pinned-preview and keyboard-visibility checks pass with the new action width.
- The final `npm.cmd run check` passed formatting, zero-warning lint, TypeScript and all 25 unit/component tests across seven files.
- `npm.cmd run build` passed production compilation and route generation.
- `npm.cmd run test:e2e -- --workers=2` passed all 36 desktop/mobile Chromium checks. The suite checks both Add and Save, exact footer/button-label bounds across loading, initial/error/retry busy state, stale-image recovery and returning to a cached color. It samples actual animation progress for the shirt, dress and sneaker in order, checks static completed traces under reduced motion, and checks the system text color under forced colors.
- Visual review covered rendered desktop/mobile loading actions with all three outlines completed. Existing responsive journeys cover narrow reflow, 200% text, short landscape screens and keyboard focus. Physical-device, Safari/Firefox and full screen-reader review remain unperformed.
- The initial production animation check caught CSS shorthand optimization removing unnamed animation timing; explicit timing properties fixed the traced paths. Position comparisons now wait for the finite dialog entrance animation. The forced-color assertion resolves the active system text color so it works with either system palette.
- Sandboxed browser runs reached their assertions but hung during Windows server teardown. The final full browser run outside the sandbox exited successfully with all 36 checks passing in 34.7 seconds after the spinner/text switching correction.

The user requested committing the implementation and corrected the button treatment to switch between animation and text. The correction preserves the text layout while centering the spinner in the same space, with a persistent accessible action name. Browser regressions verify the hidden/restored visual label, centered animation and unchanged button bounds for both Add and Save. Remote CI for VISITOR-03 has not run.

## Motion refinement · 15 November 2026

The user requested more animated motion. The three garments now rise approximately `0.22em`, tilt by up to 10 degrees and scale to 110% in sequence, then settle into their original positions before the shared fade. The movement aligns with each trace using delays of 0, 528 and 1056ms within the existing 2.4-second cycle. The surrounding button retains its layout size. Reduced motion shows all three completed outlines with no transform.

`npm.cmd run check` passed formatting, lint, TypeScript and all 25 unit/component tests. The production build passed. All 36 desktop/mobile Chromium checks passed in 29.3 seconds using two workers. Browser assertions sample each garment's lift in order and verify still transforms with reduced motion, alongside the existing stable-button and tracing checks. Rendered mobile loading placement was visually reviewed. This refinement is uncommitted; the existing device and screen-reader limitations apply.

## Silhouette refinement · 15 November 2026

Following the user's request for nicer garment shapes, the shirt now has a curved crew neckline, shaped sleeves and a curved hem with a restrained seam. The dress has a V-neck bodice, defined waist, flared curved skirt and two pleat lines. The sneaker has a rounded toe, three lace marks, a separate sole line and a toe seam. The paths retain their existing tracing and lift animation.

`npm.cmd run check` passed all source checks and 25 unit/component tests. The production build passed. All four affected desktop/mobile Customize/Edit browser journeys passed in 6.6 seconds, covering tracing order, staggered lift, fixed button bounds, label switching, reduced motion and forced colors. The rendered phone loading action was visually inspected at its actual button scale. This refinement is uncommitted.

## Single-garment carousel · verified 16 November 2026

The user found the three-icon row too small and requested a larger carousel. The loader now shows a complete shirt, dress or sneaker in one shared center position. The SVG frame is `2em` square, twice the previous icon size, in a fixed clipped viewport. Each garment holds centrally and slides left as the next enters from the right. Phase offsets preserve the shirt, dress, sneaker order over a 3.6-second cycle. Natural silhouette proportions are retained. Reduced motion shows one still shirt. The animation continues to replace the visible button label while loading.

The source check passed formatting, lint, TypeScript and all 25 unit/component tests before the phase-offset correction. The production build passed after that correction. All six affected browser checks passed on 16 November using `npm.cmd run test:e2e -- --workers=2 --grep "color changes keep|review navigation"` in 20.3 seconds. Assertions inspect each centered garment and the transition positions, verify the enlarged SVG frame, stable button bounds, label switching, error recovery, stale results, reduced motion and forced colors. The design-review loading states also pass. Shirt, dress and sneaker frames were visually reviewed in the rendered desktop button.

The first carousel browser run caught the base animation shorthand overriding per-garment delays. Moving phase offsets to custom properties fixed the sequence. Automatic approval review then blocked the immediate rerun because its usage limit had been reached; verification resumed successfully on 16 November. Physical-device, Safari/Firefox and full screen-reader review remain unperformed.

## Final completion audit · 16 November 2026

The final single-garment carousel satisfies the scoped acceptance criteria. The latest full `npm.cmd run check` passed formatting, lint, TypeScript and all 25 unit/component tests. The production build passed. The complete `npm.cmd run test:e2e -- --workers=2` suite passed all 36 desktop/mobile Chromium checks in 30.8 seconds.

Verified behavior includes initial loading, selected-color changes, retry, failure, stale-image recovery, cached-color switches, stable Add/Save/Cancel bounds, centered loader/text switching, accessible action names, enlarged carousel frames, garment order and slide direction, reduced motion, forced colors, narrow reflow and keyboard focus. The current visual treatment and implementation agree with `design.md`. Earlier sections retain historical iteration evidence; this audit owns final completion status.

The user authorized commit and push after this audit. Remote CI results are tracked in issue #23. Physical devices, Safari/Firefox and a full screen-reader audit remain outside the recorded verification.
