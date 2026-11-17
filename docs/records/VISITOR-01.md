# VISITOR-01 — Quick-add catalog

Status: completed and merged through [PR #24](https://github.com/vinay-krishna9/closet-theory/pull/24) on 15 November 2026. [Issue #7](https://github.com/vinay-krishna9/closet-theory/issues/7) is closed as completed. The user approved AI-generated studio imagery for all eight types after rejecting the initial photographs. The v2 replacement and verification are recorded below. The [approved implementation plan](https://github.com/vinay-krishna9/closet-theory/blob/f58bb20570b694c2ea1b3fc44d4ad6f89a039b52/docs/VISITOR-01-plan.md) is retained in Git history after completion.

## Result

- Real `/quick-add` catalog: eight valid launch types, 64 named color variants, search/group browsing, editable defaults and optional customization. Each displayed color resolves to a local studio-image derivative. AI-generated sample disclosures and provenance are visible. Earlier photographic assets and credits are retained for the original review comparison.
- `/wardrobe` starts empty and shows only explicitly selected clothing. Users can inspect/edit applicable tags and color, confirm removal and recover from no search results. Catalog group/type remain fixed. Invalid drafts remain editable; fields and first-error focus identify problems. Modal cancellation protects unsaved changes.
- One shared in-memory context/reducer connects workspace navigation. Selection IDs survive edits/replacement. Catalog templates are independent of personal selections. Name/season-order differences do not make an exact configuration distinct; applicable style/tag changes do. Broader type/color matches prompt Keep existing, Replace details or confirmed Add as a different garment. Repeated Add and repeated operation IDs cannot create accidental copies.
- The same type/color image adapter supplies preview and wardrobe display for later reuse by Outfits. A failed/unresolved preview cannot authorize Add/Save. Retry preserves tags; late results from an unmounted preview are ignored.
- The shared editor and pictorial selection controls are reused without importing review fixtures into production. Account-only uploads, favorites, wear logging and statistics remain unavailable. Outfit suggestions remain a later feature.
- The shell measures actual mobile navigation height, reserves its space and scrolls focused controls clear of it. This corrects the overlap found at 320px with 200% text size.

## Boundaries

Selections last across in-app navigation and **reset on refresh**. Both screens explain this. Versioned browser storage, blocked/corrupt-storage recovery and import preparation are VISITOR-02. No local/session storage, authentication, personal photos, database or remote image processor was added.

The [asset record](../assets/catalog-assets.md) identifies current studio sources, prompts, transformations, reproducible commands and visual limitations, alongside retained photographic licenses. Representative details are labelled; recoloring does not render a requested sleeve/neckline/pattern. Earlier photographic derivatives retain their source license terms and required notices.

## Verification

The following initial-feature results preceded the studio revision.

- `npm.cmd run catalog:prepare`: passed; generated all 64 color variants, base/mask assets and the versioned manifest from retained local sources.
- `npm.cmd run check`: passed formatting, ESLint, TypeScript and all 21 unit/component tests across six files.
- `npm.cmd run build`: passed production compilation and route generation.
- `npm.cmd run test:e2e`: passed all 32 checks across desktop Chromium and the Pixel 7 Chromium emulation, using the production server. The final run includes Home/navigation retention, refresh reset, custom-name preservation, stable replacement identity, removal focus restoration, duplicate prevention, image failure/retry and stale-image recovery.
- Browser asset checks cover all 64 variants: dimensions, transparent background, unchanged alpha/protected details and named-color tolerances. Visual review covered the full variant contact sheet and desktop/mobile catalog, wardrobe and editor states. Keyboard/dialog focus, narrow-screen reflow, reduced motion and 200% text-size navigation clearance were checked through the relevant browser journeys.

### Studio revision verification

- `npm.cmd run catalog:prepare` passed for all eight v2 sources and 64 variants. Sources total 15,271,611 stored bytes; the 64 shipped PNG variants total 17,610,481 bytes, ranging from 122,216 to 388,073 each. Responsive Next.js images supply the app, so these stored totals do not describe a page download.
- `npm.cmd run check` passed formatting, ESLint, TypeScript and all **23 unit/component tests across seven files**. Two new preparation regressions cover detached specks/fringe, retained openings, source immutability and transparent-source handling.
- `npm.cmd run build` passed. `npm.cmd run test:e2e` passed **all 32 desktop/mobile Chromium checks**, including v2 source/provenance mapping, all eight prompts, actual 64-image color/alpha/protected-pixel checks and the existing visitor/foundation journeys.
- The select/customize/edit/remove journey was rerun on both projects after improving review captures to wait for all eight catalog images and the editor preview. Both passed. The updated screenshots show the loaded studio imagery in the actual desktop/mobile catalog and editor.
- Visual inspection covered the [complete color gallery](../reviews/catalog-studio-01/studio-v2.html), its 64-image contact sheet, white/dark denim, protected sneaker details and loaded app screenshots. The prepared images have consistent contain framing, clean silhouettes and readable color differences. Dark sneakers retain a contrasting white tongue/eyelet panel, laces, lining and sole.

These checks use local isolated visitor data. Physical-device testing, Safari/Firefox, a full screen-reader audit and manual browser-zoom review were not performed. Text-size/reflow checks do not substitute for that review. Remote CI has not run for these uncommitted changes. Generated details and approximate recoloring retain the limitations described in the asset record.

## Interaction refinement · 14 November 2026

The user approved three changes after reviewing the studio catalog. Catalog cards now display their default color and retain direct Add and Customize actions. Color selection lives inside Customize/the item editor. The shared garment image component reserves its 3:4 frame and shows a full-area skeleton during initial loading, color changes and retry. The skeleton respects reduced motion, and loading blocks Add/Save until the selected preview succeeds. Error recovery and stale-result protection remain covered. Season choices use individual tiles without the “Use all seasons” shortcut.

- `npm.cmd run check` passed formatting, lint, TypeScript and **24 unit/component tests across seven files**. The updated component interactions cover default card Add, Customize-only color choice, skeleton loading/failure/retry, saved color and individual seasons.
- `npm.cmd run build` passed.
- `npm.cmd run test:e2e -- --workers=2` passed **all 32 desktop/mobile Chromium checks**. The held-image journey verifies the skeleton, disabled Add, matching preview heights before/during/after loading within browser subpixel rounding, rapid color switching and reduced-motion CSS. Existing failure/retry and visitor journeys also passed.
- The default ten-worker runs hit desktop image-request timeouts under concurrent local load. The four affected journeys passed in isolation; the complete suite passed with the two-worker command above. Assertions and existing timeouts were retained. This records a local concurrency limitation, and a default-concurrency pass for this revision is still unverified.
- Visual review covered the loaded desktop catalog and mobile loading skeleton. Keyboard, responsive shell, reduced-motion and editor journeys passed under Chromium emulation. Physical-device and full screen-reader review remain unperformed.

## Editor layout refinement · 14 November 2026

The approved editor layout is implemented with a product-specific drawer up to 1040px wide. Its left column contains the persistent garment preview and independently scrollable name/color controls. Group, Type, Formality, Seasons and expandable details occupy the right column; compatible detail sections share a row on larger screens. On phones a compact preview remains above the scrolling controls. Short-screen rules reduce the preview height while keeping header/footer and controls accessible.

Following the user's catalog-identity correction, Group and Type retain their icon-and-name tiles in Customize and when editing catalog-derived wardrobe items. The catalog values stay selected, and every Group/Type choice is disabled. Selecting a T-shirt fixes its type and group while allowing applicable color, formality, seasons, neckline, sleeve and pattern choices. Color changes clear preview readiness, including when returning to a previously loaded choice, so Add/Save waits for the current preview. The shared design-review drawer keeps its existing presentation. Personal-upload classification belongs to its separate future workflow.

- `npm.cmd run check` passed formatting, lint, TypeScript and **25 unit/component tests**. The catalog-identity regression covers both T-shirt and sneakers through customization, saving and reopening the wardrobe editor, with disabled selected Group/Type tiles, retained color/season edits and fixed garment type.

- `npm.cmd run build` passed.
- `npm.cmd run test:e2e -- --workers=2` passed **all 34 desktop/mobile Chromium checks** after the catalog-identity correction. The layout journey checks disabled selected Group/Type tiles, blocked category switching, keyboard skipping of disabled choices, arrow-key color selection, preview updates, absence of dropdowns, preview position after scrolling, short landscape screens, 320px reflow and 200% text with a 480px viewport height.
- Visual review covered the expanded desktop editor and phone view after scrolling to the last detail choices. The garment remains visible. Basic desktop options use the available space; expanded details and enlarged text may still require scrolling.
- An existing shared-editor resize assertion caught a transient 0.012px animation overshoot. It now waits for layout to settle while retaining its strict footer-within-viewport boundary. Its targeted ESLint check passed.
- Full physical-device and screen-reader reviews remain outside this verification. Browser testing uses the previously recorded two-worker command because of local contention at default concurrency.

## Merge verification · 15 November 2026

[GitHub Actions run 43705867085](https://github.com/vinay-krishna9/closet-theory/actions/runs/43705867085) passed installation, formatting, lint, TypeScript, component tests, production build and the configured browser suite for PR #24. The merge commit is `f58bb20570b694c2ea1b3fc44d4ad6f89a039b52`. This supersedes the earlier remote-CI limitation for the merged revision. The recorded local concurrency and device/assistive-technology limits still apply.

## Next

VISITOR-03 tracks the custom button spinner and stable footer in its [execution plan](VISITOR-03-plan.md) and [issue #23](https://github.com/vinay-krishna9/closet-theory/issues/23). VISITOR-02 will persist selections safely across reloads, validate/version the stored schema and handle reset, migration, corrupt data and unavailable storage. The independent deterministic outfit engine and visitor suggestions follow their own plans.
