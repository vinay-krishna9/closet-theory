# Personal Stylist — MVP Architecture

Status: planning specification for review · 7 November 2026

This document records agreed architecture decisions and proposes implementation details. It does not authorize scaffolding, provisioning, migrations against live services or deployment. Any product behavior explicitly marked unresolved needs a decision before its implementation.

## 1. Document ownership and placement

Place this file at `docs/architecture.md` in the application repository.

Recommended documentation layout:

```text
AGENTS.md
design.md
docs/
  MVP.md
  user-flows.md
  architecture.md
  development-plan.md   # create after milestones are agreed
```

`MVP.md` defines release scope; `user-flows.md` defines journeys; `design.md` defines visual and interaction rules; `AGENTS.md` defines the development workflow. Update references when moving documents. If an older document conflicts with a later agreed product decision, identify and reconcile the conflict rather than silently implementing the older behavior.

## 2. Confirmed direction

| Area | Decision |
| --- | --- |
| Application | Next.js App Router, TypeScript, Tailwind |
| Shared controls | shadcn/ui, styled to `design.md`; Lucide outline icons |
| Authentication | Clerk; Google and email/password |
| Database | Supabase Postgres |
| Photos | Private Supabase Storage |
| Hosting | Vercel; eligible free plan initially, subject to actual plan terms and limits |
| Image processing | Attempt background removal in the browser; validate feasibility early on mobile |
| Outfit engine | Deterministic rules, separate from UI, persistence and image processing |
| Visitor state | React shared context/reducer plus browser persistence; Redux deferred |
| Package manager | npm |
| Tests | Vitest, React Testing Library and Playwright; verify installed-version compatibility |

Use local/isolated development and test data. Production is a separate environment. No test runner may target production. Exact hosted staging requirements remain a setup decision; a separate paid project is not implicitly approved.

## 3. Runtime boundaries

```text
Browser
  ├─ Public pages and quick-add catalog
  ├─ Visitor selections in local browser storage
  ├─ Deterministic visitor outfit generation
  ├─ Image preview and background-removal worker
  └─ Clerk sign-in/session UI
       │ authenticated requests
       ▼
Next.js server
  ├─ Verify Clerk identity and validate inputs
  ├─ Execute wardrobe, preference, import and wear operations
  ├─ Issue narrowly scoped media upload/read authorization
  └─ Use the shared outfit engine for account suggestions
       │ owner-scoped access
       ▼
Supabase
  ├─ Postgres with owner-based row-level security
  └─ Private media storage with owner-based access policies
```

Clerk is the authentication authority; do not introduce a second Supabase Auth login. Supabase supports Clerk tokens for data/storage authorization. Configure and test the integration before feature development. Store the Clerk subject as a text owner identifier, not an assumed Supabase Auth UUID.

Proposed default: personal data operations go through server actions/routes using the verified user's Clerk token, preserving database row-level security. Validate authorization inside each operation, not only in navigation or route middleware. Direct browser-to-storage transfer is allowed only with narrowly scoped authorization; no unrestricted storage credentials reach the browser.

Use elevated server credentials only for narrowly defined maintenance/cleanup operations that require them. They bypass normal row-level protection, so they are not the default application data-access path.

## 4. Visitor and account state

### Visitor

- No separate demo account, prefilled wardrobe or personal-photo upload.
- Visitors select catalog garments and named color variants they actually own, then request suggestions.
- Persist only catalog references, selection IDs, editable tags and schema version in browser storage. Do not persist personal photos or application-managed authentication tokens there.
- Each selection receives a stable local ID. Catalog imagery is referenced, not copied into browser storage.
- Load storage on the client after hydration. Handle invalid/outdated records and unavailable storage gracefully; in-memory use should still work with an explanatory notice.
- Visitors cannot save outfit preferences or wear events. Do not fabricate personal statistics.

### Account

- Supabase is the source of truth for the personal wardrobe, preferences and wear history; avoid maintaining an independent long-lived copy in a global UI store.
- Verify session state on the server. Do not trust a user ID submitted in a request as authorization.
- Use public catalog data for shared sample imagery. A personal item still has its own identity, independent of the catalog template.
- Sign-out clears account-specific client caches and pending sensitive UI state and starts a fresh visitor wardrobe. Do not restore a previous account's data on back navigation.

## 5. Proposed logical data model

This is a logical model, not migration-ready SQL. Exact column types, indexes and constraints are finalized in the approved database setup plan.

