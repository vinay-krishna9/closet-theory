# SPIKE-01 — Browser background removal

Status: user signed off the prototype on 10 November 2026 and intends to move SPIKE-01 to Completed on GitHub. Automated measurements were taken 9 November 2026; manual results were recorded 10 November 2026. This is a prototype sign-off with the unverified checks and quality limitations below, not confirmation that every test passed or that mobile feasibility is established.

## Approach

Standalone HTML/JavaScript harness at `spikes/background-removal/`, using ONNX Runtime Web 1.31.1 and U2Netp through single-thread WASM in a dedicated module worker. No inference server, accounts or photo persistence. Local Node serves runtime/model assets. The model is loaded on the first photo, not page load. A successful session is reused for Retry. Terminating a worker cancels inference and prevents late results from changing selection.

U2Netp is a small baseline for mobile feasibility, not an approved final quality choice. Its upstream project uses Apache-2.0; ONNX Runtime uses MIT. IMG.LY's ready-made integration uses AGPL and BRIA RMBG-1.4 has noncommercial/commercial-agreement terms, so neither was installed. Source/license links and checksum verification are recorded in the prototype README.

## Actual evidence

Windows desktop, Playwright Chromium **158.0.8127.18**, headless, 20 reported logical processors, browser-reported device-memory hint 16 GB. These browser hints do not identify the CPU or establish actual available/peak RAM.

| Run | Initialization | Inference | End-to-end worker request/result |
| --- | ---: | ---: | ---: |
| Synthetic shirt, first session | 267.6 ms | 1,233.5 ms | 1,536.5 ms |
| Synthetic shirt, same-session Retry | 0 ms | 1,135.6 ms | 1,154.9 ms |
| Real licensed garment, first session | 271 ms | 1,162.5 ms | 1,507 ms |

End-to-end starts after file decode/sanitization, before worker creation/message; it excludes file selection and preprocessing. First sessions fetched assets from loopback with `no-store`; they are not internet cold-download benchmarks. Retry reuses an initialized session. Browser/OS-level caching can still affect runtime compilation. Results are individual runs, not statistically stable benchmarks.

Model: **4,574,861 bytes**. Installed baseline WASM binary: **14,848,852 bytes**, plus runtime JavaScript/glue. Model size alone therefore understates the first-run transfer. Slow network/mobile download times and exact total wire transfer remain unmeasured. No persistent model cache is implemented. Worker heap measurement was unavailable; peak memory, browser process memory and GPU memory were not measured. No WebGPU path was tested.

### Quality and visual review

The synthetic shirt produces a nonempty mask containing both opaque and transparent regions; this checks the pipeline, not garment accuracy.

The CC0 EdaBojci photo renders at 1200 × 1600 after sanitization. Visual review at desktop 1280px and narrow 390px found readable wrapping, contained previews and no horizontal overflow. The result isolates the dark short-sleeve T-shirt but removes the pale long sleeves beneath it and softens portions of the right edge. This layered/cluttered case is ambiguous as a single garment and **does not establish acceptable garment preservation**. Explicit original fallback is necessary. More isolated long-sleeve and difficult-color/pattern examples are needed before recommending this model.

The prototype deliberately says Cutout ready for review rather than claiming image quality. A user can choose the original after a technically successful but damaged result.

### Verification performed

- `npm.cmd install`: succeeded, audit reported zero vulnerabilities at installation.
- `npm.cmd run download-model`: succeeded with upstream checksum verification.
- `npm.cmd test`: **4 passed**, including real WASM inference, warm retry, real-photo preview and controlled failure/recovery paths.
- `node --check` for app, worker, server and download script: passed.
- Desktop and 390px screenshot review performed. No manual screen-reader, full keyboard traversal, automated accessibility audit or real touch-device review has been completed.

Recovery checks cover cancel, stale messages, replacement with invalid input, missing model, malformed/oversize input, timeout and explicit original selection with notes preserved. Worker failure and timeout are injected in recovery tests; they are separate from actual inference measurements. The suite does not yet validate rapid valid-to-valid replacement during real inference or EXIF orientation/metadata stripping with dedicated fixtures.

## User-reported manual testing — recorded 10 November 2026

These results were reported by the user, not independently reproduced by the agent. Device, operating system, browser/version and timing measurement field have not been supplied. First-run times below mean the user's reported first attempt, not a verified cold network/model download. Image-to-filename mapping and source/license details for newly added local photos remain unconfirmed.

