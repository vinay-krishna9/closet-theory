# Catalog imagery and color derivatives

## Current studio catalog · v2

The user rejected the informal appearance of the initial photographs, reviewed AI-generated T-shirt, jeans and sneaker samples, and approved that studio style for all eight garment types on 13 November 2026. The current catalog uses newly generated, unbranded studio product illustrations. Clothing uses a straight-on shaped presentation, and sneakers use a three-quarter view. The app identifies these as **AI-generated samples** in the catalog, editor, wardrobe, image alternatives and credits.

The sources are individual PNGs in `public/catalog/sources/studio-v2/`. The adjacent `provenance.json` records the built-in OpenAI image generator, approved direction and all eight generation prompts, including the T-shirt cleanup edit and original reference prompt. These generation prompts document creation, while exact pixel reproduction uses the retained source PNG bytes. Generation itself can produce different results on another run.

`npm.cmd run catalog:prepare` uses the installed Playwright and native Canvas with browser network requests blocked. It reads those source PNGs, retains the dominant opaque product component and trims three source pixels of edge fringe before downsampling. This preparation removes detached specks and preserves the openings between sleeves, trouser legs and laces. `src/lib/images/catalog-alpha.ts` contains the pure preparation rule. This source-specific preparation applies to public catalog art.

`scripts/catalog-studio-masks.json` records protected-detail polygons in normalized 0–1000 source coordinates. They preserve buttons/rivets, the jacket zipper and the sneaker sole, tongue/eyelet panel, laces and lining. The remaining material uses `src/lib/images/catalog-recolor.ts` and its `masked-luminance-v1` recipe. The sneaker retains contrasting white details in its darker variants. Texture, shadows and highlights remain representative. Cuts, sleeves and pattern tags do not generate different shapes or patterns.

The current output is 64 transparent 512×640 color variants in `public/catalog/v2/`, with eight canonical bases, eight masks and a manifest. The variants total 17,610,481 stored bytes, ranging from 122,216 to 388,073 each. Each manifest entry records the source path, SHA-256, preparation revision, color, recipe, dimensions and stored byte size. Product bounds are contained within 448×576 with even centered placement. The shared `catalogImage` adapter resolves this version in Quick-add, Wardrobe and the editor. Future Outfits must reuse that adapter.

The built-in image tool created the sources and the T-shirt edit. Deterministic preparation and named-color variants use the approved local asset pipeline. Sources contain synthetic garments with approximate material/color representation. They have no photographer attribution and are labelled by their actual creation method. The existing photographic licenses below apply to the retained v1 assets.

The initial comparison board and prompts are retained in [the review folder](../reviews/catalog-studio-01/index.html). The [prepared studio gallery](../reviews/catalog-studio-01/studio-v2.html) shows all 64 current variants. See the [feature record](../records/VISITOR-01.md) for final checks and review limitations.

## Earlier photographic catalog · v1

Asset revision: `v1` · recipe: `masked-luminance-v1` · source/rights inspection and retrieval: 13 November 2026.

The earlier VISITOR-01 catalog used eight real garment photographs, resized from Wikimedia Commons source files. These retained assets are distinct from the generated design-review atlas. The original source pages establish the authorship and license for each file; required credits remain shipped at `/catalog-credits` and in `public/catalog/sources/credits.json`.

