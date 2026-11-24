import * as ort from 'onnxruntime-web/wasm';
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = '/processing/';
let session: Promise<ort.InferenceSession> | null = null;
self.onmessage = async ({
  data,
}: MessageEvent<{ pixels: ArrayBuffer; width: number; height: number }>) => {
  let input: ort.Tensor | undefined,
    outputs: ort.InferenceSession.ReturnType | undefined;
  try {
    if (
      !Number.isSafeInteger(data.width) ||
      !Number.isSafeInteger(data.height) ||
      data.width < 1 ||
      data.height < 1 ||
      data.width * data.height > 1600 * 1600 ||
      data.pixels.byteLength !== data.width * data.height * 4
    )
      throw new Error('Invalid image');
    session ??= ort.InferenceSession.create('/processing/u2netp.onnx', {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    const runtime = await session;
    const canvas = new OffscreenCanvas(data.width, data.height),
      context = canvas.getContext('2d');
    const small = new OffscreenCanvas(320, 320),
      tiny = small.getContext('2d', { willReadFrequently: true });
    if (!context || !tiny) throw new Error('Canvas unavailable');
    context.putImageData(
      new ImageData(
        new Uint8ClampedArray(data.pixels),
        data.width,
        data.height,
      ),
      0,
      0,
    );
    tiny.drawImage(canvas, 0, 0, 320, 320);
    const rgba = tiny.getImageData(0, 0, 320, 320).data,
      plane = 320 * 320;
    const values = new Float32Array(plane * 3),
      mean = [0.485, 0.456, 0.406],
      std = [0.229, 0.224, 0.225];
    let maximum = 1;
    for (let i = 0; i < rgba.length; i += 4)
      for (let c = 0; c < 3; c++) maximum = Math.max(maximum, rgba[i + c]);
    for (let i = 0; i < plane; i++)
      for (let c = 0; c < 3; c++)
        values[c * plane + i] = (rgba[i * 4 + c] / maximum - mean[c]) / std[c];
    input = new ort.Tensor('float32', values, [1, 3, 320, 320]);
    outputs = await runtime.run({ [runtime.inputNames[0]]: input });
    const mask = outputs[runtime.outputNames[0]].data as Float32Array;
    let minimum = Infinity,
      peak = -Infinity;
    for (const value of mask) {
      minimum = Math.min(minimum, value);
      peak = Math.max(peak, value);
    }
    if (
      !Number.isFinite(minimum) ||
      !Number.isFinite(peak) ||
      peak - minimum < 1e-6
    )
      throw new Error('No usable mask');
    const image = tiny.createImageData(320, 320);
    for (let i = 0; i < plane; i++) {
      image.data[i * 4] = 255;
      image.data[i * 4 + 1] = 255;
      image.data[i * 4 + 2] = 255;
      image.data[i * 4 + 3] = Math.round(
        (255 * (mask[i] - minimum)) / (peak - minimum),
      );
    }
    tiny.putImageData(image, 0, 0);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(small, 0, 0, data.width, data.height);
    self.postMessage({
      blob: await canvas.convertToBlob({ type: 'image/png' }),
    });
  } catch {
    session = null;
    self.postMessage({ error: true });
  } finally {
    input?.dispose();
    if (outputs) for (const tensor of Object.values(outputs)) tensor.dispose();
  }
};
