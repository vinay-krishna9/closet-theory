# VISITOR-01 — Quick-add catalog implementation plan

Status: approved for implementation by the user on 13 November 2026. This authorizes the catalog, broad color configuration, recoloring feasibility work and visitor interactions below. No commit, push, provisioning or deployment is included. See [completion and verification](VISITOR-01.md) for actual results. Read with [product decisions](product-decisions.md), [user flows](user-flows.md), [architecture](architecture.md) and the [design system](../design.md), especially sections 17–20.

## Outcome and scope

A visitor starts with an empty wardrobe, browses the real eight-type catalog, selects clothes they own, optionally customizes tags, and can inspect, edit or remove their selections. The approved BUILD-02 layouts and controls supply the visual foundation. Production routes never import the design-review sample wardrobe or authored outfits.

- **Change:** replace the unavailable Quick-add and Wardrobe states with the real catalog and visitor wardrobe interactions.
- **Implementation:** typed catalog configuration, licensed photographs with reviewed garment-only color variants, reusable garment cards/editor, pure selection operations and shared in-memory React state.
- **Checks:** requirements-based unit/component tests, browser journeys, mobile/desktop visual review and existing quality commands.

VISITOR-02 adds versioned browser persistence and reload recovery afterward. This feature introduces only the shared state and stable selection identity needed to connect the catalog and wardrobe; these will be reused there. Before persistence exists, clearly say that selections last while browsing and reset on refresh. Do not claim they are saved in this browser.

Outfit generation, authentication/import, personal photos, preferences, wear logging, statistics, database changes and service provisioning remain outside this feature. Outfits and sign-in continue to explain their actual availability. No new dependency is proposed; use the installed Next.js, React, Radix/shadcn, Lucide and test tooling.

## Recorded choices

| Decision                  | Status                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog photo source      | User selected free, appropriately licensed garment photos; record each source/license                                                |
| Launch color breadth      | User selected the broader option: about 8–10 common colors per type                                                                  |
| Visual garment recoloring | User confirmed inclusion and delegated stage selection; implement in VISITOR-01, then reuse its output in Wardrobe and later Outfits |

The approved configuration below uses eight colors per type. The original plan selected licensed photography. After inspecting its appearance, the user approved AI-generated studio imagery for all eight types on 13 November 2026. This later decision authorizes the v2 source replacement, consistent framing, cutout cleanup, regenerated color variants, updated disclosures/provenance and affected checks. See [catalog assets](catalog-assets.md) for the current pipeline and retained photographic credits. This decision supersedes the earlier real-photo-only requirement in this plan.

### Included feature: garment recoloring

Requested journey: select a catalog garment → choose a color → inspect that color on the garment → add it to the personal wardrobe. Place this capability in VISITOR-01 because color is chosen before adding; Wardrobe displays and edits that selection, and later Outfits reuses its exact image/color reference. Do not independently recolor the same item in each screen.

This intentionally supersedes the earlier blanket no-recoloring rule for licensed catalog imagery; see `design.md` section 20. It does not authorize recoloring uploaded personal photos, changing garment cut/pattern, an arbitrary color picker or changing outfit scoring. Label images as recolored sample photographs rather than photos of the visitor's clothes. Color choices must never mutate the shared catalog or another visitor's selection.

Proposed approach: prepare a reviewed image for each named catalog color before shipping, using garment masks and a deterministic color transform that retains folds, texture, highlights and shadows. Select the corresponding local derivative when a swatch is chosen. This delivers an immediate visual color change without doing image processing during each visitor interaction. Start with a small feasibility sample before producing the full set; algorithm/calibration values remain technical defaults to validate.

- Prefer neutral, unbranded source photographs licensed for modification and redistribution. Prepare explicit masks separating recolorable fabric from transparency/background and protected details such as soles, fasteners or trim. Use suitable additional source images where a single source cannot support credible light/dark variants.
- Test existing Playwright plus native Canvas pixel operations for repeatable local asset preparation, with no proposed new runtime dependency or hosted processor. Canvas supports [pixel manipulation and image export](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas); this does not establish the quality of our recoloring algorithm. Use local/same-origin assets rather than relying on [cross-origin canvas access](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).
- Before scaling, inspect a light cotton top, dark denim and mixed-material sneakers in white/off-white, black/navy and saturated colors. Confirm color distinction, retained texture, clean edges, unchanged protected regions and performance/file sizes at the actual display sizes. If quality is inadequate, stop recoloring expansion and present concrete alternatives rather than quietly shipping flat tints or adding a provider.
- Each shipped type/color pair must resolve to a reviewed derivative or a suitable naturally matching photo. Store base asset ID, mask/recipe revision and resulting image reference alongside provenance. Preserve the base photo; derivatives are public catalog assets, not private uploads.
- Changing the swatch updates the preview and selected tag together. Only the current type/color may be added; stale image loads cannot attach another variant. While its preview is loading or failed, prevent Add for that unresolved variant and offer Retry or an explicit choice of another available color. Never silently add the previous color's image as a successful recoloring.
- Preserve the type, chosen color and customizations after image failure. Pattern/neckline/sleeve changes remain labelled representative unless the image actually depicts them; recoloring is not pattern or garment-shape synthesis.

