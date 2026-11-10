import * as ort from "/node_modules/onnxruntime-web/dist/ort.wasm.min.mjs";
ort.env.wasm.wasmPaths = "/node_modules/onnxruntime-web/dist/";
ort.env.wasm.numThreads = 1;
let session;
self.onmessage = async ({ data: { pixels, width, height } }) => {
  const started = performance.now();
  let input;
  let outputs;
  try {
    const warm = Boolean(session);
    const initStart = performance.now();
    if (!session)
      session = await ort.InferenceSession.create("/models/u2netp.onnx", {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
    const initializationMs = performance.now() - initStart;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(pixels), width, height),
      0,
      0,
    );
    const small = new OffscreenCanvas(320, 320);
    const smallCtx = small.getContext("2d", { willReadFrequently: true });
    smallCtx.drawImage(canvas, 0, 0, 320, 320);
    const rgba = smallCtx.getImageData(0, 0, 320, 320).data;
    const plane = 320 * 320;
    const tensor = new Float32Array(plane * 3);
    let maximum = 1;
    for (let i = 0; i < rgba.length; i += 4)
      for (let c = 0; c < 3; c++) maximum = Math.max(maximum, rgba[i + c]);
    const mean = [0.485, 0.456, 0.406],
      std = [0.229, 0.224, 0.225];
    for (let i = 0; i < plane; i++)
      for (let c = 0; c < 3; c++)
        tensor[c * plane + i] = (rgba[i * 4 + c] / maximum - mean[c]) / std[c];
    input = new ort.Tensor("float32", tensor, [1, 3, 320, 320]);
    const inferenceStart = performance.now();
    outputs = await session.run({ [session.inputNames[0]]: input });
    const inferenceMs = performance.now() - inferenceStart;
    const mask = outputs[session.outputNames[0]].data;
    let min = Infinity,
      max = -Infinity;
    for (let i = 0; i < plane; i++) {
      min = Math.min(min, mask[i]);
      max = Math.max(max, mask[i]);
    }
    if (!Number.isFinite(min) || max - min < 1e-6)
      throw new Error("No usable foreground mask");
    const maskImage = smallCtx.createImageData(320, 320);
    for (let i = 0; i < plane; i++) {
      maskImage.data[i * 4] = 255;
      maskImage.data[i * 4 + 1] = 255;
      maskImage.data[i * 4 + 2] = 255;
      maskImage.data[i * 4 + 3] = Math.round(
        (255 * (mask[i] - min)) / (max - min),
      );
    }
    smallCtx.putImageData(maskImage, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(small, 0, 0, width, height);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    self.postMessage({
      blob,
      metrics: {
        provider: "WASM, one thread, dedicated worker",
        warmSession: warm,
        initializationMs,
        inferenceMs,
        workerTotalMs: performance.now() - started,
        outputBytes: blob.size,
        width,
        height,
        workerHeapBytes:
          performance.memory?.usedJSHeapSize ??
          "Unavailable in this browser; not total process/GPU memory",
      },
    });
  } catch {
    self.postMessage({
      error: "Processing failed. Retry or use the original photo.",
    });
  } finally {
    input?.dispose();
    if (outputs) for (const output of Object.values(outputs)) output.dispose();
  }
};
