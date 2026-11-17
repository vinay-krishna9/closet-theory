# Closet Theory

A personal stylist app for outfits from clothes you already own. BUILD-01/02 supply the shared foundation. **VISITOR-01 adds the real quick-add catalog and editable visitor wardrobe**, with eight garment types and 64 color variants using the user-approved AI-generated studio imagery. VISITOR-02 adds browser-only wardrobe persistence and storage recovery. ENGINE-01 supplies the pure deterministic matching engine and wardrobe adapter. OUTFITS-01 will connect that engine to visitor result cards. Accounts and personal uploads follow later.

## Local setup

Use **Node 22.18.0 or newer within Node 22.x**, and **npm 10+**. CI uses Node 22.18.0. From the repository root:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:3000 and follow Explore your wardrobe, or open http://127.0.0.1:3000/wardrobe. Use `/quick-add` to select clothes you own, preview colors, customize details and add them. Selections survive navigation, refresh and reopening the same browser. A new visitor wardrobe starts empty. Browser saving is local to this browser and is not synced; clearing browser data can remove it. Use Clear visitor wardrobe to reset selections after confirmation. Storage failures preserve in-memory use and show recovery controls. `/outfits` still explains that recommendations are unavailable. Stop the server with Ctrl+C. On restricted PowerShell, use `npm.cmd`/`npx.cmd`; no execution-policy change is needed.

Catalog cards add their default configuration. Choose Customize to change color and select individual seasons. Catalog group/type stay fixed in Customize and wardrobe editing. The editor keeps the garment visible, with name/color on the left and garment details and other options on the right on desktop. Phones use a compact pinned preview. Garment images show a skeleton that preserves their space during loading, color changes and retry. A shared carousel shows one larger shirt, dress or sneaker at a time inside Add to wardrobe/Save changes while the selected preview loads. The centered animation replaces the button text while loading and restores it afterward, keeping button dimensions steady. Reduced motion shows one still shirt.

For BUILD-02, open http://127.0.0.1:3000/design-review/wardrobe. The three isolated review screens use labelled illustrative images and sample data, without persistence or real recommendations. Use the review toolbar for empty/loading/error states, Add clothing for Quick-add and the navigation for Outfits. See [BUILD-02 review notes](docs/records/BUILD-02.md). These mockups are not a separate product demo or a prefilled real visitor wardrobe.

No environment variables, Clerk application, Supabase project, database, storage bucket or paid service is required for this foundation. Do not add real service credentials to source control. Future adapter work must document exact environment variable names with placeholders and separate development/test services before use. No provisioning, database migrations or deployment is configured here.

## Commands

| Command                       | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `npm.cmd ci`                  | Install exact versions from the root npm lockfile                          |
| `npm.cmd run dev`             | Start local development on loopback port 3000                              |
| `npm.cmd run format`          | Apply Prettier formatting                                                  |
| `npm.cmd run format:check`    | Check formatting without modifying files                                   |
| `npm.cmd run lint`            | Run ESLint with Next.js and TypeScript rules; warnings fail                |
| `npm.cmd run lint:fix`        | Apply ESLint's available automatic fixes                                   |
| `npm.cmd run typecheck`       | Run strict TypeScript checks                                               |
| `npm.cmd test`                | Run Vitest/React Testing Library component tests once                      |
| `npm.cmd run test:watch`      | Run component tests in watch mode                                          |
| `npm.cmd run check`           | Run format check, lint, types and component tests                          |
| `npm.cmd run build`           | Create the production build                                                |
| `npm.cmd start`               | Serve the existing production build on loopback port 3000                  |
| `npm.cmd run test:e2e`        | Run Playwright against its own local production server on port 4174        |
| `npm.cmd run catalog:prepare` | Regenerate catalog color images and provenance manifest from local sources |

For a full local verification:

