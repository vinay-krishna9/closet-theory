# VISITOR-01 — Stable editor actions and custom loading spinner

Status recorded 15 November 2026. The user requested a custom spinner inside Add to wardrobe and asked for a documented plan and GitHub issue. This document records the proposed implementation for review. Implementation and verification are pending.

## User need

Changing a color in Customize currently inserts “A loaded color preview is required before saving.” beside the footer actions. The extra content moves the buttons until the new garment image loads. Keep the actions stationary and communicate preview loading inside the primary button.

## Change

- Show a compact custom spinner inside Add to wardrobe while the selected garment preview loads. Apply the same behavior to Save changes when editing wardrobe clothing.
- Retain each button's visible action label. Reserve the spinner's space in every state so the button width, height, text and footer positions stay stable.
- Remove the conditional footer helper sentence. Continue showing the reserved garment preview skeleton and explicit image-error recovery.
- Enable submission after the current type/color preview succeeds. Failed previews retain the draft and expose Retry photo. The spinner reflects active loading and stops on success or failure.

## Implementation

- Build a small reusable CSS spinner in `src/components/ui/`, using an approximately 16px ring with a muted track and a contrasting rotating arc. Use `currentColor` and the existing semantic tokens. A roughly 800ms rotation is an initial visual default to review in the actual button.
- Use a reserved leading icon slot in the editor's primary action. Animate rotation with CSS transforms and keep layout dimensions constant.
- Expose the preview's loading, ready and error states to the editor through the existing image component boundary. Reset readiness on color changes and retry. Ignore stale results from earlier colors.
- Keep the primary action disabled while its preview is unresolved. Set `aria-busy` while loading, hide the decorative spinner from assistive technology and reuse the preview's concise loading announcement to avoid duplicate announcements.
- With reduced motion, show a static loading indicator and accessible loading status. Check visibility in forced-colors mode.
- Use the installed React, shared Button and CSS tooling. This plan requires no additional dependency.

## Acceptance criteria

- Initial preview load, color switches and retry show the custom spinner inside the appropriate primary action.
- Cancel and Add to wardrobe/Save changes retain their positions and dimensions before, during and after loading at desktop and mobile widths, including enlarged text.
- Labels remain readable and the spinner fits within the existing button height.
- The primary action becomes available only after the currently selected preview loads successfully.
- Image failure stops the spinner, keeps submission disabled and preserves color and edited tags. Retry restarts loading and can recover.
- Rapid color switching cannot enable submission from an earlier preview result or save a mismatched image.
- Keyboard focus remains stable through preview updates. Reduced motion provides a static indicator with an accessible loading announcement.

## Checks

- Extend the existing held-image browser journey to compare both footer button bounds before, during and after a color change on desktop and mobile. Cover Add to wardrobe and Save changes.
- Extend existing failure/retry and rapid-color-switch checks to verify loading ends on error, restarts on retry and follows only the current preview.
- Review the actual spinner, footer spacing, keyboard focus, enlarged text, reduced motion and forced colors on desktop/mobile Chromium. Record physical-device and assistive-technology limits explicitly.
- Run `npm.cmd run check`, `npm.cmd run build`, then `npm.cmd run test:e2e -- --workers=2` with port 4174 free, using the locally verified worker setting.
- Record actual results in [the completion record](VISITOR-01.md) and update the relevant design interaction text when implementation is complete.

## References

- [Existing implementation and verification](VISITOR-01.md)
- [Approved catalog plan](VISITOR-01-plan.md)
- [Design system](../design.md), especially motion, accessibility and the item editor refinements

## Completion evidence

Pending implementation, visual review and checks.