| Table | Purpose and important fields |
| --- | --- |
| `catalog_types` | Group, type, labels and editable default tags; e.g. Bottoms → Jeans |
| `catalog_variants` | Type reference, named color, color value, sample asset reference and licensing/source metadata |
| `wardrobe_items` | ID, owner subject, optional catalog variant, display name, group/type, color, formality, seasons, image source and active/removed state |
| `item_media` | Owner/item reference, private original/cutout/thumbnail paths, processing and cleanup state; never permanent public URLs |
| `outfits` | ID, owner subject, stable combination hash and timestamps |
| `outfit_items` | Outfit/item references and slot; ownership must agree across the relationship |
| `outfit_preferences` | Owner/outfit reference and favorite/neutral/disliked value; no separate favorite flag |
| `wear_events` | ID, owner, optional outfit reference, worn timestamp/local-date context, idempotency key and Undo state |
| `wear_event_items` | Wear event/item references and minimal historical labels/type/color/catalog fallback information |
| `visitor_imports` | Owner, import key, payload fingerprint, completion state and imported-item mapping |

No duplicate authentication database is needed. Add an app profile/settings table only if a concrete app-specific setting requires it.

### Relationships and invariants

- Every personal row belongs to one Clerk subject. Relationship writes must enforce matching ownership, not merely check that IDs exist.
- Catalog records are public-readable; normal users cannot edit the shared catalog or promote personal photos into it.
- Account item IDs remain stable when replacing a sample photo with a personal photo or editing tags.
- An outfit identity derives from canonically sorted item IDs, scoped to its owner. Enforce uniqueness on owner plus combination hash. Do not persist every possible generated combination unnecessarily; persist an outfit when feedback or wear history needs durable identity.
- A preference belongs to exactly one owner/outfit pair. Absence of a row means neutral. Setting favorite replaces disliked, and vice versa; clearing returns to neutral.
- Wear item membership is recorded at logging time. Historical labels can survive later item edits/removal. Do not store private photo snapshots in historical records.
- Avoid independently editable wear counters. Derive initial MVP counts from valid wear events and membership rows; introduce cached aggregates only with consistency rules if measurement justifies them.

## 6. Clothing taxonomy and recommendations

Launch types: Tops → solid T-shirt, shirt, sweater; Bottoms → jeans, chinos, shorts; Shoes → sneakers; Outerwear → simple jacket. Each complete outfit needs one top, one bottom and shoes. A jacket is optional. Catalog defaults and uploaded-item confirmations use the same vocabulary.

Use a pure TypeScript module that accepts normalized items, filters, preferences and wear history and returns ordered outfit candidates with rule-derived reasons. Inject the current date/time rather than reading it invisibly inside scoring functions.

1. Exclude removed/unavailable items and apply active season/formality eligibility.
2. Generate valid top/bottom/shoe combinations and optional outerwear under the agreed policy.
3. Calculate style compatibility and freshness using separately testable rules.
4. Group eligible favorites first, neutral next, and disliked last only when revealed.
5. Use deterministic ranking and a stable combination-identity tie-breaker within groups.
6. Return up to six initially and additional distinct results through Show more. Do not manufacture matches or silently relax filters.

Use the same engine for visitor and account flows; visitors have empty persistent preference/history inputs. Rankings and IDs remain internal. Garment-derived decorative canvas colors must not change matching scores.

Unresolved before implementation: scoring weights, compatibility thresholds, treatment of Any/multi-season tags, patterns, optional-jacket policy, diversity and maximum candidate count/performance strategy. Benchmark the proposed approach before adopting unbounded enumeration for large wardrobes. Recommendation pagination should be consistent against a defined wardrobe/filter snapshot.

## 7. Retry-safe visitor import

Signup and sign-in to an existing account automatically import selected visitor catalog clothes. Explain this before authentication; there is no extra choice dialog.

Proposed implementation:

1. Retain a versioned visitor payload and stable import/selection IDs through the auth redirect.
2. After authentication, send it to an authenticated server operation. Validate catalog variants and tags; derive ownership from the session.
3. Persist the import and corresponding wardrobe items transactionally, using uniqueness constraints to prevent retry duplicates.
4. Return the completed mapping; clear imported browser selections only after confirmed persistence.
5. If import fails after successful signup, keep the account and local payload, and offer retry. Do not repeat account creation.

Import idempotency is not the same as deduplicating all visually identical clothes: a user may own two similar shirts. Whether matching visitor selections should merge with existing account items needs an explicit rule before implementation. Do not silently remove intentionally distinct items.

## 8. Photo lifecycle

Browser processing: select one garment → validate/decode safely → correct orientation and sanitize metadata → attempt background removal → preview → confirm group/type, color, formality and seasons → save.

- Lazy-load processing code and use a worker when supported. Early feasibility work must test mobile speed, memory, image quality, model download size, license and unsupported-device fallback.
- Keep Retry, Use original and Choose another photo available. Users explicitly choose original fallback; processing failure must not erase tags or block that path.
- Revalidate persisted files server-side. Do not trust a client claim that a file is safe or metadata-free.
- Use private owner-scoped paths and alpha-capable output for cutouts. Store paths/asset IDs rather than expiring signed URLs in database records.
- Proposed persistence sequence: create a pending operation → authorize uploads → verify required assets → commit active item/media references. Database and object storage are not one transaction; track abandoned operations and retry cleanup.
- Keep the previous item image active until replacement succeeds. Remove obsolete files only after the new reference is committed.
- Avoid logging media contents, private paths with identifying context or signed URLs. Authorized media delivery and caching must be tested for cross-account leakage.