## Approved catalog configuration

| Group → type              | Named colors                                                    | Default formality | Default seasons        | Optional customization                                                       |
| ------------------------- | --------------------------------------------------------------- | ----------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Tops → T-shirt            | White, Black, Navy, Grey, Olive, Beige, Burgundy, Light blue    | Casual            | All seasons            | Crew neck / V-neck / Polo collar; sleeveless / short / long sleeves; pattern |
| Tops → Shirt              | White, Light blue, Navy, Black, Grey, Beige, Pink, Olive        | Smart-casual      | All seasons            | Short / long sleeves; pattern; collar fixed as collared                      |
| Tops → Sweater            | Oatmeal, Grey, Navy, Black, Beige, Brown, Burgundy, Olive       | Smart-casual      | Spring, Autumn, Winter | Crew neck / V-neck; pattern; default long sleeves                            |
| Bottoms → Jeans           | Indigo, Light blue, Black, Grey, Dark grey, White, Beige, Brown | Casual            | All seasons            | Pattern                                                                      |
| Bottoms → Chinos          | Khaki, Navy, Olive, Black, Grey, Beige, Brown, White            | Smart-casual      | All seasons            | Pattern                                                                      |
| Bottoms → Shorts          | Khaki, Navy, Olive, Black, Grey, Beige, White, Light blue       | Casual            | Spring, Summer         | Pattern                                                                      |
| Shoes → Sneakers          | White, Off-white, Black, Grey, Navy, Beige, Brown, Burgundy     | Casual            | All seasons            | Solid / Printed pattern                                                      |
| Outerwear → Simple jacket | Olive, Navy, Black, Beige, Grey, Brown, Khaki, Burgundy         | Casual            | Autumn, Winter         | Pattern; default long sleeves                                                |

This proposes **64 type/color variants across eight types**, each requiring a reviewed color depiction before launch. This does not require 64 independently photographed garments: reviewed derivatives can share an original. Apparel pattern choices are Solid, Striped, Checked and Printed, with Solid as the default. T-shirts default to crew neck and short sleeves; shirts default to long sleeves; sweaters default to crew neck. Season/formality tags remain editable rather than claims of weather protection or dress-code suitability.

Use named color IDs and swatch values in one configuration. Keep White and Off-white distinct; keep Indigo and Light blue distinct. Group follows type rather than an independently editable value that could contradict it. Changing group presents only its valid types. Changing type retains common compatible fields and clears or initializes irrelevant customizations visibly; a shoe never retains a T-shirt neckline.

Allow Casual, Smart-casual or Formal, and one or more seasons. All seasons normalizes to all four season values; it is not an extra season. Require a valid color and applicable customization values. Default display names can come from color and type; use the existing item editor pattern for any name editing, with clear validation.

## Implementation sequence

### 1. Confirm configuration and prepare assets

- Approve or adjust this plan, including the recoloring feasibility step and proposed colors/defaults/customization table.
- Find actual garment photographs with suitable reuse/modification rights. Prefer unbranded, fully visible garments, consistent angles, accurate colors and backgrounds that work on the approved neutral canvas. Check rights for each selected asset rather than treating a whole search result or retailer site as reusable.
- Record creator, source page, license/license URL, attribution requirements, retrieval date, local asset path and crop/background/mask/recolor edits. Preserve required attribution and modification notices in a shipped credits document and record asset revisions.
- Validate the recoloring approach on the small sample above, then prepare and review the full color set. Do not apply a blanket CSS filter to garment/background/trim together. Representative imagery may be reused for customizations it cannot depict, with honest labels. If adequate assets or recolorings cannot be produced, report specific gaps before accepting replacements or broadening costs/providers.
- Store approved optimized public catalog images locally, with dimensions and bounded sizes. No hotlinking, account credentials or user-photo fixtures. The review atlas remains confined to review routes. A separate asset-processing dependency, paid acquisition or service would require approval if needed.

### 2. Model catalog and selections separately

- Catalog templates own stable type/variant IDs, group/type relationships, default tags and versioned source/derivative/provenance references. Selection never mutates a shared template or creates a catalog entry.
- A visitor wardrobe item owns a stable selection ID, catalog reference, editable confirmed tags and applicable customizations. Store references to images rather than copied image data. Generate IDs at the action boundary; keep reducer/normalization functions deterministic and independently testable.
- Define normalized exact configuration equality separately from broader type/color similarity. Exact comparison includes every applicable customization; absent or unknown values are not evidence of equality.
- Add a context/reducer provider shared by the visitor routes, so Quick-add and Wardrobe retain selections across client navigation. Implementation placement: the root layout, so visiting the public home page and returning also preserves selections. Start empty. Do not add storage, Redux, server actions or an API in this feature.

