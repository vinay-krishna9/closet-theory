# Personal Stylist — Repository Instructions

## Project and reference documents

Build a real, published personal stylist app: users add wardrobe photos or sample staples, receive deterministic outfit suggestions, express preferences and track wears.

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
- shadcn/ui for shared controls, styled to `design.md`; Lucide outline icons.
- npm as the package manager. Keep `package-lock.json` consistent and do not introduce another package manager's lockfile.
- Proposed backend: Supabase for authentication, Postgres and private image storage; proposed hosting: Vercel. Confirm these during setup before provisioning services or introducing alternatives. A proposed service does not authorize deployment or live changes.
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
    supabase/             client/server adapters if Supabase is confirmed
  styles/                 semantic tokens and global styles
supabase/migrations/      versioned database changes if Supabase is confirmed
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

No scaffold or verified package scripts existed when this file was prepared. Do not invent commands or describe unverified scripts as working.

After approved scaffolding:

1. Inspect `package.json` and record the actual install, development, test, type-check, lint and build commands here or in the README.
2. Document environment setup and isolated database/test configuration.
3. Verify the documented commands and keep them current when scripts change.

## Definition of done

A feature is complete when:

- The approved end-to-end behavior works, including relevant loading, empty, error and recovery states.
- Appropriate tests are added or updated and relevant checks pass.
- Affected UI has been reviewed on mobile and desktop, with accessibility checks appropriate to the change.
- Relevant setup, behavior and architecture documentation is updated within the approved scope.
- The final report briefly states what changed, what was tested and any remaining limitations. If checks or review were blocked, say so and do not present the feature as fully verified.

Keep this file concise and accurate as the repository evolves. Update concrete paths and commands after setup; request a decision before changing approved workflow or product rules.
