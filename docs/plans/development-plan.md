# Personal Stylist — MVP Development Plan

Status: delivery plan with recorded sequencing updates through 18 November 2026. Per-feature approval and verification still apply; see [documentation index](../README.md) for current implementation status.

Save at `docs/plans/development-plan.md`. Read alongside [MVP requirements](../product/MVP.md), [user flows](../product/user-flows.md), [architecture](../technical/architecture.md), root [design.md](../../design.md) and root [AGENTS.md](../../AGENTS.md). This plan organizes delivery; it does not authorize implementation, service creation, spending, commits, pushes or deployment. Each feature follows the agreed brief-plan → approval → implement → verify workflow.

## 1. Delivery approach

Deliver small working journeys, not separate frontend and backend batches. The 10 November 2026 sequence put the visitor experience before SPIKE-02. On 18 November, after real two-account row-isolation checks passed in the harness, the user approved proceeding to real account implementation. Carry remaining security checks into the actual account/photo features instead of building another isolated screen. #4 stays open as the verification tracker and a release gate. Keep tests and accessibility in each milestone rather than deferring them to final polish. The [real account journey plan](ACCOUNT-journey-plan.md) awaits coding approval.

Proposed board: **Backlog → Ready → In progress → Review → Done**. Keep one main implementation issue in progress at a time. Put blocked work back in Backlog with a `blocked` label and an explicit dependency. Review means checks and acceptance criteria are available for inspection; Done requires their completion. Deployment remains separately authorized.