| Photo/case | First attempt | Retry | User-reported quality |
| --- | ---: | ---: | --- |
| Plain solid T-shirt, contrasting background | 1.4 s | 1.2 s | Looks good |
| Isolated plain long-sleeve shirt | 1.5 s | 1.1 s | Looks good |
| Same-color trousers and jacket on hangers, together | 1.4 s | 1.1 s | Looks good; multi-garment case, not the intended one-garment flow |
| Blue/white shoes with white laces | 1.4 s | 1.0 s | Looks good |
| Green leaves and white flower pattern | 1.4 s | 1.2 s | Looks good |
| White shirt on white background | 1.4 s | 1.1 s | Looks good |
| Black shirt on black background | 1.5 s | 1.1 s | Looks good |
| Red hoodie on a table with bottles and cup, version 1 | Not reported | Not reported | Background mostly removed, but bottles touching hoodie retained |
| Red hoodie with clutter, version 2 | Not reported | Not reported | Hoodie itself removed; quality failure |

The seven simpler cases support further evaluation of the small model. The cluttered cases show that technically completed inference can retain unwanted objects or remove the target garment. Preview and explicit original fallback remain necessary. These observations do not establish an automatic quality detector or approve new photo restrictions.

### Manual checklist results

Numbers refer to the detailed testing instructions supplied in the conversation. A group reported as working does not establish that every optional subcase or assistive technology was exercised.

| Test group | Status | Evidence/qualification |
| --- | --- | --- |
| 3 — Normal processing and garment quality | Reported results above | Simple cases look good; two clutter failures; separate trousers/jacket cases still needed |
| 4 — Original-photo fallback | Pending explicit manual confirmation | Previously covered by automation; no separate user result for this group |
| 5 — Cancellation | User reports works as expected | Exact loading/inference phases not specified |
| 6 — Rapid photo replacement | User reports works as expected | Exact photos/repetition count not specified; automated suite still only covers invalid replacement |
| 7 — File validation | Pending manual testing | User asked where to obtain invalid/oversized files; instructions supplied, no completion reported |
| 8 — Model/network failure recovery | User reports works | Exact blocking/recovery steps not separately recorded |
| 9 — 30-second timeout and recovery | User reports works | No precise timeout measurement supplied |
| 10 — Accessibility and layout | User reports works | Exact viewport, zoom, keyboard and screen-reader coverage unspecified; no accessibility conformance claim |
| 11 — Physical Android | Not tested | User could not access prototype on phone; local forwarding/secure access still to arrange |
| 12 — Physical iPhone | Not tested | Same access limitation as Android |

The user added test photos to the local fixtures folder. On 10 November 2026, the nine manually added photos were moved to `spikes/background-removal/local-test-images/`, whose entire contents are ignored by Git. The documented public `fixtures/t-shirt.jpg` remains available for automated tests. This report does not establish that the manual photos are public or licensed for redistribution. Confirm provenance before promoting any to shared fixtures; do not force-add private images or copy them into automated screenshots.

## Completion record and follow-up checks

- [x] Standalone prototype and reproducible automated browser checks implemented; four automated tests passed in the recorded run.
- [x] Representative manual garment checks completed and results recorded, including clutter-related quality failures.
- [x] Cancellation and rapid replacement reported working by the user.
- [x] Model/network failure recovery and timeout reported working by the user.
- [x] Accessibility/layout group reported working by the user, with exact coverage unconfirmed.
- [x] User requested prototype sign-off and will manage GitHub completion separately.
- [ ] Manual original-fallback result not separately reported (automated fallback test passed).
- [ ] Manual file-validation cases not reported complete (automated malformed/oversize checks passed).
- [ ] Physical Android and iPhone testing not performed; last reported blocked by access to the local prototype.
- [ ] Device/browser details, timing method, peak memory, slow-network transfer and repeated-use stability remain unverified.
- [ ] Dedicated orientation/metadata fixtures and full accessibility coverage remain unverified.

Unchecked entries are follow-up verification, not passing tests. The original SPIKE-01 mobile acceptance criterion remains unsupported by evidence even if the issue is administratively closed. Carry these limitations into the upload feature and release checks; no product rule or mobile gate has been removed by this record.

Keep the implementation as a reproducible prototype. Capture the manual tester's device/OS/browser and timing method. Run physical Android/iOS checks once local forwarding or suitable secure access is available; public hosting is not required for Android USB forwarding. Confirm original fallback manually, finish file-validation cases, and test isolated trousers/jacket and further clutter examples. Verify EXIF orientation/metadata handling with dedicated fixtures, repeated-use stability, peak memory and first-network-load behavior where tools allow it. Clarify the extent of keyboard/zoom/screen-reader checks rather than treating a grouped pass as full coverage. Agree tolerable waiting time and quality based on the evidence. Instructions are in the prototype README.

If small-model quality is insufficient, propose a larger permissively licensed ISNet/BiRefNet model comparison with explicit download/memory tradeoffs before adding it. Do not silently move inference to a hosted provider. Full production validation/storage, structured item tags, Next.js integration and media cleanup remain future upload-feature work.
