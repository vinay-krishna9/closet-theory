# Personal Stylist — MVP Development Plan

Status: proposed delivery plan for review · 7 November 2026

Save at `docs/development-plan.md`. Read alongside `MVP.md`, `user-flows.md`, `architecture.md`, root `design.md` and root `AGENTS.md`. This plan organizes delivery; it does not authorize implementation, service creation, spending, commits, pushes or deployment. Each feature follows the agreed brief-plan → approval → implement → verify workflow.

## 1. Delivery approach

Deliver small working journeys, not separate frontend and backend batches. Prove the riskiest integrations early, then build the visitor experience before accounts and personal uploads. Keep tests and accessibility in each milestone rather than deferring them to final polish.

Proposed board: **Backlog → Ready → In progress → Review → Done**. Keep one main implementation issue in progress at a time. Put blocked work back in Backlog with a `blocked` label and an explicit dependency. Review means checks and acceptance criteria are available for inspection; Done requires their completion. Deployment remains separately authorized.

The [MVP project board](https://github.com/users/vinay-krishna9/projects/1) contains [21 issues](https://github.com/vinay-krishna9/closet-theory/issues), numbered #1–#21 in the task order below. IDs such as PLAN-01 remain stable planning references. The current saved board uses Todo → In Progress → Done; the five-column workflow above is a proposal, not an existing configuration.

## 2. Milestone sequence

| Milestone | User-visible outcome | Depends on |
| --- | --- | --- |
| M0 — Decisions and feasibility | Risks have evidence and requirements agree | None |
| M1 — Foundation | Accessible app shell and repeatable checks | M0 gates |
| M2 — Visitor wardrobe and suggestions | A visitor selects owned basics and gets outfits | M1 |
| M3 — Accounts and private wardrobe | Selections carry into a private synced account | M2; auth feasibility |
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

- Decide duplicate catalog selections versus multiple owned garments; existing-account import merge behavior; permitted tag choices and Any semantics.
- Decide optional-jacket generation, initial matching rules/weights, tie-breaking, diversity and candidate limits.
- Decide timezone behavior, Undo availability, whether individual-item wear logging belongs in launch UI, and effects of catalog asset changes on history.
- Confirm account deletion/backup retention, auth verification/recovery and visitor-shell navigation.
- **Acceptance:** user-facing decisions are approved with short options/recommendations, then reflected in requirements and issue acceptance checks. Avoid an open-ended planning phase: resolve each choice before its dependent issue, not necessarily all before scaffolding.

### SPIKE-01 — Validate mobile background removal

- Select and request approval for a candidate library/model; review license, download size, browser capabilities, worker support and memory behavior.
- Test representative garments on actual target mobile/desktop browsers where available; record tested devices and limitations.
- Validate preview, damaged cutout, timeout, cancel/reselect and explicit original-photo fallback.
- **Acceptance:** record measured processing/download behavior and sample quality; agree on an acceptable mobile experience. A failed result produces reviewed alternatives, never a silent hosted-provider switch. Do not claim unsupported devices were tested.

### SPIKE-02 — Validate Clerk and private Supabase access

- Prepare an approved sandbox setup plan; use only isolated test accounts/assets. No service provisioning without explicit authorization.
- Prove verified Clerk identity can access only its own Postgres rows and private media through the proposed server boundary.
- Verify anonymous denial, user A versus user B, expired session and private-image cache behavior.
- **Acceptance:** automated or reproducible checks demonstrate owner isolation. Record actual setup and access requirements, without secrets. This is the gate for personal-data features.

## 4. M1 — Foundation

### BUILD-01 — Scaffold and quality tooling

- Set up approved Next.js/TypeScript/Tailwind/npm structure, Vitest, React Testing Library and Playwright with compatible versions.
- Record actual install/dev/check/test/build commands, required environment variable names and isolated test setup.
- Configure CI to run relevant checks on branches/PRs; do not configure auto-production deployment without approval.
- **Acceptance:** meaningful smoke tests and documented local checks run; CI is reproducible; lockfile is consistent; no secrets or production test targets.

### BUILD-02 — Tokens and shared app shell

- Implement warm stone/charcoal tokens, fonts, Lucide icons, shadcn/ui controls, dialog/editor foundations and route layouts.
- Desktop/tablet account shell uses top navigation; mobile account shell uses bottom links. Public/visitor shell follows the approved flow decision.
- **Acceptance:** responsive shell, keyboard focus and reduced motion reviewed; no pure-white UI defaults or theme toggle; controls match `design.md`. Keep authentication-dependent destinations honest while backend features are incomplete.

## 5. M2 — Visitor wardrobe and suggestions

### VISITOR-01 — Quick-add catalog

- Model the eight launch types and their named color variants/default tags. Source appropriately licensed realistic photos and record provenance.
- Let visitors select only clothes they own, inspect/edit tags and remove selections. No prefilling or uploads.
- **Acceptance:** group/type relationships are valid; sample photos are identified; color names are accessible; unselected garments are never added. Catalog ownership does not change when a user selects an item.

### VISITOR-02 — Local wardrobe persistence

- Add stable selection IDs, versioned browser storage and shared React state.
- Recover after reload; handle blocked/corrupt storage gracefully with in-memory use and an explanatory notice.
- **Acceptance:** selections survive the intended lifecycle; no personal photos/session tokens are stored; visitors cannot perform account-only operations. Test reset and schema migration behavior.

### ENGINE-01 — Deterministic matching and reasons

- Implement eligibility, top/bottom/shoe completeness, approved optional-jacket policy, compatibility and freshness inputs in pure TypeScript.
- Inject time and keep decorative canvas tint independent of matching.
- **Acceptance:** unit tests cover expected matches, rejected combinations, missing groups, Any filters, deterministic ties and realistic candidate bounds. Reasons describe actual rules; ranking scores stay internal.

### OUTFITS-01 — Visitor result journey

- Wire season/formality filters, up to six results and distinct Show more pagination to the shared engine.
- Implement neutral composition cards, missing-category guidance, no-compatible-results recovery and account-benefit messaging.
- **Acceptance:** complete browser journey from catalog selection to suggestions; fewer than six matches remain honest; filters are not silently changed; no functioning favorite/wear controls for visitors. Mobile, keyboard and empty states work.

**Milestone gate:** a new visitor can select sufficient owned basics, refresh the page and obtain understandable compatible suggestions without authentication.

## 6. M3 — Accounts and private wardrobe

### ACCOUNT-01 — Auth lifecycle and private data schema

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

**Milestone gate:** visitor selections carry into a private account exactly once and remain manageable after reload/sign-in.

## 7. M4 — Personal photo flow

### PHOTO-01 — One-garment upload and review

- Integrate the validated browser processor, orientation/metadata handling, preview and editable tags with group/type classification.
- Keep explicit Retry, Use original and Choose another photo recovery. Save succeeds before Add another resets the form.
- **Acceptance:** tests cover validation, removal failure, poor cutout fallback, timeout, cancel/reselect and stale completion. The mobile keyboard/footer and processing state remain usable.

### PHOTO-02 — Private persistence, replacement and cleanup

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

Review this milestone order. Document reconciliation has been performed locally; review its diff and run link/consistency checks before marking PLAN-01 complete. Settle genuinely blocking M0 questions. Use the existing vinay-krishna9/closet-theory repository and linked MVP board; do not recreate the 21 existing issues. No scaffold or feature implementation should begin merely because this file exists.