| Garment/source                                                                                 | Photographer                                                                               | Selected license for source and derivatives                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [T-shirt2.jpg](https://commons.wikimedia.org/wiki/File:T-shirt2.jpg)                           | Elkagye                                                                                    | Public-domain dedication by the photographer                    |
| [Blue Business Shirt.jpg](https://commons.wikimedia.org/wiki/File:Blue_Business_Shirt.jpg)     | ChristianGlaeser                                                                           | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| [Grey knitted sweater.jpg](https://commons.wikimedia.org/wiki/File:Grey_knitted_sweater.jpg)   | Aslak Raanes; original [Flickr photograph](https://www.flickr.com/photos/aslakr/47039780/) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)       |
| [Jeans.jpg](https://commons.wikimedia.org/wiki/File:Jeans.jpg)                                 | Oktaeder; uploaded to Commons by Juanmak                                                   | Public-domain dedication by the photographer                    |
| [Chino pants.jpg](https://commons.wikimedia.org/wiki/File:Chino_pants.jpg)                     | Kuha455405                                                                                 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| [Pantaloneta.jpg](https://commons.wikimedia.org/wiki/File:Pantaloneta.jpg)                     | Oscarin200                                                                                 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| [A pair of white shoes.jpg](https://commons.wikimedia.org/wiki/File:A_pair_of_white_shoes.jpg) | JustinLiang522                                                                             | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| [Jacke Microfaser.jpg](https://commons.wikimedia.org/wiki/File:Jacke_Microfaser.jpg)           | Ryj, as attributed on the source page                                                      | Public-domain dedication on the source page                     |

Changes: resizing, hand-authored garment/protected-region masks, background removal by those masks, crop/contain placement and deterministic color transforms. Sources, masks and image derivatives retain the listed terms; preserve attribution, license links, modification notices and applicable ShareAlike terms when distributing these image assets. Pictured manufacturers and photographers do not endorse the app. This image-credit record does not change the licensing of unrelated application code.

### Earlier preparation record

- Resized source bytes: `public/catalog/sources/<type>.jpg`; full source URLs, creator names, selected license and modification notices: `credits.json` in that directory.
- Authored outline/protected-region coordinates: `scripts/catalog-masks.json`, normalized to 0–1000 in source-image space. Protected regions include sneaker laces/lining/soles, sweater decoration and garment labels/trim. These masks are specific to these photographs, not an automatic upload segmenter.
- Transform: `src/lib/images/catalog-recolor.ts`. It applies the named color within the mask and retains luminance variation. Pale targets use gentler shadow contrast to avoid making pale denim look like a high-contrast drawing. Transparent/protected pixels are unchanged by recoloring.
- The original renderer used the installed Playwright and native browser Canvas with network blocked. The current `scripts/prepare-catalog.mjs` prepares v2 from the studio PNG sources. The earlier JPGs, authored masks and v1 outputs remain retained as provenance and to keep the original comparison board available.
- Run `npm.cmd run catalog:prepare` under the documented Node 22 runtime for the current v2. Type IDs can be passed after `--` for targeted inspection; perform a full regeneration afterward to refresh the complete manifest. Node may report its module-syntax auto-detection warning when importing TypeScript configuration.
- Outputs: 512×640 transparent PNGs at `public/catalog/v1/<type>-<color>.png`, plus canonical `<type>-base.png`, `<type>-mask.png` and `manifest.json` for verification/provenance. The 64 variant PNGs occupy 12,995,228 bytes in this revision, ranging from 67,574 to 340,148 bytes. This is stored asset size, not a claim about the download cost of a page: the UI uses responsive Next.js Image rendering and lazy loading.
- Bump the asset revision before changing shipped source/mask/recipe meaning; retain referenced older images when persistent selections/history are introduced. Wardrobe currently resolves the same type/color through the shared `catalogImage` adapter used by Quick-add; later Outfits must reuse it.

### Earlier review and limitations

The initial feasibility set covered a light cotton T-shirt, denim and mixed-material sneakers in light/dark/saturated colors. All 64 color variants were then visually reviewed against the charcoal canvas. Browser checks inspect actual PNG pixels for alpha consistency, preserved protected regions and color-family correspondence. Those checks supplement visual review rather than proving that every fabric appearance is exact.

The photographs are sample representations. Recoloring changes the main material color; neckline, sleeves, fit and pattern tags do not synthesize a new garment. Existing sweater decoration and shoe trim remain visible/protected, and the product labels other details as representative. Colors are approximate across materials and displays, not calibrated textile measurements. Recoloring personal uploads and automatic garment segmentation remain outside this feature.
