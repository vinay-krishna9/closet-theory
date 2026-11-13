# Documentation index

## Current delivery status

As of 13 November 2026, BUILD-01 and BUILD-02 are complete locally. The user approved the designs, visual review and shared foundation implementation. Shared tokens, fonts, Radix/shadcn controls, responsive editor foundations and the visitor shell are implemented and checked. [BUILD-02](BUILD-02.md) owns the completion checklist and verification evidence. Real catalog behavior, persistence, recommendations and accounts remain later milestones.

## Where information belongs

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

Keep setup instructions in the root README, settled rules in their source documents, and actual check results in the relevant build record. Existing canonical paths are retained so repository instructions and issue links remain valid. Historical verification describes what ran at that stage, not the state of every later revision.

## Design references and cleanup

The approved browser references are `/design-review/wardrobe`, `/design-review/quick-add` and `/design-review/outfits`. Their sample data and illustrative assets are review-only. They do not establish a real visitor wardrobe or implemented recommendations.

The unreferenced `docs/design_system.png` warm-palette reference was removed during the 13 November 2026 cleanup because it conflicts with the approved charcoal direction. `design.md` and the approved browser mockups remain authoritative. Source, required assets and font licenses, local screenshot evidence, dependencies and retained prototype files were preserved.

Background-removal prototype links and feasibility limitations are recorded in the [development plan](development-plan.md) and root README; that prototype is separate from the app. Live auth, storage and private-data features remain subject to their respective feasibility and approval gates.
