const $ = (id) => document.getElementById(id);
let worker,
  timer,
  generation = 0,
  originalBlob,
  sourceUrl,
  resultUrl,
  pixels,
  width,
  height;
const stop = () => {
  clearTimeout(timer);
  worker?.terminate();
  worker = undefined;
};
const status = (message) => {
  $("status").textContent = message;
};
const buttons = (busy) => {
  $("cancel").disabled = !busy;
  $("retry").disabled = !originalBlob || busy;
  $("original").disabled = !originalBlob;
};
function clearResult() {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = undefined;
  $("result").hidden = true;
  $("result").removeAttribute("src");
  $("result-label").textContent = "No result selected";
}
function processPhoto() {
  const run = ++generation;
  clearResult();
  status("Removing background…");
  buttons(true);
  const started = performance.now();
  try {
    worker ||= new Worker("/worker.js", { type: "module" });
    worker.onmessage = ({ data }) => {
      if (run !== generation) return;
      clearTimeout(timer);
      buttons(false);
      if (data.error) {
        stop();
        status(data.error);
        return;
      }
      resultUrl = URL.createObjectURL(data.blob);
      $("result").src = resultUrl;
      $("result").hidden = false;
      $("result-label").textContent = "Cutout — review garment edges";
      status("Cutout ready for review. Nothing has been saved.");
      $("metrics").textContent = JSON.stringify(
        {
          ...data.metrics,
          endToEndMs: performance.now() - started,
          userAgent: navigator.userAgent,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemoryGB: navigator.deviceMemory ?? "Unavailable",
          secureContext: isSecureContext,
        },
        null,
        2,
      );
    };
    worker.onerror = () => {
      if (run !== generation) return;
      stop();
      buttons(false);
      status("This browser could not run processing. Retry or use original.");
    };
    worker.postMessage({ pixels: pixels.slice().buffer, width, height });
    timer = setTimeout(() => {
      if (run !== generation) return;
      ++generation;
      stop();
      buttons(false);
      status("Processing timed out after 30 seconds. Retry or use original.");
    }, 30000);
  } catch {
    stop();
    buttons(false);
    status("This browser does not support processing. Use original.");
  }
}
$("photo").onchange = async () => {
  const file = $("photo").files[0];
  if (!file) return;
  const run = ++generation;
  stop();
  clearResult();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  $("source").hidden = true;
  $("source").removeAttribute("src");
  originalBlob = undefined;
  pixels = undefined;
  buttons(false);
  $("metrics").textContent = "No completed run for this photo.";
  status("Validating photo…");
  let bitmap;
  try {
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Photo exceeds 10 MB. Choose a smaller photo.");
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (run !== generation) return;
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
      (v, i) => bytes[i] === v,
    );
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!png && !jpeg && !webp)
      throw new Error(
        "Unsupported image. Choose JPEG, PNG or WebP; convert HEIC first.",
      );
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    if (run !== generation) return;
    if (bitmap.width * bitmap.height > 25000000)
      throw new Error("Photo exceeds 25 megapixels. Resize it first.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    width = Math.round(bitmap.width * scale);
    height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, width, height);
    const sanitized = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (run !== generation) return;
    if (!sanitized)
      throw new Error("Could not decode this photo. Choose another.");
    originalBlob = sanitized;
    pixels = ctx.getImageData(0, 0, width, height).data;
    sourceUrl = URL.createObjectURL(originalBlob);
    $("source").src = sourceUrl;
    $("source").hidden = false;
    processPhoto();
  } catch (error) {
    if (run === generation)
      status(error.message || "Invalid photo. Choose another.");
  } finally {
    bitmap?.close();
    $("photo").value = "";
  }
};
$("cancel").onclick = () => {
  ++generation;
  stop();
  buttons(false);
  status("Processing cancelled. Retry or use original.");
};
$("retry").onclick = processPhoto;
$("original").onclick = () => {
  ++generation;
  stop();
  clearResult();
  resultUrl = URL.createObjectURL(originalBlob);
  $("result").src = resultUrl;
  $("result").hidden = false;
  $("result-label").textContent = "Original selected — background retained";
  buttons(false);
  status("Using original photo. Nothing has been saved.");
};
$("choose").onclick = () => $("photo").click();
window.addEventListener("pagehide", () => {
  ++generation;
  stop();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
});
