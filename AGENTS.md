# Personal Stylist — Repository Instructions

## Project and reference documents

Build a real, published personal stylist app: users add wardrobe photos or sample staples, receive deterministic outfit suggestions, express preferences and track wears.

- Read `docs/MVP.md` for scope, `docs/user-flows.md` for journeys, `docs/architecture.md` for technical boundaries, and `docs/development-plan.md` for delivery.
- Read `design.md` before UI work. It defines visual tokens, components, responsive behavior, accessibility and interactions. Do not duplicate its specifications here.
- Read the existing README, package scripts and relevant code before making changes. Follow established project conventions unless a change is approved.
- The MVP includes wardrobe management, automatic background removal with original-photo fallback, staples, rule-based outfit suggestions, outfit preferences and wear statistics. Shopping/affiliate suggestions are deferred.
- Outfit matching is rule-based, not model-generated. Image processing is a separate concern.

## Plan, approval and communication

- Before implementing each feature, present a brief plan in simple grouped bullets: what will change, how it will be implemented and how it will be checked. Wait for the user's approval before coding. Read-only investigation needed to make the plan concrete may happen beforehand.
- Once the plan is approved, execute it, make routine implementation choices and fix related issues without repeatedly requesting approval. Ask again if scope or an approved decision changes.
- For missing product decisions, present short options, a brief explanation and your best recommendation. Do not silently decide behavior the user has not approved.
- Before adding a new dependency, present what it does, why it is needed and your recommendation, including using existing tools where reasonable. Approval in a feature plan covers dependencies explicitly included in that plan; do not ask twice.
- Keep progress updates short. Explain important choices and results in plain language. Use option-based questions when available.
- Do not commit, push, merge, publish or deploy unless the user explicitly asks. Permission for one action does not imply permission for the others.
- Preserve unrelated user changes. Do not revert or overwrite work to make your task easier.

## Approved tools

- Next.js, TypeScript and Tailwind CSS.
- ESLint with Next.js/TypeScript rules for linting, and Prettier for formatting. TSLint is deprecated and is not used (approved 12 November 2026). Run `npm run lint` and `npm run format:check`; use `npm run format` for intentional formatting changes.
- shadcn/ui for shared controls, styled to `design.md`; Lucide outline icons.
- npm as the package manager. Keep `package-lock.json` consistent and do not introduce another package manager's lockfile.
- Confirmed stack: Clerk for Google/email-password authentication, Supabase Postgres and private image storage, and Vercel hosting on an eligible plan. Attempt background removal in the browser and validate it early on mobile. Provisioning, spending and live changes still require authorization. Do not introduce Supabase Auth as a second login system.
- Approved proposed testing stack: Vitest, React Testing Library and Playwright. Verify compatibility with the actual framework/runtime during setup. Present material substitutions for a decision.
- Check installed versions and their supported APIs. Do not mix examples from incompatible framework versions or shadcn/ui primitive families.

## Code organization

Group application code by feature. Keep routes thin, shared UI reusable and business rules independent of framework and persistence details.

Suggested starting map; adapt to the actual Next.js scaffold and keep it consistent:

```text
src/
  app/                    routes, layouts, loading and error boundaries
  components/ui/          shared shadcn/ui-based controls
  features/
    wardrobe/             cards, item editor, uploads and wardrobe behavior
    outfits/              composition canvas, preferences and wear actions
    statistics/           summaries, charts and accessible equivalents
    onboarding/           starter wardrobe and staples selection
    account/              account UI and settings
  lib/
    outfits/              pure deterministic scoring and outfit identity
    images/               image validation and processing adapters
    supabase/             client/server adapters for Supabase
  styles/                 semantic tokens and global styles
supabase/migrations/      versioned database changes for Supabase
tests/e2e/                browser journeys
```

- If the scaffold uses root-level `app/` instead of `src/app/`, use one convention rather than creating parallel trees. Confirm the concrete folder map in the approved setup plan.
- Co-locate unit/component tests with the code they test. Keep integration fixtures and helpers clearly separated from production code.
- Do not create empty abstractions or folders merely to match this suggested map.
- Keep server-only operations and credentials outside client bundles. Isolate interactive client components instead of marking whole routes as client components unnecessarily.
- Reuse semantic tokens and shared components. Keep garment-specific cards, the outfit canvas and upload workflow custom to the product.

## Business behavior to preserve

- Keep outfit scoring deterministic and independently testable: style compatibility, freshness and preference behavior must have clear boundaries.
- Use a stable outfit identity derived from sorted item IDs; do not attach persistent feedback to a result's list position.
- Store one outfit preference: favorite, neutral/no opinion, or disliked. No opinion is the default. The heart represents favorite; there is no separate favorite field, numeric rating or individual-item favorite feature.
- Apply wardrobe availability and active filters before grouping favorites first, then neutral suggestions. Disliked suggestions are hidden unless revealed, then appear last. Order within groups consistently.
- Automatic background removal must support preview, retry and explicit use-original fallback without losing tags. Do not represent failed processing as a successful cutout.
- “I wore this” logs today immediately and offers Undo. Protect retries and rapid clicks from duplicate wear events. Preserve consistent outfit and item counts.
- Follow `design.md` for all remaining interaction details. Ask about genuine conflicts instead of silently changing a settled behavior.

## Data, migrations and privacy