```powershell
npm.cmd run check
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The browser suite requires a successful production build. Leave port **4174** free; Playwright starts and stops its own server and deliberately refuses to reuse an existing process. Tests use a fixed loopback URL, cannot be redirected to production via an environment override, and need no accounts or private photos. Pixel-device emulation checks responsive behavior, not physical Android performance. Chromium is the initial smoke-test browser; real Safari/Firefox/device verification remains later work.

Vitest handles synchronous components and pure logic; use browser/integration coverage for async Server Components. Co-located tests cover catalog validation, selection identity/duplicates, editable forms and recoloring invariants. Browser checks cover actual catalog → customization → wardrobe → edit/remove, similarity choices, image failure/retry, stale image results and reload persistence, explicit reset and storage recovery, plus foundation and design-review regressions. All user selections in product tests come from explicit actions; no visitor wardrobe is seeded from review data. Photo provenance and preparation details are in [the asset record](docs/assets/catalog-assets.md).

To verify ENGINE-01 directly, run its rule/generation tests and the restored-wardrobe adapter tests. The verbose output names the filter, jacket, preference, freshness, diversity, paging and budget cases being checked.

```powershell
npm.cmd test -- src/lib/outfits src/features/wardrobe/outfit-items.test.ts --reporter=verbose
```

The [ENGINE-01 execution record](docs/plans/ENGINE-01-plan.md) documents its API, generation limits, measured examples and repeatable testing steps. The visitor Outfits screen is connected during OUTFITS-01 (#10).

The [OUTFITS-01 execution plan](docs/plans/OUTFITS-01-plan.md) applies the approved visitor allowance of up to three outfits, with an account prompt for further matches. Account users retain six-result pages and Show more. The current Outfits route remains at its documented development state until that plan is implemented.

## Repository map

```text
src/app/                  Thin App Router pages, layouts and co-located tests
src/app/(workspace)/      Visitor shell layout and wardrobe/quick-add/outfits routes
src/components/           Shared app shell and its navigation modes
src/components/ui/        Token-styled Radix/shadcn controls and editor foundation
src/features/design-review/  Isolated sample screens; no real wardrobe data
src/features/onboarding/   Public catalog configuration and quick-add UI
src/features/wardrobe/     Visitor state, selection rules, garment cards and editor
src/lib/images/            Deterministic catalog recoloring, separate from outfit rules
src/lib/outfits/           Pure matching, ranking, reasons, stable identity and paging
src/lib/utils.ts          Shared class merging for UI controls
src/styles/               Global fonts/base styles, tokens and shared component styles
public/catalog/           Studio sources, masks, color variants, provenance and earlier photo credits
scripts/                  Reproducible local catalog asset preparation
tests/setup.ts            Component-test setup and cleanup
tests/e2e/                Playwright journeys
.github/workflows/        Branch/PR checks, without deployment
docs/README.md            Documentation index and folder guide
docs/product/             MVP scope, user flows and agreed decisions
docs/technical/           Architecture and implementation boundaries
docs/plans/               Delivery sequence and feature execution plans
docs/records/             Delivered feature records and verification
docs/assets/              Catalog provenance and preparation
docs/reviews/             Visual review pages and supporting media
```

No empty feature or persistence folders are created. The root layout self-hosts Space Grotesk/Manrope for all routes; shared colors, spacing and controls follow the approved charcoal design. `components.json` records the shadcn/ui setup with Radix as the only primitive family. `src/features/design-review/` retains review-specific garment layouts and illustrative assets in `public/design-review/`, while consuming shared tokens, buttons, fields and editor foundations. Pages remain noindex while the product is incomplete.

## Tooling and CI

Next.js App Router 16.4.6, React 19.3.1, TypeScript 5.9.3 and Tailwind 4.3.5 are pinned in the lockfile. ESLint 9 uses Next's core-web-vitals and TypeScript presets; Prettier is separate, avoiding competing style rules. TSLint is deprecated and was replaced by ESLint with user approval. jsdom 26.1 supports the installed Node 22.18 runtime; newer jsdom releases require a newer Node patch. TypeScript 5.9 stays within the installed typescript-eslint support range (`<6.1`), rather than installing the incompatible current TypeScript major. Upgrade compatible groups deliberately and rerun checks.

Known tooling limitations from the 12 November 2026 install: npm marks ESLint 9.39.5 as out of support, but the React lint plugin in the Next preset currently declares support only through ESLint 9. The install also reports eight moderate development-dependency advisories tracing to minimatch through typescript-eslint ([advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)). These are not resolved by the passing source checks. Do not run `npm audit fix --force`, downgrade the Next preset to another framework major, or force an unsupported peer combination to hide them. Revisit the maintained preset/plugin combination and patched transitive dependencies before considering tooling fully settled.

Tailwind 4 uses `@tailwindcss/postcss` and a CSS import, not a Tailwind 3 configuration. Next 16 does not run ESLint during `next build`, so lint is an explicit check. Formatting excludes existing product specifications that are outside the scaffold change; lint, types and tests exclude the separate prototype.

GitHub Actions runs installation, formatting, lint, types, component tests, production build and Chromium checks on branch pushes and pull requests. It uses read-only repository permissions, no service secrets and no deployment action. Failure reports/traces are retained for seven days; keep fixtures free of private data. Workflow execution can only be verified after an authorized push. `NEXT_TELEMETRY_DISABLED=1` is set for CI and the browser-test server; it can also be set locally if desired.

Git checks text files out with LF line endings through `.gitattributes`, matching Prettier and EditorConfig on every platform. This keeps Windows checkouts compatible with `npm.cmd run format:check`.

## Product references and prototype

Use the [documentation index](docs/README.md) for document ownership, current delivery status and verification records.

- [Repository instructions](AGENTS.md)
- [Design specification](design.md)
- [MVP requirements](docs/product/MVP.md), [user flows](docs/product/user-flows.md) and [resolved decisions](docs/product/product-decisions.md)
- [Architecture](docs/technical/architecture.md) and [development plan](docs/plans/development-plan.md)
- [ENGINE-01 execution plan for issue #9](docs/plans/ENGINE-01-plan.md)
- [BUILD-01 verification and limitations](docs/records/BUILD-01.md)
- [VISITOR-01 implementation and verification](docs/records/VISITOR-01.md), [VISITOR-03 execution plan](docs/records/VISITOR-03-plan.md) and [catalog photo credits](docs/assets/catalog-assets.md)
- Background-removal experiment: [prototype branch](https://github.com/vinay-krishna9/closet-theory/tree/spike/01-browser-background-removal), [recorded findings](https://github.com/vinay-krishna9/closet-theory/blob/70eec67e429787632a893405c0992c8a06f487a5/docs/spikes/SPIKE-01.md). Its code is not merged into the application; local photos and downloaded artifacts remain ignored.

SPIKE-02 will validate Clerk/Supabase owner isolation after visitor features and before account/private-data features. Outstanding physical-mobile image-processing checks remain a gate for personal-photo work. Neither integration is verified by this scaffold.
