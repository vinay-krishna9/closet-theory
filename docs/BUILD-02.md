# BUILD-02 — Design review

Status: mockups ready for user design review; production shell implementation awaits design approval. Branch: `build/02-design-review`, based on merged BUILD-01. Mockup milestone committed as `437ae7c`. User authorized a darker revision and commits/push on 12 November 2026. No publishing or deployment is included.

## Review scope

The isolated `/design-review/wardrobe`, `/design-review/quick-add` and `/design-review/outfits` routes are browser mockups. The root entry page keeps its foundation content and adopts the same approved dark palette. A review-only toolbar exposes populated, empty, loading and error states; it is not a proposed product feature.

The mockups follow `design.md`: cool graphite surfaces, near-black header (design.md section 17), Space Grotesk headings, Manrope UI, image-first 3:4 clothing cards, 4:3 composition canvases, visitor-only navigation, and 768px/1024px navigation/gutter boundaries. Mobile visitor links are Wardrobe, Outfits and Sign in; they do not expose Statistics/Profile. Dialog mockups use the native browser modal mechanism for keyboard containment and Escape, with focus restoration and body scroll locking. They illustrate the desktop side drawer/mobile full-screen pattern, not the final shadcn/ui editor.

Local font packages use SIL Open Font License; copies are in `public/design-review/`. Lucide provides outline icons. They were approved in the BUILD-02 plan. shadcn/ui controls and the final reusable token/component system will follow design approval; no primitive family is installed yet.

## Honest example behavior

- Sample wardrobe and hand-composed outfits are deliberately confined to design-review routes. No real visitor wardrobe is prefilled.
- Quick-add selection toggles and color controls are temporary preview state, reset by refresh. They do not persist or import data.
- Search/group filters help inspect samples. Outfit filters restrict the small authored example set, not an implemented outfit engine. Any/Spring/Summer do not show jacket examples. No-match previews offer explicit Clear filters.
- Sign-in opens an explanatory preview; no credentials are collected. Visitors have no Favorite or wear controls.
- Garment details are illustrative. Representative imagery does not change when color/details are selected. Exact per-type customization lists and complete catalog coverage remain future work.
- All garment images are AI-generated illustrative renders for layout review, labelled accordingly. They are not licensed stock photos or approved launch catalog assets. See the asset record below. No private photos are used.

## Asset record

File: `public/design-review/garment-atlas.png`. Generated with the built-in ImageGen tool on 12 November 2026, transparent alpha preserved and copied into this checkout. It is one 4×2 sprite atlas, not an exact visualization of user-selected customizations. No garment colors are changed by CSS. Font licenses: `public/design-review/space-grotesk-LICENSE.txt` and `manrope-LICENSE.txt`.

Generation prompt:

> Use case: product-mockup. Asset type: one transparent PNG garment sprite atlas for an explicitly labelled personal wardrobe DESIGN REVIEW, not a final product catalog. Create a precise 4 columns by 2 rows grid of 8 equal SQUARE cells; total image landscape 2:1. Transparent background throughout, NO grid lines, NO labels, NO text. Each cell contains ONE fully visible centered garment, straight-on top-down flat lay photorealistic ecommerce studio photography, realistic fabric folds and gentle diffuse light, no models, no hangers, no logos, no props. Each cell has generous transparent breathing room at least 12% on all sides and stays strictly inside its cell. Row 1: ivory white cotton crewneck short sleeve T-shirt; navy crewneck short sleeve T-shirt; muted light blue long sleeve Oxford button shirt; oatmeal fine knit crewneck sweater. Row 2: indigo straight leg jeans unfolded full length; warm khaki chinos unfolded full length; pair of minimalist off-white leather low-top sneakers without brand marks; olive lightweight simple overshirt jacket. Front facing, vertically oriented, natural material colors, clean realistic silhouette, no cast shadows outside garment. Accurate equal grid for CSS sprite use. Genuinely transparent alpha background.

## How to review

Run `npm.cmd run dev` and open http://127.0.0.1:3000/design-review/wardrobe. Use Add clothing to inspect Quick-add and the navigation links to inspect Outfits. Change Preview state for empty/loading/error layouts. Open a garment for the detail panel; Escape closes it. Test at desktop and phone widths. Authored interactions do not save wardrobe data.