- Track database schema changes in versioned migrations. Explain schema and data effects in the approved plan.
- Ask before executing destructive data operations or any change to a live database. Approval to write a migration does not authorize running it against production.
- Use isolated development/test data and a separate test database or equivalent isolated environment. Do not point automated tests at production.
- Use sample or appropriately licensed photos for fixtures. Do not copy private wardrobe photos or production records into tests, demos or screenshots.
- Enforce owner-only access at database/storage boundaries, not just in the UI. Test cross-account access denial.
- Keep service credentials server-side and secrets out of source control. Document required environment variable names using placeholders, never real values.
- Validate uploads server-side, strip metadata as specified and handle media cleanup. Do not log private photos, file contents, credentials or signed image URLs.
- Keep account/item deletion and derivative-image retention consistent with the documented product behavior. Ask before changing retention or external image-processing providers.

## Tests and verification

Use standard software tests. AI-assisted development does not replace them or justify tests that merely repeat generated implementation.

- Write assertions from agreed requirements and observable behavior. Test important success, boundary and failure cases.
- Unit tests: outfit rules, color harmony, season/formality compatibility, freshness, preference grouping and stable identity.
- Integration tests: item persistence, authentication/authorization, media failure handling, wear logging and Undo.
- Component tests: meaningful user interactions such as validation, feedback state and accessible editor behavior. Avoid tests that only mirror JSX or implementation details.
- Playwright journeys: upload → preview → save → suggest → favorite → log wear. Cover important recovery paths, including background-removal fallback.
- Add a regression test for a bug fix where behavior can reasonably be tested. Do not weaken or delete a valid test merely to make a change pass. If requirements changed, explain why the test must change.
- Test cancellation, stale upload results, duplicate submissions and cross-account access where relevant.
- Review affected UI at mobile and desktop sizes, including keyboard use, focus, errors and reduced motion. Run automated accessibility checks where available; supplement them with manual review.
- Run relevant tests, type checks, linting and a production build as appropriate. Do not claim a check passed unless it ran successfully. Report blockers and unverified behavior explicitly.
- No arbitrary coverage percentage or test for every trivial function is required. Prioritize meaningful protection of product behavior.

## Commands and setup

The BUILD-01 scaffold uses `src/app/` for App Router routes and `src/styles/globals.css` for base styling. Add feature directories only when needed. Co-locate component/unit tests; browser journeys live in `tests/e2e/`, with shared test setup in `tests/setup.ts`.

See `README.md` and `package.json` for installation, development, formatting, linting, type checking, tests and production commands. Use Node 22.18+ within the 22.x line and npm 10+. On restricted PowerShell installations, use `npm.cmd`/`npx.cmd` rather than changing execution policy.

`npm run check` runs formatting, linting, type checking and component tests. Run `npm run build` before `npm run test:e2e`, which starts its own production server at fixed loopback port 4174. Stop any listener on that port first; do not enable server reuse to hide conflicts. Checks exclude the separate prototype under `spikes/`.

The foundation needs no service credentials and connects to no database. Use only isolated data when service adapters are introduced; never target production in tests. Keep documented commands and CI current, and record actual verification results before declaring completion.

## Definition of done

A feature is complete when:

- The approved end-to-end behavior works, including relevant loading, empty, error and recovery states.
- Appropriate tests are added or updated and relevant checks pass.
- Affected UI has been reviewed on mobile and desktop, with accessibility checks appropriate to the change.
- Relevant setup, behavior and architecture documentation is updated within the approved scope.
- The final report briefly states what changed, what was tested and any remaining limitations. If checks or review were blocked, say so and do not present the feature as fully verified.

Keep this file concise and accurate as the repository evolves. Update concrete paths and commands after setup; request a decision before changing approved workflow or product rules.

## Settled product scope

- Visitors select owned clothes from the real quick-add catalog, use season/formality filters and get up to six suggestions with Show more. No separate demo or prefilled wardrobe. React context/reducer plus browser storage remembers selections; Redux is deferred.
- Visitors cannot upload personal photos, save preferences or log wears. Google/email-password signup or existing-account sign-in automatically imports selections once; retain local source until persistence succeeds. Sign-out clears account caches and starts a fresh visitor wardrobe.
- Catalog groups/types: Tops → T-shirt, shirt, sweater; Bottoms → jeans, chinos, shorts; Shoes → sneakers; Outerwear → simple jacket. Named common-color swatches and realistic licensed sample photos; editable defaults.
- Upload one garment at a time, confirm Group → Type, color, formality and seasons, review automatic background removal, then save or explicitly use the original. Offer Add another after success.
- Complete outfits need top, bottom and shoes; jacket optional. Season/formality filters include Any. No extra occasion requirement.
- Statistics are all-time. Removing a garment preserves historical wears, excludes it and dependent outfits from future suggestions, deletes its private photos and uses existing catalog imagery or a placeholder in history. Never add personal garments/photos to the shared catalog. Lifetime totals retain valid history; current most/least/never-worn lists include active items only. Account deletion is a separate privacy operation.
- Follow docs/product-decisions.md for resolved merge, jacket, timezone and Undo rules. Exact scoring weights/performance limits remain technical defaults to validate; do not reopen settled product choices.

## Resolved PLAN-02 decisions

Follow [agreed product decisions](docs/product-decisions.md) for optional quick-add customization, exact matching versus similarity warnings, upload/catalog photo choice, season/formality/jacket rules, style-first diverse ranking, patterns, verification, timezone, Undo and visitor navigation. These decisions supersede older provisional wording; only technical defaults and implementation checks remain open.
