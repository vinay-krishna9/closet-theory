# Browser background-removal spike

Standalone HTML/JavaScript and a dedicated worker. No Next.js app, account, uploads, persistence or external inference. This is a feasibility harness, not the production editor. Its simplified styling uses the project palette; production typography/components belong to BUILD-02.

Requires Node 22+ and npm. From this folder, in PowerShell:

```powershell
npm.cmd ci
npm.cmd run download-model
npx.cmd playwright install chromium
npm.cmd test
npm.cmd run dev
```

Open http://127.0.0.1:4173. On shells without the PowerShell script restriction, `npm` and `npx` work without `.cmd`. The server binds to loopback by default, accepts only reads of explicit prototype assets, and never receives photo bytes. No environment variables or service credentials are required. Optional `HOST` and `PORT` configure binding. Do not expose this experiment publicly.

Choose a JPEG, PNG or WebP. Processing starts automatically. Retry keeps a successful worker/session warm. Cancel, timeout, replacement and Use original invalidate pending work and terminate the worker. Notes remain unchanged. Preview only: there is no Save or wardrobe persistence. Original means a locally re-encoded, orientation-corrected PNG, bounded to a 1600px longest edge, not the untouched metadata-bearing source.

Files are checked by signatures, decoded and checked against 10 MiB/25 MP limits. This prototype checks pixel dimensions **after decoding**; it is not a hardened untrusted-upload service. Production still needs header-level dimension limits, server validation, orientation/metadata fixtures and media lifecycle integration. Only the selected file and current image buffers are held in memory; previews are revoked on replacement/page exit. Runtime memory reclamation is browser-controlled.

## Reproducible checks

`npm.cmd test` starts the local server and runs Chromium. It exercises real inference on a generated synthetic shirt and the licensed photo, warm retry, transparency, mobile/desktop overflow, cancel, late results, replacement with an invalid photo, 30-second timeout, missing model, oversized input, malformed input and tag-preserving original fallback. Recovery tests deliberately stub workers or block model loading; their timings are not model performance measurements.

Screenshots and JSON measurements are written to ignored `test-results/`. Tests generate their synthetic image; do not substitute private photos in automated runs. The real-photo test is skipped if its fixture is missing; check the test summary. No separate production build, TypeScript or lint scripts exist for this plain JavaScript spike. Use `node --check` for JavaScript syntax validation.

## Model and notices

- Runtime: `onnxruntime-web` 1.31.1, MIT, https://github.com/microsoft/onnxruntime/blob/main/LICENSE. Dependency notices remain in the installed package.
- Model: U²-Net small (`u2netp`), Apache-2.0 upstream: https://github.com/xuebinqin/U-2-Net and https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE.
- ONNX artifact: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx, distributed by rembg (MIT). Normalization follows its U2netp session: https://github.com/danielgatis/rembg/blob/main/rembg/sessions/u2netp.py and base session.
- Download script verifies upstream MD5 `8e83ca70e441ab06c318d82300c84806`. Measured 4,574,861 bytes; SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`. Model is ignored by Git and served locally after download. Preserve upstream licenses/notices if redistributing the model; this spike does not package model weights for release.

## Real-phone procedure

Manual status recorded 10 November 2026: user reports cancellation, rapid replacement, model/network failure, timeout and accessibility/layout groups working. Seven simpler garment cases looked good; two cluttered hoodie cases failed quality. File-validation and physical-phone checks remain pending. Device/browser and timing method are unconfirmed. See the findings report for the full table and qualifications; these manual reports do not replace the automated results or establish mobile feasibility.

Test on a physical Android phone and iPhone where available. Use localhost forwarding (such as Android USB port forwarding) or an already trusted HTTPS development setup; arbitrary LAN HTTP may lack APIs available in a secure context. No hosting or provisioning is configured here.

Record model/runtime bytes, first run and immediate Retry times, phone model, OS, browser/version, power/memory pressure, reload versus same-session behavior and visual quality. Record memory only if measured by suitable tools; hardware memory hints are not peak usage. Test a simple flat garment, pale-on-pale, black-on-dark, patterns, long sleeves, shoes/laces and clutter. Test cancel while loading/inference, rapid replacement with another valid photo, network failure, damaged cutout, Retry and Use original with notes retained. Check touch, keyboard where available, focus, text zoom and responsive preview. A narrow desktop viewport does not establish phone performance.

The user signed off the prototype on 10 November 2026 and will manage GitHub completion separately. See the [completion record and findings](../../docs/spikes/SPIKE-01.md) for completed checks and unverified follow-ups. Physical-phone testing and other unverified checks are not marked passed; mobile feasibility remains unestablished and must be checked before relying on this approach in production.