### 3. Implement catalog and wardrobe interactions

- Quick-add: eight types grouped as approved, named color choices with matching reviewed color previews, search/group browsing, visible sample/recolor disclosure and a direct Add action using editable defaults. Optional Customize opens the shared drawer/full-screen editor with the approved pictorial controls.
- Add only the chosen configuration after an explicit action. Indicate an existing exact selection and link to it; repeated/rapid Add activation must not toggle removal or create accidental copies.
- When the visitor intentionally adds another garment, apply the settled similarity flow: show the existing selection and offer Keep existing, Replace details preserving its ID, or explicitly confirmed Add as a different garment with a new ID. Distinct configurations must not be silently merged.
- Wardrobe: show only selected items with readable metadata and clear edit/remove actions. Reuse the same form for customization and editing; preserve in-progress values on validation failures and guard unsaved dismissal through the shared Editor.
- Removing a selection is explicit and confirmed; removing it does not remove its catalog template. Do not implement historical wear/media deletion for visitors, who have neither.
- Preserve browsing filters and focus through editing/removal. Show honest empty wardrobe, no search matches, invalid form and failed-image states with useful recovery. Static local catalog data needs no artificial network loader; image loading reserves space and image errors use an accurately labelled placeholder.
- Keep visitors free of personal-upload, item-favorite and wear actions. Update visitor notices to describe the actual in-memory lifecycle until VISITOR-02 ships.

### 4. Keep feature code organized

Create only files that the implementation uses:

```text
src/features/onboarding/       Catalog configuration, assets metadata and quick-add UI
src/features/wardrobe/         Item model, pure selection rules, provider, cards and editor
src/lib/images/               Deterministic catalog recoloring/mask operations, separate from outfit rules
src/components/ui/            Reusable pictorial selection control when extracted from review code
src/app/(workspace)/           Thin routes and provider wiring
public/catalog/               Approved public source/mask assets and reviewed color derivatives
scripts/                      Repeatable catalog asset preparation using existing tooling
docs/catalog-assets.md        Provenance and required credits for actual selected assets
tests/e2e/visitor-catalog.spec.ts
```

Co-locate unit/component tests with their feature code. Move genuinely reusable pictorial controls/drawings out of the review feature without importing its sample data into production. Continue using semantic tokens, the shared icon wrapper and the installed Radix primitive family. Render garment assets with constrained Next.js Image dimensions/sizes and contain framing.

## Verification and completion

- **Unit:** group/type validity, color/default configuration, at least one valid season, customization applicability, normalized equality, similarity, immutable catalog templates and stable IDs through edits/replacement. Test rapid/repeated selection, explicit separate garments and removal without changing the catalog.
- **Image verification:** test masks/alpha and protected pixels remaining unchanged, deterministic variant mapping, distinct intended color families and consistent recipe revisions. Review actual output across fabric types and light/dark color changes; passing pixel assertions alone does not prove realistic results.
- **Component:** Add with defaults, Customize, visible named swatches, multiple seasons, validation preserving values, irrelevant fields clearing on type changes, dirty close/Keep editing, each similarity choice and confirmed removal. Verify messages describe actual state.
- **Browser:** empty wardrobe → browse/filter → choose type/color → see recolored preview → customize → add → see the same image/color in wardrobe → edit → resolve a duplicate/similarity case → remove. Confirm unselected clothes never appear and visitor-only destinations/actions stay restricted. Cover rapid color switching, failed/stale preview loads, no matches and dismissal/cancellation; persistence expectations belong to VISITOR-02.
- **Responsive/accessibility:** inspect mobile and desktop; test all documented breakpoints, keyboard order, radio/checkbox behavior, modal focus restoration, touch actions, image framing, text reflow, footer clearance, reduced motion and contrast. Report actual screen-reader/physical-device limits rather than inferring coverage from emulation.
- **Commands:** run `npm.cmd run check`, `npm.cmd run build`, then `npm.cmd run test:e2e` with port 4174 free. Keep existing foundation/review tests; update only assertions whose unavailable-state requirements intentionally change, while preserving visitor access restrictions.
- **Documentation:** update README/current status, record actual VISITOR-01 results and asset provenance, and identify remaining VISITOR-02 work. No completion claim while the selected launch assets or required interaction checks remain missing.

Completion means the real catalog, reviewed color depictions and editable visitor selections work across in-app navigation, with no prefilled wardrobe, accidental duplicates or misleading photo/save claims. Reload persistence and real suggestions are subsequent tasks. After the plan is approved, implementation can proceed without repeated permission for routine choices within this scope.
