# BUILD-02 — Tokens and shared app shell

Status: completed on 13 November 2026 after user design and implementation approval. Branch: `build/02-design-review`, based on merged BUILD-01. Mockup milestone committed as `437ae7c`. The user subsequently authorized committing and pushing the completed foundation and documentation cleanup. Publishing and deployment are not included.

## Completion checklist

The user approved the Wardrobe, Quick-add and Outfits designs, visual review and remaining foundation implementation on 13 November 2026.

| Completion criterion                           | Result                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Mobile/desktop design review                   | User-approved Wardrobe, Quick-add and Outfits designs retained as references                                  |
| Semantic tokens, typography and icons          | Shared charcoal tokens, global self-hosted Space Grotesk/Manrope and a Lucide icon wrapper                    |
| Shared controls and dialog/editor foundations  | Radix/shadcn controls; responsive editor and guarded unsaved dismissal                                        |
| Responsive shell and route layouts             | Shared visitor/account navigation modes; visitor routes explain pending features without sample wardrobe data |
| Responsive, keyboard and reduced-motion review | Production browser checks, contrast/target assertions and desktop/mobile screenshot review; limits below      |
| Documentation                                  | Setup, folder map, completion evidence and limitations recorded                                               |

Real catalog behavior, persistence, recommendations, authentication and uploads belong to later features. No database, account or private-photo functionality was introduced. BUILD-02 completion concerns the shared foundation, not the full-app acceptance checklist in `design.md`.

## Production foundation

- `src/styles/tokens.css` owns semantic colors, typography sizes, spacing, responsive gutters and motion defaults. `src/styles/components.css` owns shared control, modal, editor and shell styling. Review aliases consume these tokens.
- `src/app/layout.tsx` loads both licensed local fonts once for all routes, including missing-route recovery. No external font requests or theme switching.
- `src/components/ui/` contains Button, Input, Label, Icon, EmptyState, DialogContent and Editor. `components.json` records the shadcn/ui configuration. The [shadcn/ui Radix composition](https://ui.shadcn.com/docs/components/radix/dialog) and [Radix Dialog API](https://www.radix-ui.com/primitives/docs/components/dialog) guide the local implementation; no Base UI primitives are mixed in.
- Added and pinned `radix-ui@1.8.1`, `class-variance-authority@0.7.1`, `clsx@2.1.1` and `tailwind-merge@3.7.0`. npm installed them without peer conflicts; check/build/browser verification passed. They provide accessible primitives, variants and class merging for the approved shared controls.
- `src/components/app-shell.tsx` supports visitor and account modes. Only visitor mode is mounted. Account mode has the four approved destinations and component coverage; it awaits verified server authentication before use. Visitors never see Statistics/Profile links. Sign-in opens an availability explanation and collects no credentials.
- `src/app/(workspace)/` supplies the shared layout and thin `/wardrobe`, `/quick-add` and `/outfits` routes. They show honest empty/unavailable states. The root entry links into the shell; marketing and real visitor behavior remain later tasks.
- Reviewed garment panels now exercise the shared Radix editor instead of native dialogs. Below 768px it is full-screen; above it is a 480px right drawer. Header/footer stay visible while the body scrolls. The generic Editor guards dirty Escape/backdrop/close requests with a Cancel-first discard confirmation. Feature code owns draft state and uses DialogClose for cancellation.

## Review scope

The isolated `/design-review/wardrobe`, `/design-review/quick-add` and `/design-review/outfits` routes are browser mockups. The root entry page keeps its foundation content and adopts the same approved dark palette. A review-only toolbar exposes populated, empty, loading and error states; it is not a proposed product feature.

The mockups follow `design.md`: cool graphite surfaces, near-black header (design.md section 17), Space Grotesk headings, Manrope UI, image-first 3:4 clothing cards, 4:3 composition canvases, visitor-only navigation, and 768px/1024px navigation/gutter boundaries. Mobile visitor links are Wardrobe, Outfits and Sign in; they do not expose Statistics/Profile. The panels now use the shared Radix editor for keyboard containment, Escape, focus restoration and background scroll locking. Their garment data remains illustrative.

Local font packages use SIL Open Font License; copies are in `public/design-review/`. Lucide provides outline icons. They were approved in the BUILD-02 plan. Shared controls use the Radix primitive family and consume the production token system.

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

## Inspecting the approved designs

Run `npm.cmd run dev` and open http://127.0.0.1:3000/design-review/wardrobe. Use Add clothing to inspect Quick-add and the navigation links to inspect Outfits. Change Preview state for empty/loading/error layouts. Open a garment for the detail panel; Escape closes it. Test at desktop and phone widths. Authored interactions do not save wardrobe data.

Typography, spacing, navigation, clothing cards, outfit composition and the detail panel are approved. These routes remain design references and exercise the shared controls/editor; the separate production routes remain free of illustrative wardrobe data.

## Verification

### Production foundation — 13 November 2026

- `npm.cmd run check` passed: formatting, ESLint with zero warnings, generated route types/strict TypeScript and **5 component tests** across 3 files. Editor tests cover clean dismissal, dirty confirmation, Keep editing preserving the draft, Escape and explicit discard. Shell tests cover visitor restrictions and the account navigation contract.
- A fresh `npm.cmd run build` passed with the three new static workspace routes alongside the foundation and review routes.
- `npm.cmd run test:e2e`: **20 passed** across desktop Chromium and emulated Pixel 7, including all 12 existing checks. New checks cover honest shell navigation, missing-feature explanations, dialog heading focus/Tab containment/Escape/restoration, modal semantics, 480px versus full-width editor sizing, background scroll lock/unlock and footer access in a 480px-high viewport.
- All workspace routes reflow without horizontal overflow at 320, 390, 767, 768, 1023, 1024, 1280 and 1440px under reduced motion. The suite checks 200% root text sizing at 320px and action clearance above bottom navigation. A 320px viewport covers the reflow width of a 1280px viewport at 400% zoom; this is not a claim of manually testing browser zoom.
- Browser assertions verify 44px shell/action targets, visible 2px keyboard focus, text contrast >=4.5:1 and control/focus contrast >=3:1 against actual semantic tokens. Reduced motion removes dialog animation. These are targeted accessibility checks, not a full automated accessibility audit.
- Desktop/mobile screenshots of the production shell and shared editor were visually reviewed for wrapping, contrast, framing and footer access. Outputs remain ignored under `test-results/`.
- The first browser run caught missing explicit `aria-modal` on the shared dialog. It was fixed without weakening the assertion, then all 20 checks passed. The sandbox initially prevented automatic server teardown; that server was stopped, and the final suite ran outside the sandbox and shut down cleanly. Port 4174 was left free.

Physical devices, actual screen-reader use, manual browser zoom, Firefox/Safari and a full automated accessibility audit remain unverified. Account navigation has component coverage but no live authenticated journey; account work must verify it with an isolated session. The same eight moderate development-tooling advisories remain. Remote CI for these changes has not run. These remain release/future-feature follow-ups, not claims of full product verification.

### Recorded mockup revisions

The following results describe earlier revisions. Native-dialog and dependency references describe that earlier stage; the production foundation above supersedes them.

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
