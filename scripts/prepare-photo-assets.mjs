import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const output = path.resolve('public/processing');
await mkdir(output, { recursive: true });
const notices = path.resolve('public/notices');
await mkdir(notices, { recursive: true });
for (const name of [
  'onnxruntime-LICENSE.txt',
  'u2net-LICENSE.txt',
  'rembg-LICENSE.txt',
]) {
  if (!(await readFile(path.join(notices, name)).catch(() => null)))
    throw new Error(
      'Restore the tracked photo dependency notices before building.',
    );
}
const expected =
  '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8';
const modelPath = path.join(output, 'u2netp.onnx');
let model = await readFile(modelPath).catch(() => null);
if (!model || createHash('sha256').update(model).digest('hex') !== expected) {
  const response = await fetch(
    'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx',
    { signal: AbortSignal.timeout(90000) },
  );
  if (!response.ok)
    throw new Error(
      'Could not download the approved photo model. Retry photos:prepare.',
    );
  model = Buffer.from(await response.arrayBuffer());
  if (
    model.length !== 4574861 ||
    createHash('sha256').update(model).digest('hex') !== expected
  )
    throw new Error('Photo model checksum mismatch.');
  await writeFile(modelPath, model);
}
for (const name of [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
])
  await copyFile(
    path.resolve('node_modules/onnxruntime-web/dist', name),
    path.join(output, name),
  );
// Model/runtime notices are tracked separately from generated binary assets.
console.log(
  'Prepared checksum-verified U2Netp and version-matched ONNX WASM assets.',
);
