# PHOTO-01/02 — Real private photo flow (#14/#15)

Linked implementation approved on 24 November 2026, after #31 merged through PR #35 (`d08dcea`). #14 starts on `feat/14-photo-review` from main. #15 will start on `feat/15-private-photos` from the checked #14 branch; its initial PR target is #14 until that prerequisite merges. Keep checked local commits at the boundaries below. Push/main merge and production deployment require separate authorization.

## Scope and checkpoints

1. #14: validate JPEG/PNG/WebP content, 10 MiB/25 MP limits before decode, correct orientation and re-encode to remove metadata. Add a lazy dedicated-worker processor using the approved `onnxruntime-web` 1.31.1 and checksum-pinned U2Netp artifact from the existing spike. Self-host version-matched runtime/model assets and preserve notices. Keep explicit Retry/Use original/Choose another, cancellation, 30-second timeout and stale-result guards. Use only sanitized local previews; do not claim automatic cutout quality.
2. #14: real account-only upload/review editor, Group → Type classification, editable detected named color and required formality/season confirmation. One garment per save, preserve draft on failure, unsaved-close protection and Add another after confirmed saving. Connect through a typed save callback; do not pretend unpersisted work is saved. Desktop drawer/mobile full-screen and existing semantic controls/tokens.
3. #15: owner-scoped private image validation/persistence/read delivery, replacement preserving item identity, and retryable abandoned/replaced/removed-media cleanup. Declare the already installed Sharp 0.35.5 directly for independent server decode/validation/metadata removal. Prepare versioned item-media/operation schema and private Storage policies, retaining RLS with Clerk verified subjects. Save only activates complete assets; keep prior media until replacement commits. Private image reads reauthorize and use no-store delivery; do not persist signed URLs or private images in visitor storage. Schema/retention details must follow current product rules.
4. Verify meaningful unit/component, isolated database and desktop/mobile browser journeys with public/sample assets. Include invalid files, metadata/orientation, real inference, poor cutout original fallback, timeout, valid-to-valid replacement, cancellation, save retries, duplicate submissions, owner/path/token denial and sign-out/back-navigation caching. Update #4 with actual media evidence. Physical Android/iPhone inference and full assistive-technology checks remain distinct manual evidence; narrow desktop viewports are not proof of mobile feasibility.

## Dependencies and approval boundary

The user explicitly approved ONNX Runtime/U2Netp, declaring the existing Sharp version directly, local implementation and checkpoint commits. The prior small-model spike measured a 4,574,861-byte model and about 14.8 MB WASM binary plus JS; real first-network transfer, physical-phone memory/performance and difficult-garment quality are still unverified. Preserve original fallback and validate on phones before production reliance. No external inference provider or personal-photo transfer is introduced by browser processing.

The model is U2Netp with SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`, previously reviewed in SPIKE-01. Download/build tooling verifies it. Keep the spike separate, reuse inspected algorithms rather than merging prototype history.

No new hosted migration, bucket/policy change or media fixture scope is authorized yet. Prepare exact SQL/effects and a reviewable implementation before requesting that authorization. The user prefers manual dashboard instructions. Do not run new automated media fixtures against the hosted project before the named scope is approved. No production service, paid plan or deployment is included.

Sources: [ONNX Runtime deployment](https://onnxruntime.ai/docs/tutorials/web/deploy.html), [U2Net upstream/license](https://github.com/xuebinqin/U-2-Net), and the preserved SPIKE-01 record on `spike/01-browser-background-removal`.

## Processor checkpoint — 24 November

Approved dependencies installed; npm reported seven moderate advisories (no forced audit fix). Added pre-decode signature/dimension/animation checks, metadata-free browser re-encoding, and a cancellable dedicated WASM worker. Model checksum and version-matched binary preparation succeeded; tracked upstream notices accompany generated assets. Seven focused real-image-header and processing lifecycle tests passed, including malformed/oversize/pixel limits, timeout and late results. Relevant lint/type checks passed. Actual Next worker bundling, browser inference, editor and persistence verification remain outstanding; physical-phone claims are not established by these checks.

## Review editor checkpoint — 24 November

Added the account photo review editor and cancellable selection state. It retains tags and a last usable sanitized original through failures, ignores out-of-order decode/inference, releases object URLs, supports before/after comparison and explicit original choice, requires Group/Type plus formality/seasons, and offers named-color detection without recoloring the photo. The existing unsaved-close dialog protects drafts. A typed persistence callback must resolve before success/Add another appears. Similarity choices retain item identity for replacement or explicitly add a different garment.

Five additional focused tests passed for stale decode/inference/fallback, invalid replacement, retry/reset/unmount cleanup, transparent-pixel color handling and failed-save draft retention/idempotency. The editor is not exposed in navigation until #15 wires real persistence. Lint/types passed; shared full checks run before the checkpoint. Production browser and real inference/media verification remain outstanding, with new hosted setup still unauthorized.
