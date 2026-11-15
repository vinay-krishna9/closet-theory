import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import {
  catalog,
  colors,
  catalogImageRevision,
} from '../src/features/onboarding/catalog.ts';
import {
  recolorPixel,
  recolorRecipe,
} from '../src/lib/images/catalog-recolor.ts';
import { cleanCatalogAlpha } from '../src/lib/images/catalog-alpha.ts';

const root = path.resolve(import.meta.dirname, '..');
const masks = JSON.parse(
  await fs.readFile(
    path.join(root, 'scripts/catalog-studio-masks.json'),
    'utf8',
  ),
);
const output = path.join(root, 'public/catalog', catalogImageRevision);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // The renderer has no network access and works only on the public source bytes.
  await page.route('**/*', (route) => route.abort());
  const ids = process.argv.slice(2);
  const types = catalog.filter((type) => !ids.length || ids.includes(type.id));
  const manifest = [];
  for (const type of types) {
    const sourcePath = `public/catalog/sources/studio-v2/${type.id}.png`;
    const bytes = await fs.readFile(path.join(root, sourcePath));
    const sourceSha256 = createHash('sha256').update(bytes).digest('hex');
    const rendered = await page.evaluate(
      async ({ data, mask, variants, transform, cleanup }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const draw = (points) => {
          ctx.beginPath();
          points.forEach(([x, y], i) => {
            const method = i ? 'lineTo' : 'moveTo';
            ctx[method]((x * canvas.width) / 1000, (y * canvas.height) / 1000);
          });
          ctx.closePath();
          ctx.fill();
        };
        const clean = new Function(`return (${cleanup})`)();
        const alpha = clean(source.data, canvas.width, canvas.height);
        const silhouette = new ImageData(canvas.width, canvas.height);
        let minX = canvas.width,
          minY = canvas.height,
          maxX = 0,
          maxY = 0;
        for (let pixel = 0; pixel < alpha.length; pixel++) {
          if (!alpha[pixel]) continue;
          silhouette.data.set([255, 255, 255, alpha[pixel]], pixel * 4);
          const x = pixel % canvas.width,
            y = Math.floor(pixel / canvas.width);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        if (maxX <= minX || maxY <= minY)
          throw new Error('Empty catalog cutout');
        ctx.putImageData(silhouette, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        mask.protected.forEach(draw);
        ctx.globalCompositeOperation = 'source-over';
        const recolorable = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const lumas = [];
        for (let i = 0; i < source.data.length; i += 4)
          if (recolorable.data[i + 3] > 240)
            lumas.push(
              source.data[i] * 0.2126 +
                source.data[i + 1] * 0.7152 +
                source.data[i + 2] * 0.0722,
            );
        lumas.sort((a, b) => a - b);
        const reference = lumas[Math.floor(lumas.length / 2)];
        const apply = new Function(`return (${transform})`)();
        const box = {
          x: minX,
          y: minY,
          w: maxX - minX + 1,
          h: maxY - minY + 1,
        };
        const target = document.createElement('canvas');
        target.width = 512;
        target.height = 640;
        const dest = target.getContext('2d');
        const scale = Math.min(448 / box.w, 576 / box.h);
        const result = [];
        for (const variant of variants) {
          const hex = variant.hex.slice(1);
          const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
          const pixels = new ImageData(
            new Uint8ClampedArray(source.data),
            canvas.width,
            canvas.height,
          );
          for (let i = 0; i < pixels.data.length; i += 4) {
            const alpha = silhouette.data[i + 3];
            if (!alpha) {
              pixels.data[i + 3] = 0;
              continue;
            }
            const value = apply(
              [source.data[i], source.data[i + 1], source.data[i + 2], alpha],
              rgb,
              reference,
              recolorable.data[i + 3] / 255,
            );
            pixels.data.set(value, i);
          }
          ctx.putImageData(pixels, 0, 0);
          dest.clearRect(0, 0, 512, 640);
          dest.drawImage(
            canvas,
            box.x,
            box.y,
            box.w,
            box.h,
            (512 - box.w * scale) / 2,
            (640 - box.h * scale) / 2,
            box.w * scale,
            box.h * scale,
          );
          result.push({
            color: variant.id,
            data: target.toDataURL('image/png').split(',')[1],
          });
        }
        // Include authored masks for provenance and reproducible region validation.
        ctx.putImageData(recolorable, 0, 0);
        const frame = () => {
          dest.clearRect(0, 0, 512, 640);
          dest.drawImage(
            canvas,
            box.x,
            box.y,
            box.w,
            box.h,
            (512 - box.w * scale) / 2,
            (640 - box.h * scale) / 2,
            box.w * scale,
            box.h * scale,
          );
          return target.toDataURL('image/png').split(',')[1];
        };
        const canonicalMask = frame();
        const original = new ImageData(
          new Uint8ClampedArray(source.data),
          canvas.width,
          canvas.height,
        );
        for (let i = 3; i < original.data.length; i += 4)
          original.data[i] = silhouette.data[i];
        ctx.putImageData(original, 0, 0);
        const base = frame();
        return {
          result,
          mask: canonicalMask,
          base,
          reference,
        };
      },
      {
        data: bytes.toString('base64'),
        mask: masks[type.id],
        variants: type.colors.map((id) => ({ id, ...colors[id] })),
        transform: recolorPixel.toString(),
        cleanup: cleanCatalogAlpha.toString(),
      },
    );
    for (const variant of rendered.result) {
      const name = `${type.id}-${variant.color}.png`;
      const bytes = Buffer.from(variant.data, 'base64');
      await fs.writeFile(path.join(output, name), bytes);
      manifest.push({
        type: type.id,
        color: variant.color,
        path: `/catalog/${catalogImageRevision}/${name}`,
        width: 512,
        height: 640,
        bytes: bytes.length,
        recipe: recolorRecipe,
        source: `/${sourcePath.slice('public/'.length)}`,
        sourceSha256,
        preparation: 'studio-alpha-v2',
      });
    }
    await fs.writeFile(
      path.join(output, `${type.id}-mask.png`),
      Buffer.from(rendered.mask, 'base64'),
    );
    await fs.writeFile(
      path.join(output, `${type.id}-base.png`),
      Buffer.from(rendered.base, 'base64'),
    );
    console.log(
      `${type.id}: ${rendered.result.length} variants, reference luminance ${rendered.reference.toFixed(1)}`,
    );
  }
  if (!ids.length)
    await fs.writeFile(
      path.join(output, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
    );
} finally {
  await browser.close();
}
