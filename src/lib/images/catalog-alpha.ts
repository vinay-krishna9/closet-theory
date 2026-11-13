/** Keep the main product and trim fringe before downsampling its generated cutout. */
export function cleanCatalogAlpha(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const count = width * height;
  const visited = new Uint8Array(count);
  const queue = new Int32Array(count);
  let largest = new Int32Array(0);
  for (let start = 0; start < count; start++) {
    if (visited[start] || rgba[start * 4 + 3] < 128) continue;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    visited[start] = 1;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      const neighbors = [pixel - width, pixel + width];
      if (x > 0) neighbors.push(pixel - 1);
      if (x < width - 1) neighbors.push(pixel + 1);
      for (const neighbor of neighbors) {
        if (
          neighbor < 0 ||
          neighbor >= count ||
          visited[neighbor] ||
          rgba[neighbor * 4 + 3] < 128
        )
          continue;
        visited[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }
    if (tail > largest.length) largest = queue.slice(0, tail);
  }
  let alpha = new Uint8ClampedArray(count);
  for (const pixel of largest) alpha[pixel] = 255;
  // Three source pixels are less than two output pixels at the shipped size.
  for (let pass = 0; pass < 3; pass++) {
    const inset = new Uint8ClampedArray(count);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixel = y * width + x;
        inset[pixel] = Math.min(
          alpha[pixel],
          alpha[pixel - 1],
          alpha[pixel + 1],
          alpha[pixel - width],
          alpha[pixel + width],
        );
      }
    }
    alpha = inset;
  }
  return alpha;
}
