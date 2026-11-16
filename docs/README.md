# Documentation index

## Current delivery status

BUILD-01/02 provide the shared foundation and VISITOR-01 adds the real quick-add catalog and editable visitor wardrobe. These changes merged into main through PR #24 on 15 November 2026 after CI passed. [BUILD-02](BUILD-02.md) and [VISITOR-01](VISITOR-01.md) own their results and limitations. VISITOR-03 is implemented and verified locally on branch `visitor/03-loading-spinner`. Reload persistence, recommendations and accounts remain later milestones.

## Where information belongs

The [VISITOR-01 completion record](VISITOR-01.md) owns delivered behavior and checks. [Catalog assets](catalog-assets.md) owns studio provenance, earlier photographic terms and recoloring. Reload persistence belongs to VISITOR-02.

The [VISITOR-03 execution plan and results](VISITOR-03-plan.md), tracked in [issue #23](https://github.com/vinay-krishna9/closet-theory/issues/23), records the shared single-garment carousel and stable editor actions during color-preview loading. The larger shirt, dress and sneaker appear one at a time. Local checks passed; remote CI is pending.

| Document                                  | Purpose                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Root README](../README.md)               | Installation, commands, repository map and tooling limitations                                                               |
| [Repository instructions](../AGENTS.md)   | Approval workflow, coding conventions and definition of done                                                                 |
| [MVP requirements](MVP.md)                | Release scope and product boundaries                                                                                         |
| [User flows](user-flows.md)               | Visitor and account journeys, recovery and navigation                                                                        |
| [Product decisions](product-decisions.md) | Settled edge cases; supersedes older provisional product wording                                                             |
| [Design system](../design.md)             | Visual and interaction authority; sections 17–19 contain the approved charcoal, typography and pictorial-selection revisions |
| [Architecture](architecture.md)           | Technical boundaries, persistence, authentication and privacy design                                                         |
| [Development plan](development-plan.md)   | Task sequence, dependencies and acceptance criteria                                                                          |
| [BUILD-01 record](BUILD-01.md)            | Foundation implementation, verification and limitations                                                                      |
| [BUILD-02 record](BUILD-02.md)            | Design approval, completed shared foundation, assets, checks and limitations                                                 |

Keep setup instructions in the root README, settled rules in their source documents, and actual check results in the relevant build record. Historical verification describes what ran at that stage, not the state of every later revision. Completed execution plans can be removed once their behavior and evidence are recorded, with a historical Git link retained in the completion record.

## Design references and cleanup

The approved browser references are `/design-review/wardrobe`, `/design-review/quick-add` and `/design-review/outfits`. Their sample data and illustrative assets are review-only. They do not establish a real visitor wardrobe or implemented recommendations.

The unreferenced `docs/design_system.png` warm-palette reference was removed during the 13 November 2026 cleanup because it conflicts with the approved charcoal direction. `design.md` and the approved browser mockups remain authoritative. Source, required assets and font licenses, local screenshot evidence, dependencies and retained prototype files were preserved.

The 15 November 2026 cleanup removes the completed VISITOR-01 plan from the active docs; its approved version remains linked from the completion record. Two byte-identical jeans/sneaker review images were removed, and the comparison page now references the canonical studio sources. The distinct T-shirt review sample, review screenshots, generation prompts, completion records and asset credits remain available.

Background-removal prototype links and feasibility limitations are recorded in the [development plan](development-plan.md) and root README; that prototype is separate from the app. Live auth, storage and private-data features remain subject to their respective feasibility and approval gates.