Approve or request changes to typography, spacing, navigation, clothing cards, the outfit composition and detail panel. After design approval, implement the production shell and shared shadcn/ui controls in this branch with its own verification. This stage is not the completion of all BUILD-02 acceptance criteria.

## Verification

Filter/proportion revision (13 November 2026): outfit filters start collapsed behind a labelled Filters button and visible selection summary. The inline panel stacks Season above Formality, retains selections when closed, and supports Enter/Space toggling. Shirt line drawings now have a larger torso and proportionate short/long sleeves. Formatting, lint, types, the component test and production build passed; all 12 browser checks passed, including collapsed state, vertical stacking, retained selections and expanded-panel reflow from 320 to 1440px. Desktop/mobile screenshots were reviewed. Physical devices and actual screen-reader use remain unverified.

Pictorial-selection revision (13 November 2026): approved icon/drawing tiles replace outfit season/formality and garment neckline, sleeves, pattern and formality dropdowns. Multi-season tiles retain native checkboxes; single choices use native radios. Color swatches show visible names and the selected tag, with plain guidance distinguishing color labels from image recoloring. No new dependency or persistence was introduced. See section 19 of `design.md`. Formatting, lint, types, the component test, build and all 12 browser checks passed. The suite now verifies multiple checked seasons, exclusive neckline selection with Space/arrow keys, and that the focused tile remains above the sticky drawer footer. Desktop/mobile screenshots were reviewed; actual screen-reader and physical-device testing remain unverified.

Typography revision (12 November 2026): user approved Space Grotesk for headings/wordmark and Manrope for UI/body text, replacing Archivo/Inter Tight. Both are locally bundled variable fonts using their supported weight ranges. Superseded font packages and license copies were removed; current SIL OFL copies are included with the review assets. Section 18 of `design.md` records this decision. After replacement, formatting, lint, types, the component test, a fresh production build and all 12 browser checks passed; desktop outfit and mobile detail-panel screenshots were reviewed for wrapping and readability.

Dark revision (12 November 2026): section 17 of `design.md` supersedes the warm palette. The root foundation page and all mockups now use cool charcoal/graphite without a theme switch. Calculated contrast: main text/page 15.13:1; muted text/panel 7.31:1; sample label/canvas 4.91:1; primary action text/fill 13.53:1; control border/panel 4.33:1. These calculations do not replace full accessibility auditing or visual review of dark garments. Mannequin feasibility is tracked in [SPIKE-03, GitHub issue #22](https://github.com/vinay-krishna9/closet-theory/issues/22); the local issue draft was removed after creation. No mannequin rendering has been added.

- `npm run check` passed (Prettier, ESLint with zero warnings, generated route types/strict TypeScript, and the existing component test).
- `npm run build` passed with the three statically rendered design-review routes. Fonts are bundled locally, not fetched from Google at build time or in the browser.
- `npm run test:e2e`: **12 passed** across desktop Chromium and emulated Pixel 7. This includes four existing foundation checks plus eight design-review checks.
- Review checks cover screen navigation, empty/loading/error state changes and retry, search/no-results recovery, temporary selection toggles, selected-color state, modal heading focus, Escape/focus restoration, sample outfit disclosure, jacket exclusion under Any, explicit no-match recovery, and absence of visitor favorite/wear actions.
- All three screens were checked for horizontal overflow at 320, 390, 767, 768, 1023, 1024, 1280 and 1440 CSS pixels with reduced motion. Mobile visitor navigation switches at 768px as specified.
- Desktop and mobile screenshots were visually reviewed for card framing, neutral compositions, wrapping, detail-panel layout and recovery states. Generated images retain transparency and are not recolored. Screenshot outputs remain local in ignored `test-results/`.
- Physical devices, actual assistive-technology use, a full automated accessibility audit and final shadcn/ui primitives have not been verified at this stage. Native dialog mocks are design-review aids, not the completed production editor.

Existing BUILD-01 dependency advisory/support limitations remain; npm reported the same eight moderate development-tooling advisories after the three approved design dependencies were installed. No unrelated forced dependency upgrades are part of this task. Remote CI must be checked after pushing this revision.
