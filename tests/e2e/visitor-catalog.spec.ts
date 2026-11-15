import { expect, test } from '@playwright/test';
import {
  catalog,
  catalogImageRevision,
  colors,
} from '../../src/features/onboarding/catalog';

test('select, customize, edit and remove only owned clothing across visitor navigation', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/wardrobe');
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('link', { name: 'Choose your first pieces' }).click();
  await expect(page.getByRole('article')).toHaveCount(8);
  await expect(
    page.getByText(/AI-generated garment samples show/),
  ).toBeVisible();
  await expect(
    page.getByRole('article').first().getByRole('img'),
  ).toHaveAttribute('alt', /AI-generated sample/);
  for (const card of await page.getByRole('article').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(
      card.getByRole('button', { name: 'I own this' }),
    ).toBeEnabled();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath('catalog.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const tee = page.getByRole('article', { name: 'T-shirt catalog item' });
  await expect(tee.getByRole('combobox')).toHaveCount(0);
  await expect(tee.getByRole('button', { name: 'I own this' })).toBeEnabled();
  await tee.getByRole('button', { name: 'Customize', exact: true }).click();
  const editor = page.getByRole('dialog');
  await expect(
    editor.getByRole('heading', { name: 'Make it your own' }),
  ).toBeFocused();
  await editor.getByRole('radio', { name: 'Navy', exact: true }).check();
  await expect(editor.getByRole('img')).toHaveAttribute('alt', /Navy T-shirt/);
  await expect(
    editor.getByRole('button', { name: 'Use all seasons' }),
  ).toHaveCount(0);
  await expect(
    editor.getByRole('button', { name: 'Add to wardrobe' }),
  ).toBeEnabled();
  await page.screenshot({
    path: testInfo.outputPath('catalog-editor-preview.png'),
    animations: 'disabled',
  });
  await editor
    .getByRole('textbox', { name: 'Garment name' })
    .fill('My navy tee');
  await editor.getByText('Customize the details', { exact: true }).click();
  await editor.getByRole('radio', { name: 'V-neck', exact: true }).check();
  await editor.getByRole('radio', { name: 'Striped', exact: true }).check();
  const season = editor.getByRole('group', { name: /^Seasons/ });
  await season.getByRole('checkbox', { name: 'Winter', exact: true }).uncheck();
  await expect(
    season.getByRole('checkbox', { name: 'Summer', exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: testInfo.outputPath('catalog-editor.png'),
    animations: 'disabled',
  });
  await editor
    .getByRole('button', { name: 'Add to wardrobe', exact: true })
    .click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  const item = page.getByRole('article', { name: 'My navy tee' });
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(item.getByRole('img')).toHaveAttribute('alt', /Navy T-shirt/);
  const id = await item.getAttribute('data-item-id');
  await item.getByRole('button', { name: 'Edit clothing' }).click();
  await editor.getByText('Customize the details', { exact: true }).click();
  await expect(
    editor.getByRole('radio', { name: 'V-neck', exact: true }),
  ).toBeChecked();
  await expect(
    editor.getByRole('checkbox', { name: 'Winter', exact: true }),
  ).not.toBeChecked();
  await editor
    .getByRole('textbox', { name: 'Garment name' })
    .fill('Weekend tee');
  await editor.getByRole('button', { name: 'Save changes' }).click();
  const renamed = page.getByRole('article', { name: 'Weekend tee' });
  await expect(renamed).toHaveAttribute('data-item-id', id!);
  await page.screenshot({
    path: testInfo.outputPath('visitor-wardrobe.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page
    .getByRole('searchbox', { name: 'Search clothing' })
    .fill('does not match');
  await expect(
    page.getByRole('heading', { name: 'No pieces found.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await renamed.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Keep clothing' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Keep clothing' }).click();
  await expect(
    renamed.getByRole('button', { name: 'Remove', exact: true }),
  ).toBeFocused();
  await expect(renamed).toBeVisible();
  await renamed.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Remove clothing' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your wardrobe', exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('link', { name: 'Choose your first pieces' }).click();
  await expect(page.getByRole('article')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('editor keeps its catalog type fixed and its preview visible', async ({
  page,
}, testInfo) => {
  await page.goto('/quick-add');
  await page
    .getByRole('article', { name: 'T-shirt catalog item' })
    .getByRole('button', { name: 'Customize', exact: true })
    .click();
  const editor = page.getByRole('dialog');
  const group = editor.getByRole('group', { name: 'Group', exact: true });
  const type = editor.getByRole('group', { name: 'Type', exact: true });
  await expect(
    group.getByRole('radio', { name: 'Tops', exact: true }),
  ).toBeChecked();
  await expect(
    type.getByRole('radio', { name: 'T-shirt', exact: true }),
  ).toBeChecked();
  for (const choice of [
    ...(await group.getByRole('radio').all()),
    ...(await type.getByRole('radio').all()),
  ])
    await expect(choice).toBeDisabled();
  await group.getByText('Shoes', { exact: true }).click({ force: true });
  await expect(
    group.getByRole('radio', { name: 'Tops', exact: true }),
  ).toBeChecked();
  await expect(editor.getByRole('combobox')).toHaveCount(0);
  await editor.getByRole('radio', { name: 'White', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    editor.getByRole('radio', { name: 'Black', exact: true }),
  ).toBeChecked();
  await expect(editor.locator('.item-editor-preview img')).toHaveAttribute(
    'alt',
    /Black T-shirt/,
  );
  await page.keyboard.press('Tab');
  await expect(
    editor.getByRole('radio', { name: 'Casual', exact: true }),
  ).toBeFocused();
  await editor.getByText('Customize the details', { exact: true }).click();
  await expect(
    editor.getByRole('button', { name: 'Add to wardrobe' }),
  ).toBeEnabled();
  const photo = editor.locator('.item-editor-preview .garment-photo');
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await editor
      .locator(
        '.item-editor-fields, .item-editor-identity, .item-editor-options',
      )
      .evaluateAll((elements) =>
        elements.forEach((element) => (element.scrollTop = 0)),
      );
    const before = (await photo.boundingBox())!;
    const header = (await editor.locator('.editor-header').boundingBox())!;
    const footer = (await editor.locator('.editor-footer').boundingBox())!;
    expect(before.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(before.y + before.height).toBeLessThanOrEqual(footer.y + 1);
    const scroller = editor.locator(
      viewport.width >= 768 ? '.item-editor-options' : '.item-editor-fields',
    );
    await scroller.evaluate(
      (element) => (element.scrollTop = element.scrollHeight),
    );
    const after = (await photo.boundingBox())!;
    expect(after.y).toBeCloseTo(before.y, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
    expect(
      await editor.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(false);
    if (viewport.width === 1440 || viewport.width === 390)
      await page.screenshot({
        path: testInfo.outputPath(`editor-pinned-${viewport.width}.png`),
        animations: 'disabled',
      });
  }
  await page.setViewportSize({ width: 320, height: 480 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await editor.getByRole('radio', { name: 'Printed', exact: true }).focus();
  const preview = (await photo.boundingBox())!;
  const footer = (await editor.locator('.editor-footer').boundingBox())!;
  expect(preview.y + preview.height).toBeLessThanOrEqual(footer.y + 1);
  await expect(
    editor.getByRole('radio', { name: 'Printed', exact: true }),
  ).toBeInViewport();
  expect(
    await editor.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(false);
});

test('duplicate choices keep or replace existing clothing and separate garments need confirmation', async ({
  page,
}) => {
  await page.goto('/quick-add');
  const tee = page.getByRole('article', { name: 'T-shirt catalog item' });
  const add = tee.getByRole('button', { name: 'I own this' });
  await expect(add).toBeEnabled();
  await add.evaluate((element: HTMLButtonElement) => {
    element.click();
    element.click();
  });
  await expect(
    page.getByRole('link', { name: '1 piece in your wardrobe' }),
  ).toBeVisible();
  await tee.getByRole('button', { name: 'Add another / customize' }).click();
  const editor = page.getByRole('dialog');
  await editor.getByRole('button', { name: 'Add to wardrobe' }).click();
  await expect(
    editor.getByRole('heading', { name: 'You may already have this' }),
  ).toBeVisible();
  await editor.getByRole('button', { name: 'Keep existing' }).click();
  await expect(editor).not.toBeVisible();
  await tee.getByRole('button', { name: 'Add another / customize' }).click();
  await editor
    .getByRole('textbox', { name: 'Garment name' })
    .fill('Updated white tee');
  await editor.getByRole('button', { name: 'Add to wardrobe' }).click();
  await editor.getByRole('button', { name: 'Replace details' }).click();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  const original = page.getByRole('article', { name: 'Updated white tee' });
  const id = await original.getAttribute('data-item-id');
  await page.getByRole('link', { name: 'Add clothing', exact: true }).click();
  await tee.getByRole('button', { name: 'Add another / customize' }).click();
  await editor.getByRole('button', { name: 'Add to wardrobe' }).click();
  await editor
    .getByRole('button', { name: 'Add as a different garment' })
    .click();
  await expect(
    page.getByRole('link', {
      name: '1 piece in your wardrobe',
      includeHidden: true,
    }),
  ).toHaveCount(1);
  await editor
    .getByRole('button', { name: 'Confirm separate garment' })
    .click();
  await page.getByRole('link', { name: '2 pieces in your wardrobe' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(
    page.getByRole('article', { name: 'Updated white tee' }),
  ).toHaveAttribute('data-item-id', id!);
  expect(
    await page
      .getByRole('article')
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute('data-item-id')),
      ),
  ).toEqual(expect.arrayContaining([id]));
  const ids = await page
    .getByRole('article')
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-item-id')),
    );
  expect(new Set(ids).size).toBe(2);
});

test('failed color previews preserve tags and retry without saving the wrong image', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/_next/image*', async (route) => {
    const url = new URL(route.request().url());
    if (fail && url.searchParams.get('url')?.includes('tshirt-navy'))
      await route.abort();
    else await route.continue();
  });
  await page.goto('/quick-add');
  const tee = page.getByRole('article', { name: 'T-shirt catalog item' });
  await tee.getByRole('button', { name: 'Customize', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor
    .getByRole('textbox', { name: 'Garment name' })
    .fill('My recovery tee');
  await editor.getByRole('radio', { name: 'Navy', exact: true }).check();
  await expect(
    editor.getByText('Photo unavailable', { exact: true }),
  ).toBeVisible();
  await expect(
    editor.getByRole('button', { name: 'Add to wardrobe' }),
  ).toBeDisabled();
  await expect(
    editor.getByRole('textbox', { name: 'Garment name' }),
  ).toHaveValue('My recovery tee');
  await expect(
    editor.getByRole('radio', { name: 'Navy', exact: true }),
  ).toBeChecked();
  fail = false;
  await editor.getByRole('button', { name: 'Retry photo' }).click();
  await expect(
    editor.getByRole('button', { name: 'Add to wardrobe' }),
  ).toBeEnabled();
  await editor.getByRole('button', { name: 'Add to wardrobe' }).click();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  await expect(
    page.getByRole('article', { name: 'My recovery tee' }).getByRole('img'),
  ).toHaveAttribute('alt', /Navy T-shirt/);
});

test('color changes retain preview height with a skeleton and ignore late results', async ({
  page,
}, testInfo) => {
  let release: () => void = () => {};
  let navyRequested = false;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/image*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('url')?.includes('tshirt-navy')) {
      navyRequested = true;
      await held;
    }
    try {
      await route.continue();
    } catch {
      /* A removed image request may have been cancelled by the browser. */
    }
  });
  await page.goto('/quick-add');
  const tee = page.getByRole('article', { name: 'T-shirt catalog item' });
  await tee.getByRole('button', { name: 'Customize', exact: true }).click();
  const editor = page.getByRole('dialog');
  const add = editor.getByRole('button', { name: 'Add to wardrobe' });
  await expect(add).toBeEnabled();
  const photo = editor.locator('.garment-photo');
  const height = await photo.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  await editor.getByRole('radio', { name: 'Navy', exact: true }).check();
  await expect.poll(() => navyRequested).toBe(true);
  await expect(add).toBeDisabled();
  await expect(editor.getByRole('status')).toHaveText('Loading photo…');
  await expect(photo).toHaveAttribute('aria-busy', 'true');
  expect(
    await photo.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeCloseTo(height, 2);
  await photo.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('color-loading.png'),
    animations: 'disabled',
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(editor.locator('.garment-photo-skeleton')).toHaveCSS(
    'animation-name',
    'none',
  );
  await editor.getByRole('radio', { name: 'Burgundy', exact: true }).check();
  await expect(add).toBeEnabled();
  release();
  await expect(editor.getByRole('img')).toHaveAttribute(
    'alt',
    /Burgundy T-shirt/,
  );
  await expect(editor.getByRole('status')).toHaveCount(0);
  expect(
    await photo.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeCloseTo(height, 2);
  await add.click();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  await expect(page).toHaveURL(/\/wardrobe$/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article').getByRole('img')).toHaveAttribute(
    'alt',
    /Burgundy T-shirt/,
  );
});

test('visitor state resets on reload and catalog search recovers honestly', async ({
  page,
}) => {
  await page.goto('/quick-add');
  await page
    .getByRole('searchbox', { name: 'Find an essential' })
    .fill('no such garment');
  await expect(
    page.getByRole('heading', { name: 'No pieces match your search.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  const tee = page.getByRole('article', { name: 'T-shirt catalog item' });
  await tee.getByRole('button', { name: 'I own this' }).click();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('link', { name: 'STYLIST.', exact: true }).click();
  await page.getByRole('link', { name: 'Explore your wardrobe' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText(/reset on refresh/)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Statistics', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Profile', exact: true }),
  ).toHaveCount(0);
});

test('catalog images have matching color variants, transparent backgrounds and protected details', async ({
  page,
}) => {
  await page.goto('/catalog-credits');
  await expect(
    page.getByRole('heading', { name: 'Catalog photo credits' }),
  ).toBeVisible();
  await expect(
    page.getByText(/current catalog uses AI-generated studio/),
  ).toBeVisible();
  const provenance = await (
    await page.request.get('/catalog/sources/studio-v2/provenance.json')
  ).json();
  expect(Object.keys(provenance.prompts).sort()).toEqual(
    catalog.map((type) => type.id).sort(),
  );
  const manifest = await (
    await page.request.get(`/catalog/${catalogImageRevision}/manifest.json`)
  ).json();
  expect(manifest).toHaveLength(64);
  for (const asset of manifest) {
    expect(asset.path).toBe(
      `/catalog/${catalogImageRevision}/${asset.type}-${asset.color}.png`,
    );
    expect(asset.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(asset.source).toBe(`/catalog/sources/studio-v2/${asset.type}.png`);
  }
  const results = await page.evaluate(
    async ({ types, palette, revision }) => {
      async function pixels(url: string) {
        const bitmap = await createImageBitmap(await (await fetch(url)).blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        return {
          width: canvas.width,
          height: canvas.height,
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      }
      const output = [];
      for (const type of types) {
        const base = await pixels(`/catalog/${revision}/${type.id}-base.png`),
          mask = await pixels(`/catalog/${revision}/${type.id}-mask.png`);
        for (const color of type.colors) {
          const image = await pixels(
            `/catalog/${revision}/${type.id}-${color}.png`,
          );
          let protectedCount = 0,
            maxProtectedDelta = 0,
            alphaMismatch = 0,
            transparent = 0;
          const channels: [number[], number[], number[]] = [[], [], []];
          for (let i = 0; i < image.data.length; i += 4) {
            if (image.data[i + 3] === 0) transparent++;
            if (image.data[i + 3] !== base.data[i + 3]) alphaMismatch++;
            if (mask.data[i + 3] === 0 && base.data[i + 3] === 255) {
              protectedCount++;
              for (let c = 0; c < 3; c++)
                maxProtectedDelta = Math.max(
                  maxProtectedDelta,
                  Math.abs(image.data[i + c] - base.data[i + c]),
                );
            }
            if (mask.data[i + 3] > 250 && image.data[i + 3] === 255)
              for (let c = 0; c < 3; c++) channels[c].push(image.data[i + c]);
          }
          const target = palette[color as keyof typeof palette].hex.slice(1);
          const medianDelta = channels.map((values, c) => {
            values.sort((a, b) => a - b);
            return Math.abs(
              values[Math.floor(values.length / 2)] -
                parseInt(target.slice(c * 2, c * 2 + 2), 16),
            );
          });
          output.push({
            id: `${type.id}/${color}`,
            width: image.width,
            height: image.height,
            protectedCount,
            maxProtectedDelta,
            alphaMismatch,
            transparent,
            medianDelta,
          });
        }
      }
      return output;
    },
    { types: catalog, palette: colors, revision: catalogImageRevision },
  );
  expect(results).toHaveLength(64);
  for (const result of results) {
    expect(result.width, result.id).toBe(512);
    expect(result.height, result.id).toBe(640);
    expect(result.transparent, result.id).toBeGreaterThan(1000);
    expect(result.alphaMismatch, result.id).toBe(0);
    expect(result.maxProtectedDelta, result.id).toBeLessThanOrEqual(3);
    for (const delta of result.medianDelta)
      expect(delta, result.id).toBeLessThan(25);
  }
  expect(
    results
      .filter((result) => result.id.startsWith('sneakers/'))
      .every((result) => result.protectedCount > 1000),
  ).toBe(true);
});