Image format/size limits and processing timeout in `design.md` remain implementation defaults to validate in the feasibility work. No external processing provider is approved; if browser processing proves unsuitable, present alternatives for a decision.

## 9. Removal, history and account deletion

Agreed item-removal behavior:

- Mark the personal item removed and exclude it from new suggestions, including favorited combinations that require it.
- Preserve existing wear history and stable historical item identity. Label the garment Removed from wardrobe where appropriate.
- Delete the personal original, cutout and derivatives. Use an existing matching catalog image for historical display, or a generic labelled placeholder if no suitable match exists.
- Never add personal items/photos to the shared catalog. History references a shared template without changing catalog ownership.
- Lifetime wear totals include valid historical events involving removed items. Current most/least/never-worn lists include only active wardrobe items.

Proposed removal sequence: authorize → mark removed and suppress personal-photo delivery → queue/retry object cleanup → retain only minimal historical records. Explain actual deletion/backup timing in privacy information. Short-lived URLs may remain usable until expiry; define appropriate lifetime and invalidation behavior rather than promising instantaneous revocation.

Replacing a personal photo with catalog imagery while keeping a garment active is a distinct action, not deletion. It is not automatically added to the MVP UI by this distinction.

Account deletion is different from item removal: historical personal records must not be retained merely because item wear history is preserved. Coordinate deletion of Clerk identity, app data and private media with retry-safe cleanup. Final retention/backup policy and verification of the deletion request must be specified before launch.

## 10. Wear logging, Undo and dates

- I wore this records today's wear immediately and offers Undo. Use an authenticated, idempotent server operation.
- Write the wear event and all constituent item memberships in one database transaction. Derive resulting stats consistently.
- Reject accidental repeat submissions using the same operation key; do not impose an unapproved rule that forbids multiple intentional wears in a day.
- Proposed Undo operation marks/reverses the same event atomically; all statistics exclude undone events. Retrying Undo must not subtract counts again.
- Pending failures show the actual saved state with a recovery action. Do not display a false successful log or Undo.

Proposed date rule, to confirm before implementing date-sensitive behavior: store timestamps in UTC plus the user's IANA timezone/local worn date; interpret today and freshness using one documented rule. Undo availability duration and whether individual-item wear logging is in the launch UI also need confirmation.

## 11. Security and environments

- Validate inputs and verify Clerk identity on every private server operation. Apply owner-aware row-level security and storage policies as defense in depth.
- Test anonymous access, cross-account reads/writes and relationship manipulation; hidden UI is not access control.
- Keep server credentials out of client bundles and source control. Maintain `.env.example` with variable names and placeholders only.
- Separate development/test/prod credentials and redirect URLs. Never seed tests with production users or photos.
- Use migrations in version control. Review changes and test locally before requesting permission to run anything destructive or against a live database.
- Apply reasonable request/upload limits and error logging without sensitive payloads. Define security/privacy operations needed for launch in the delivery backlog.
- Do not assume all public-looking provider keys are secrets, or that a public client key grants authorization; follow actual provider semantics and enforce policies.

## 12. Validation and delivery gates

Before building the full product, run focused feasibility work for browser image processing on mobile and Clerk-to-Supabase authorization, including private image access. A failed feasibility check requires a reviewed alternative, not a silent stack change.

Required coverage includes deterministic scoring and grouping; import retries; cross-account isolation; upload fallback/cancellation; storage cleanup; wear logging and Undo; removed-item historical display; sign-out cache clearing; mobile/desktop and keyboard behavior.

Use Vitest for pure rules/integration checks, React Testing Library for meaningful component interactions, and Playwright for critical journeys. Verify actual setup compatibility. Relevant type checks, lint, tests and builds must run; report blocked checks honestly.

## 13. Next planning work

1. Resolve the explicitly flagged product edge cases; finalize the logical model into schema constraints and authorization policies.
2. Review the local document reconciliation: Clerk, the real visitor catalog, expanded clothing types and removal/history behavior now supersede older proposals. Validate the diff before closing PLAN-01.
3. Create `docs/development-plan.md` with end-to-end milestones, dependencies, feasibility work and release gates.
4. Turn milestones into issues with behavior, scope, acceptance checks and dependencies. The repository is vinay-krishna9/closet-theory and the existing board is https://github.com/users/vinay-krishna9/projects/1; 21 issues have been created.

No paid services, repository commits or deployments are authorized by this document. Follow the user's approval workflow in `AGENTS.md` before implementation.