The [MVP project board](https://github.com/users/vinay-krishna9/projects/1) was originally seeded with issues #1–#21 in the task order below. The [repository backlog](https://github.com/vinay-krishna9/closet-theory/issues) also contains later follow-ups, including OUTFITS-02 (#31) for account suggestions. IDs such as PLAN-01 remain stable planning references. The last recorded board uses Todo → In Progress → Done; the five-column workflow above is a proposal, not an existing configuration. The 18 November task updates change issue bodies/dependencies; they do not claim a project-board status change.

## 2. Milestone sequence

| Milestone | User-visible outcome | Depends on |
| --- | --- | --- |
| M0 — Decisions and feasibility | Risks have evidence and requirements agree | None |
| M1 — Foundation | Accessible app shell and repeatable checks | PLAN-01 and applicable PLAN-02 decisions; SPIKE-02 does not block |
| M2 — Visitor wardrobe and suggestions | A visitor selects owned basics and gets outfits | M1 |
| M3 — Accounts and private wardrobe | Selections carry into a private synced account | M2; verified SPIKE-02 row-isolation baseline; real account authorization checks before completion |
| M4 — Personal photo flow | A user uploads, reviews and saves one garment | M3; image feasibility |
| M5 — Preferences and wear tracking | Feedback, wear logging, Undo and statistics work | M3; recommendation engine |
| M6 — Release candidate | Complete public journey verified and documented | M4, M5 |

M4 and M5 are not independently launched MVPs. The public MVP scope includes both. No calendar estimates are committed; estimate after M0 and update using actual progress.

## 3. M0 — Decisions and feasibility

### PLAN-01 — Reconcile source documents

- Update earlier auth references to Clerk with Supabase data/storage.
- Replace separate-demo language with the actual visitor quick-add experience.
- Align expanded catalog, group/type classification, one-photo upload, visitor import/sign-out and item-removal history rules.
- Add the agreed documentation locations to `AGENTS.md`.
- **Acceptance:** each settled decision has one clear meaning across the documents; remaining choices are labelled explicitly. Do not silently replace valid design details.

### PLAN-02 — Close product edge cases

- Product discussion completed; decisions are recorded in product-decisions.md and synchronized across local documents.
- Review the diff and commit/push only when requested; no automatic GitHub issue closure.
- **Acceptance:** customization, catalog matching/similarity, jacket/season/formality rules, style-first diversity/pattern handling, timezone, accessible 10-second Undo, outfit-only logging, verification/recovery/deletion and visitor navigation agree across documents.
- Exact scoring/configuration values, catalog asset versioning, candidate bounds and backup/cleanup timing remain implementation tasks, not settled numeric guarantees.

### SPIKE-01 — Validate mobile background removal

- Prototype code remains on branch [`spike/01-browser-background-removal`](https://github.com/vinay-krishna9/closet-theory/tree/spike/01-browser-background-removal), separate from `main`. Recorded snapshot: [`70eec67`](https://github.com/vinay-krishna9/closet-theory/commit/70eec67e429787632a893405c0992c8a06f487a5).
- See the snapshot's [setup and test instructions](https://github.com/vinay-krishna9/closet-theory/blob/70eec67e429787632a893405c0992c8a06f487a5/spikes/background-removal/README.md) and [findings/completion record](https://github.com/vinay-krishna9/closet-theory/blob/70eec67e429787632a893405c0992c8a06f487a5/docs/spikes/SPIKE-01.md). User signed off the prototype on 10 November 2026; four automated tests passed in the recorded run and manual results include clutter-related cutout failures. Physical-phone testing and other unverified checks remain follow-up work; mobile feasibility is not established. Prototype code has not been merged into `main`.
- Select and request approval for a candidate library/model; review license, download size, browser capabilities, worker support and memory behavior.
- Test representative garments on actual target mobile/desktop browsers where available; record tested devices and limitations.
- Validate preview, damaged cutout, timeout, cancel/reselect and explicit original-photo fallback.
- **Acceptance:** record measured processing/download behavior and sample quality; agree on an acceptable mobile experience. A failed result produces reviewed alternatives, never a silent hosted-provider switch. Do not claim unsupported devices were tested.

### SPIKE-02 — Validate Clerk and private Supabase access

- The isolated setup followed OUTFITS-01 (#10), and two-account row isolation is verified locally. Approved 18 November sequencing: proceed to ACCOUNT-01 (#11), completing expired/altered-token and real account authorization checks there. PHOTO-02 (#15) owns real private-media/cache checks. #4 stays open until linked feature evidence completes its matrix; its full closure no longer blocks starting those implementations.
- Prepare an approved sandbox setup plan; use only isolated test accounts/assets. No service provisioning without explicit authorization.
- The [SPIKE-02 execution record](https://github.com/vinay-krishna9/closet-theory/blob/spike/4-clerk-supabase-access/docs/plans/SPIKE-02-plan.md) documents the approved development setup, implemented harness, two-user row authorization results and remaining media/token checks. Completed local checkpoints have not yet been pushed or merged into main.
- Prove verified Clerk identity can access only its own Postgres rows and private media through the proposed server boundary.
- Verify anonymous denial, user A versus user B, expired session and private-image cache behavior.
- **Acceptance:** automated or reproducible checks demonstrate the complete row/media/session isolation matrix on actual feature paths. Record setup and evidence without secrets. Account and photo features must pass their relevant checks before completion; #20 requires the full #4 gate before release.

## 4. M1 — Foundation

### BUILD-01 — Scaffold and quality tooling

- Next implementation task (#5); do not block scaffolding or visitor checks on SPIKE-02 or service provisioning.
- Set up approved Next.js/TypeScript/Tailwind/npm structure, Vitest, React Testing Library and Playwright with compatible versions.
- Record actual install/dev/check/test/build commands, required environment variable names and isolated test setup.
- Configure CI to run relevant checks on branches/PRs; do not configure auto-production deployment without approval.
- **Acceptance:** meaningful smoke tests and documented local checks run; CI is reproducible; lockfile is consistent; no secrets or production test targets.

### BUILD-02 — Tokens and shared app shell

- Mobile/desktop Wardrobe, Quick-add and Outfits mockups are designed and user-approved, with visual review signed off on 13 November 2026. See [BUILD-02 status and evidence](../records/BUILD-02.md). Design remaining screens before their respective features.
- Completed locally on 13 November 2026: shared cool charcoal/graphite tokens (authoritative `design.md` section 17), global Space Grotesk/Manrope typography, Lucide icon wrapper, Radix/shadcn controls, dialog/editor foundations and route layouts. Production visitor routes show honest unavailable states; illustrative data stays in review routes. See BUILD-02 for check results and limits.
- Desktop/tablet account shell uses top navigation; mobile account shell uses bottom links. Public/visitor shell follows the approved flow decision.
- **Acceptance:** responsive shell, keyboard focus and reduced motion reviewed; no pure-white UI defaults or theme toggle; controls match `design.md`. Keep authentication-dependent destinations honest while backend features are incomplete.

## 5. M2 — Visitor wardrobe and suggestions

### VISITOR-01 — Quick-add catalog

The later user-approved studio image revision supersedes this task's initial real-photograph sourcing requirement. All eight types now use AI-generated studio samples with labelled provenance and locally prepared color variants; see [catalog assets](../assets/catalog-assets.md).

- Model the eight launch types and their named color variants/default tags. Source appropriately licensed realistic photos and record provenance.
- Include the 13 November 2026 catalog recoloring decision: validate garment-only recoloring early, show selected-color previews before Add, and reuse reviewed image/color references in Wardrobe and later Outfits. Use the approved broad color direction and studio imagery; see [completion record](../records/VISITOR-01.md) and `design.md` section 20.
- Let visitors select only clothes they own, inspect/edit tags and remove selections. No prefilling or uploads.
- **Acceptance:** group/type relationships are valid; sample photos are identified; color names are accessible; unselected garments are never added. Catalog ownership does not change when a user selects an item.
- **Local result:** the approved plan is implemented with eight types/64 color variants, editable selections, duplicate/similarity handling and public photo attribution. See [VISITOR-01 completion record](../records/VISITOR-01.md) for actual verification and limits. Reload persistence remains VISITOR-02.

### VISITOR-02 — Local wardrobe persistence

- Build on VISITOR-01's stable selection IDs and shared React context/reducer; add versioned browser storage and schema validation/migration.
- Recover after reload; handle blocked/corrupt storage gracefully with in-memory use and an explanatory notice.
- **Acceptance:** selections survive the intended lifecycle; no personal photos/session tokens are stored; visitors cannot perform account-only operations. Test reset and schema migration behavior.
- **Local result:** implemented on `visitor/02-local-persistence` with versioned schema validation, reload restoration, confirmed clearing, honest storage-failure recovery and cross-tab conflict detection. See [execution record](../records/VISITOR-02-plan.md) for actual verification and limits.

### VISITOR-03 — Stable editor actions and custom loading spinner

- Keep Add to wardrobe/Save changes and Cancel stationary while the selected color preview loads. Switch between a centered spinner during loading and the visible action text afterward, preserving button dimensions and accessible names.
- Build on VISITOR-01's preview readiness, error/retry and stale-result protection. Follow the [implementation plan](../records/VISITOR-03-plan.md), tracked in [issue #23](https://github.com/vinay-krishna9/closet-theory/issues/23).
- **Acceptance:** action positions and dimensions stay stable across loading, success and failure; saving requires the current preview; failure preserves edits and retry recovers. Verify desktop/mobile, keyboard focus, reduced motion and forced colors.
- **Status:** merged through PR #25 with passing CI from `visitor/03-loading-spinner` with the user-approved larger single-garment carousel. The shirt, dress and sneaker appear in sequence. Completion verification for the final revision is recorded in the execution plan. Depends on completed VISITOR-01 (#7).

### ENGINE-01 — Deterministic matching and reasons

- Implemented locally after user approval on 17 November 2026. The [execution record](ENGINE-01-plan.md) documents the pure engine, wardrobe adapter, scoring defaults, bounded generation, integration contract and verification. Visitor result-screen integration follows in OUTFITS-01.
- Implement eligibility, top/bottom/shoe completeness, approved optional-jacket policy, compatibility and freshness inputs in pure TypeScript.
- Inject time and keep decorative canvas tint independent of matching.
- **Acceptance:** unit tests cover expected matches, rejected combinations, missing groups, Any filters, deterministic ties and realistic candidate bounds. Reasons describe actual rules; ranking scores stay internal.

### OUTFITS-01 — Visitor result journey

- Follow the [execution plan](OUTFITS-01-plan.md), reflecting the approved 17 November 2026 visitor limit. Wire season/formality filters and up to three visitor results to the shared engine. Offer signup/sign-in for further matches, with accurate messaging while accounts are unavailable. Six-result pages and Show more belong to the account journey.
- Implement neutral composition cards, missing-category guidance, no-compatible-results recovery and account-benefit messaging.
- **Acceptance:** complete browser journey from catalog selection to suggestions, capped at three visitor results. Fewer matches remain honest, and the account prompt describes actual available benefits. Filters are not silently changed. Mobile, keyboard, empty/error recovery and visitor account-only boundaries work.
- **Local result:** implemented on `feat/10-visitor-outfits`. Production-bundled worker generation, the three-result policy, compositions, shared account notice, targeted catalog links and recovery are verified. See the [execution record](OUTFITS-01-plan.md) for actual checks and browser steps.

**Milestone gate:** a new visitor can select sufficient owned basics, refresh the page and obtain understandable compatible suggestions without authentication.

## 6. M3 — Accounts and private wardrobe

### ACCOUNT-01 — Auth lifecycle and private data schema

- Verified implementation, 23 November: real Clerk entry/profile routes, verified server adapters and owner-safe schema are configured in the approved development services. Unit/component, visitor and desktop/mobile live account checks passed; see [setup and evidence](../technical/account-development.md). Automatic import and synced clothing remain #12/#13.

- Start the real journey using the [account implementation plan](ACCOUNT-journey-plan.md). #4's row-isolation baseline is established; full #4 closure is not a prerequisite to begin. Real-account anonymous/cross-account/expired/altered-token checks remain mandatory before completing #11.

- Implement Clerk Google/email-password flows, approved verification/recovery behavior and minimal owner-scoped schema through migrations.
- Add row-level security and owner-safe relationship constraints; keep elevated credentials out of routine requests.
- **Acceptance:** sign-in/out and session expiry work; authorization tests deny anonymous/cross-account reads and writes. Signing out clears account client data and starts a fresh visitor wardrobe.

### ACCOUNT-02 — Retry-safe automatic visitor import

- Import selected quick-add clothes after signup or existing-account sign-in, following the approved merge rule.
- Persist import keys/mappings atomically with items; retain local selections until server success.
- **Acceptance:** cancelled auth loses nothing; failed import is recoverable without another signup; retry/refresh does not duplicate imports; intentionally distinct garments are preserved. Explain carryover before authentication.

### WARDROBE-01 — Synced quick-add wardrobe CRUD

- Add/list/filter/edit/remove account catalog-based items; use one editor form across side drawer/full-screen presentations.
- Preserve item identity and unsaved work; make removal ready for historical references even before wear features are available.
- **Acceptance:** account wardrobe persists across authenticated devices; errors preserve recoverable work; validation and keyboard focus work; removal excludes affected outfits from future results. No item favorites.
- **Verified, 24 November:** owner APIs, versioned/retry-safe mutations and the catalog/wardrobe/editor integration pass local PostgreSQL checks, 198 unit/component tests, production build, 66 visitor journeys, four configured account-entry journeys and eight hosted wardrobe journeys. The user applied the test migration and confirmed CRUD/reload/second-context sync. Hosted recovery/conflict/account-switch and API/RLS isolation checks passed; fixtures were cleaned up. Desktop/mobile editor screenshots were reviewed. See [results and manual checks](WARDROBE-01-plan.md). Delivery targets main through PR #34; account outfits follow in #31.

### OUTFITS-02 — Account suggestions and paging (#31)

- Generate results from the verified owner's persisted active wardrobe with the shared engine and approved composition UI. Up to six results per page; Show more only when available. Visitors keep their three-result allowance.
- Bind paging to the owner and wardrobe/filter snapshot; invalidate results after mutation, removal, sign-out and account switch. No working feedback/wear controls until their features ship.
- **Acceptance:** distinct pages, correct filters/identities, server ownership checks, reload and stale-request recovery verified on desktop/mobile. Depends on #11, #13, #9 and #10.
- **Verified locally, 24 November:** approved implementation on `feat/31-account-outfits`; no migration/dependency changes. Formatting/lint/types, 218 unit/component tests, production build, 66 visitor and eight hosted account outfit journeys passed. Owner-bound pages, retry/removal invalidation, filters, foreign snapshots and pending-response account switches are checked; fixture cleanup completed and desktop/mobile screenshots reviewed. See [actual evidence and manual checks](OUTFITS-02-plan.md). Remote delivery awaits authorization.

**Milestone gate:** visitor selections carry into a private account exactly once, remain manageable after reload/sign-in and generate account suggestions. #11, #12, #13 and #31 pass together.

## 7. M4 — Personal photo flow

### PHOTO-01 — One-garment upload and review

- Integrate the validated browser processor, orientation/metadata handling, preview and editable tags with group/type classification.
- Keep explicit Retry, Use original and Choose another photo recovery. Save succeeds before Add another resets the form.
- **Acceptance:** tests cover validation, removal failure, poor cutout fallback, timeout, cancel/reselect and stale completion. The mobile keyboard/footer and processing state remain usable.

### PHOTO-02 — Private persistence, replacement and cleanup

- Complete #4's media verification using these actual feature paths: anonymous/cross-account/expired/altered-token denial, owner-path manipulation, private-image caching, sign-out/account-switch/back-navigation behavior. Depends on #14 and #11 with the verified #4 baseline; do not require #4 to close before implementing the media operations needed to finish it. #20 retains #4 as a release gate.

- Implement server-side validation, authorized upload/read delivery, pending media operations and cleanup retry.
- Keep previous images until replacement commits. Removing an item deletes private derivatives while history uses existing catalog imagery or a placeholder.
- **Acceptance:** cross-account media access is denied; failed saves do not leave active broken items; abandoned assets can be cleaned up; private data is absent from logs. Actual deletion/URL expiry behavior matches privacy information.

**Milestone gate:** upload → review/fallback → tag → save → refresh works with authorized private photos on mobile and desktop.

## 8. M5 — Preferences, wears and history

### FEEDBACK-01 — Three-state outfit preference

- Persist favorite/neutral/disliked against owner-scoped stable combination identity; expose Heart and CircleSlash controls.
- Favorite first, neutral next; disliked hidden unless revealed last. Check eligibility before grouping.
- **Acceptance:** neutral is default; selected feedback clears on reactivation; regeneration preserves preference; failed writes reconcile UI; removed garments never return through favorites. No separate favorite flag or stars.

### WEAR-01 — Wear event and Undo

- Transactionally write an outfit wear event and constituent item memberships using operation-level idempotency.
- Implement the approved timezone and Undo rules; derive totals without independently mutable counters.
- **Acceptance:** double clicks/retries do not duplicate an event; explicit separate events follow product rules; Undo is retry-safe and reverses the same event's effects. Failures report actual saved state.

### STATS-01 — All-time statistics and historical display

- Show outfit wears, item counts and current most/least/never-worn lists with accessible equivalents for charts.
- Preserve removed-item historical counts/labels with catalog-image fallback; current wardrobe rankings exclude removed items.
- **Acceptance:** totals match underlying non-undone events; empty history differs from load failure; image replacement/tag edits/removal do not rewrite past event meaning. No date-range controls or invented history.

**Milestone gate:** suggest → favorite → log wear → inspect stats → Undo works; removal preserves past history while removing future eligibility.

## 9. M6 — Release candidate

### RELEASE-01 — Public landing and completed account surfaces

- Build the editorial landing with alternating warm light/charcoal sections, accurate product illustrations and visitor/account entry points.
- Complete Profile, privacy information, account/data deletion and approved verification/recovery flows.
- **Acceptance:** real functionality matches public claims; only licensed/owned imagery; no fake users/testimonials; account deletion cleans up personal data/media with documented retry/retention behavior.

### RELEASE-02 — Cross-flow verification and release review

- Run full critical journeys and failure-path tests; review mobile/desktop, keyboard, contrast, reduced motion and private-media authorization.
- Verify migrations, environment separation, limits, dependency licenses, recovery steps and production-build behavior.
- Prepare README, setup/run instructions, architecture links, screenshots using sample data and known limitations.
- **Acceptance:** relevant checks pass and evidence is reported. Any blocked/untested requirement is explicit; no declaration of full verification without it.

### RELEASE-03 — Authorized deployment and smoke checks

- Present a concrete release plan: target environment, services/costs, migrations, privacy readiness, smoke checks and rollback/recovery steps.
- Only provision, apply live migrations, push or deploy when separately authorized under the agreed workflow.
- **Acceptance:** after authorized deployment, verify visitor flow, auth redirects, private upload, import, feedback and wear/Undo on the real URL with designated test data. Document production configuration without exposing secrets.

## 10. Issue template

Use one issue per independently reviewable behavior. Split the items above when implementation would become too large; preserve their dependency links.

```markdown
## User need / outcome
Who benefits, and what must work?

## Scope
Included behavior and boundaries. Link the relevant requirement/flow.

## Dependencies and decisions
Blocking issues and any user decision still needed.

## Acceptance criteria
- Observable success behavior
- Relevant empty/error/recovery behavior
- Accessibility, privacy or history constraints

## Verification
Meaningful automated tests and manual/device checks.

## Completion evidence
Actual checks/results and any remaining limitation.
```

## 11. Board rules and labels

- Suggested labels: `planning`, `feasibility`, `feature`, `bug`, `tests`, `accessibility`, `security`, `docs`, `blocked`. Milestones express delivery grouping; avoid a large label taxonomy.
- Ready requires settled behavior, acceptance criteria and available dependencies. A design question is not ready implementation work.
- In progress starts after the issue's brief implementation plan is approved. New dependencies are explained and approved as part of that plan or separately.
- Review requires a working change and check results; it is not automatic approval to commit, merge or deploy.
- Done follows the definition in `AGENTS.md`: behavior, relevant tests/checks, responsive review, documentation and honest report. Spike issues instead require documented evidence and a decision.
- Add newly discovered bugs/requirements to the backlog rather than quietly expanding the current feature. Routine fixes within the approved scope do not need repeated permission.

## 12. Immediate next action

ACCOUNT-01 (#11) is implemented and verified against the approved development services. ACCOUNT-02 (#12) is implemented and verified against the approved development services. The user approved #13's concrete synced-wardrobe plan; proceed on its own branch after #12 merges, retaining separate approval for any new hosted changes. Follow with #13 synced wardrobe and #31 account outfit paging. Keep #4 open for the private-media and release verification matrix through #15/#20. The spike harness remains on its preserved remote branch outside main. New hosted changes and deployment require their applicable authorization.

## Resolved PLAN-02 decisions

Follow [agreed product decisions](../product/product-decisions.md) for optional quick-add customization, exact matching versus similarity warnings, upload/catalog photo choice, season/formality/jacket rules, style-first diverse ranking, patterns, verification, timezone, Undo and visitor navigation. These decisions supersede older provisional wording; only technical defaults and implementation checks remain open.
