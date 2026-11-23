# Documentation index

## Folder guide

| Folder       | Contents                                                             |
| ------------ | -------------------------------------------------------------------- |
| `product/`   | MVP scope, user journeys and agreed product decisions                |
| `technical/` | Architecture and implementation boundaries                           |
| `plans/`     | Delivery sequence, feature execution plans and their results         |
| `records/`   | Delivered feature records, completed plans and verification evidence |
| `assets/`    | Catalog provenance, preparation and photographic credits             |
| `reviews/`   | Visual review pages, screenshots and generation prompts              |

## Current delivery status

BUILD-01/02 provide the shared foundation and VISITOR-01 adds the real quick-add catalog and editable visitor wardrobe. These changes merged into main through PR #24 on 15 November 2026 after CI passed. [BUILD-02](records/BUILD-02.md) and [VISITOR-01](records/VISITOR-01.md) own their results and limitations. VISITOR-03 merged through PR #25 after CI passed. VISITOR-02 browser persistence is implemented locally on `visitor/02-local-persistence`; its [execution record](records/VISITOR-02-plan.md) owns the behavior, checks and limitations. ENGINE-01 is implemented locally with its [engine contract and verification](plans/ENGINE-01-plan.md). OUTFITS-01 is implemented locally with [three visitor suggestions, recovery and browser verification](plans/OUTFITS-01-plan.md). ACCOUNT-01 adds real Clerk sign-in and private profile persistence; import/synced wardrobe follow separately.

## Where information belongs

[Account development setup](technical/account-development.md) records the real app's configuration, versioned migration, approved development setup and browser/security verification evidence. Its #11 foundation is verified; wardrobe import/sync and account outfit paging follow separately.

The [VISITOR-01 completion record](records/VISITOR-01.md) owns delivered behavior and checks. [Catalog assets](assets/catalog-assets.md) owns studio provenance, earlier photographic terms and recoloring. Browser persistence and recovery are recorded in [VISITOR-02](records/VISITOR-02-plan.md).

The [VISITOR-03 execution plan and results](records/VISITOR-03-plan.md), tracked in completed [issue #23](https://github.com/vinay-krishna9/closet-theory/issues/23), records the shared single-garment carousel and stable editor actions during color-preview loading. The larger shirt, dress and sneaker appear one at a time. Local checks and remote CI passed before merge.

| Document                                                  | Purpose                                                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Root README](../README.md)                               | Installation, commands, repository map and tooling limitations                                                               |
| [Repository instructions](../AGENTS.md)                   | Approval workflow, coding conventions and definition of done                                                                 |
| [MVP requirements](product/MVP.md)                        | Release scope and product boundaries                                                                                         |
| [User flows](product/user-flows.md)                       | Visitor and account journeys, recovery and navigation                                                                        |
| [Product decisions](product/product-decisions.md)         | Settled edge cases; supersedes older provisional product wording                                                             |
| [Design system](../design.md)                             | Visual and interaction authority; sections 17–19 contain the approved charcoal, typography and pictorial-selection revisions |
| [Architecture](technical/architecture.md)                 | Technical boundaries, persistence, authentication and privacy design                                                         |
| [Development plan](plans/development-plan.md)             | Task sequence, dependencies and acceptance criteria                                                                          |
| [Real account journey](plans/ACCOUNT-journey-plan.md)     | Approved main-app auth, import, synced wardrobe and account suggestions plan                                                 |
| [ENGINE-01 execution plan](plans/ENGINE-01-plan.md)       | Issue #9 matching rules, proposed technical defaults, implementation steps and verification                                  |
| [OUTFITS-01 execution plan](plans/OUTFITS-01-plan.md)     | Issue #10 visitor filters, up to three compositions, account prompt, recovery and browser acceptance steps                   |
| [BUILD-01 record](records/BUILD-01.md)                    | Foundation implementation, verification and limitations                                                                      |
| [BUILD-02 record](records/BUILD-02.md)                    | Design approval, completed shared foundation, assets, checks and limitations                                                 |
| [VISITOR-01 record](records/VISITOR-01.md)                | Quick-add catalog, wardrobe editing and verification                                                                         |
| [VISITOR-02 execution record](records/VISITOR-02-plan.md) | Browser persistence, storage recovery and verification                                                                       |
| [VISITOR-03 execution record](records/VISITOR-03-plan.md) | Stable editor actions, garment spinner and verification                                                                      |
| [Catalog assets](assets/catalog-assets.md)                | Studio imagery provenance, preparation and retained photographic credits                                                     |

Keep setup instructions in the root README, settled rules in their source documents, and actual check results in the relevant build record. Historical verification describes what ran at that stage, not the state of every later revision. Completed execution plans can be removed once their behavior and evidence are recorded, with a historical Git link retained in the completion record.

## Design references and cleanup

The approved browser references are `/design-review/wardrobe`, `/design-review/quick-add` and `/design-review/outfits`. Their sample data and illustrative assets are review-only. They do not establish a real visitor wardrobe or implemented recommendations.

The unreferenced `docs/design_system.png` warm-palette reference was removed during the 13 November 2026 cleanup because it conflicts with the approved charcoal direction. `design.md` and the approved browser mockups remain authoritative. Source, required assets and font licenses, local screenshot evidence, dependencies and retained prototype files were preserved.

The 15 November 2026 cleanup removes the completed VISITOR-01 plan from the active docs; its approved version remains linked from the completion record. Two byte-identical jeans/sneaker review images were removed, and the comparison page now references the canonical studio sources. The distinct T-shirt review sample, review screenshots, generation prompts, completion records and asset credits remain available.

Background-removal prototype links and feasibility limitations are recorded in the [development plan](plans/development-plan.md) and root README; that prototype is separate from the app. Live auth, storage and private-data features remain subject to their respective feasibility and approval gates.

[ACCOUNT-02 automatic import](plans/ACCOUNT-02-plan.md) records the approved #12 plan, implementation checkpoints, applied development migration, six passing hosted journeys and manual browser checks.
