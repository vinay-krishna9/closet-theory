# [SPIKE-03] Evaluate dressing a mannequin in suggested wardrobe items

GitHub creation attempted on 12 November 2026; connector denied it with HTTP 403 (Resource not accessible by integration). This is a ready-to-submit issue draft, not an existing GitHub issue.

## User need / outcome

Show whether a mannequin can convincingly wear the actual garments selected by the deterministic outfit engine, rather than swapping prepared images of already-dressed figures.

## Scope

A separate feasibility spike, not an approved MVP feature. Compare a front-facing cutout overlay baseline against image-based virtual try-on and 3D approaches at a research level. Build a small isolated overlay experiment first only after a concrete plan is approved. Do not change the existing outfit display or matching rules as part of this issue.

## Acceptance criteria

- [ ] Use owned or appropriately licensed sample garment photos and a neutral mannequin; no private wardrobe photos or unapproved external processing.
- [ ] Test tops, bottoms, shoes and optional jackets, including sleeve/arm alignment, layering/occlusion, patterns, colors and different photo framing.
- [ ] Record whether the actual garment identity, details and silhouette are preserved; distinguish an approximate collage from believable dressing and from fit prediction.
- [ ] Record desktop/mobile behavior, latency, memory and any download, licensing, processing-cost or privacy tradeoffs. Mark untested devices explicitly.
- [ ] Preserve deterministic outfit selection; rendering is a separate concern. No paid service, hosted image transfer, provisioning or new dependency without approval.
- [ ] Present evidence and a recommendation: feasible now, limited preview only, or defer. Any MVP scope/design change requires a separate decision.

## Verification

Reproducible examples of a mannequin wearing suggested combinations, comparison with source garments, success/failure screenshots using public/licensed samples, and documented limitations.

## Dependencies

- #3 — background-removal findings (including outstanding mobile checks)
- #9 — deterministic outfit engine contract before live integration

Follow AGENTS.md: plan and approval before implementation. No implicit commit, push, merge, deployment or spending permission.
