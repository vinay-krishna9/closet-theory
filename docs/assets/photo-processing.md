# Photo processing provenance

Approved PHOTO-01/02 integration, 24 November 2026. Browser removal uses a dedicated, single-thread WASM worker. Photos are not sent to a third-party inference provider. The processing bundle/model load only for a selected photo; generated assets are prepared by `npm.cmd run photos:prepare` (also before dev/build) and served from the app's own `/processing/` path.

- Runtime: `onnxruntime-web` 1.31.1, [MIT license](https://github.com/microsoft/onnxruntime/blob/main/LICENSE). Keep the package notices with distributions.
- Model: U2Netp, [U2Net upstream and Apache-2.0 license](https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE).
- ONNX artifact: [rembg release](https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx), distributed by rembg ([MIT](https://github.com/danielgatis/rembg/blob/main/LICENSE.txt)). 4,574,861 bytes; SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`, matching the inspected SPIKE-01 artifact. Build tooling verifies size/checksum before writing a downloaded model and rechecks a cached copy.
- Preprocessing follows the reviewed spike/rembg U2Netp normalization: 320×320 RGB, ImageNet mean/std, foreground mask normalized to alpha. Input colors remain unchanged; the model only changes alpha.

Generated assets are ignored by Git, reproducible during setup, and never contain personal photos. Shipping artifacts must include the upstream model/runtime license notices. The first model/runtime transfer is substantial (the spike measured about 4.6 MB model plus 14.8 MB WASM, before JS); physical-phone network/memory/performance and garment preservation still need review. A technically valid cutout is not proof of garment quality. Always offer explicit sanitized-original fallback, including after success. No model replacement or external provider is silently introduced.
