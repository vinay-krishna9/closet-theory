import { expect, test, type Page } from '@playwright/test';

async function add(page: Page, type: string) {
  const button = page
    .getByRole('article', { name: `${type} catalog item`, exact: true })
    .getByRole('button', { name: 'I own this', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
}
async function suggest(page: Page) {
  await page
    .getByRole('button', { name: 'Suggest outfits', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Suggest outfits', exact: true }),
  ).toBeEnabled();
}

test('real visitor suggestions are capped at three, deterministic and filterable', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const workers: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto('/outfits');
  await page.getByRole('link', { name: 'Choose your first pieces' }).click();
  await add(page, 'T-shirt');
  await add(page, 'Jeans');
  await page.goto('/outfits');
  await suggest(page);
  await expect(
    page.getByRole('heading', { name: 'A few pieces are missing.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Add shoes' }).click();
  await expect(page).toHaveURL(/group=Shoes/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await add(page, 'Sneakers');
  await page.goto('/outfits');
  await suggest(page);
  const cards = page.locator('.outfit-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().getByRole('img')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: 'More outfits with an account' }),
  ).toHaveCount(0);
  await page.goto('/quick-add');
  await add(page, 'Shirt');
  await add(page, 'Chinos');
  await page.goto('/outfits');
  await suggest(page);
  await expect(cards).toHaveCount(3);
  const identities = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-outfit-id')),
  );
  expect(new Set(identities).size).toBe(3);
  await expect(
    page.getByRole('heading', { name: 'More outfits with an account' }),
  ).toBeVisible();
  await expect(
    page.getByText('Account access is coming soon.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Show more', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Favorite|Not for me|I wore this/ }),
  ).toHaveCount(0);
  const account = page.getByRole('button', { name: 'About account access' });
  await account.click();
  await expect(page.getByRole('dialog')).toContainText(
    'Accounts are not available yet',
  );
  await page.keyboard.press('Escape');
  await expect(account).toBeFocused();
  await suggest(page);
  expect(
    await cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-outfit-id')),
    ),
  ).toEqual(identities);
  await page.reload();
  await suggest(page);
  expect(
    await cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-outfit-id')),
    ),
  ).toEqual(identities);
  await page.screenshot({
    path: testInfo.outputPath('outfits.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const filterPanel = await page
    .locator('.outfit-filter-options')
    .boundingBox();
  const suggestButton = await page
    .getByRole('button', { name: 'Suggest outfits', exact: true })
    .boundingBox();
  expect(filterPanel).not.toBeNull();
  expect(suggestButton).not.toBeNull();
  expect(
    suggestButton!.y - (filterPanel!.y + filterPanel!.height),
  ).toBeGreaterThanOrEqual(24);
  await page
    .getByRole('group', { name: 'Formality', exact: true })
    .getByRole('radio', { name: 'Formal', exact: true })
    .check();
  await expect(cards).toHaveCount(0);
  await suggest(page);
  await expect(
    page.getByRole('heading', { name: 'These filters need different pieces.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try Any filters' }).click();
  await expect(cards).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Filters', exact: true }),
  ).toBeFocused();
  await expect(
    page
      .getByRole('group', { name: 'Formality', exact: true })
      .getByRole('radio', { name: 'Any', exact: true }),
  ).toBeChecked();
  expect(workers.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('jackets follow seasons, details reflect edits, and removal invalidates suggestions', async ({
  page,
}) => {
  await page.goto('/quick-add');
  for (const type of ['T-shirt', 'Jeans', 'Sneakers', 'Simple jacket'])
    await add(page, type);
  await page.goto('/outfits');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const season = page.getByRole('group', { name: 'Season', exact: true });
  await season.getByRole('radio', { name: 'Winter', exact: true }).check();
  await suggest(page);
  await expect(page.locator('.outfit-card')).toHaveCount(1);
  await expect(page.locator('.outfit-slot-jacket')).toHaveCount(1);
  await expect(page.locator('.outfit-card').getByRole('img')).toHaveCount(4);
  await season.getByRole('radio', { name: 'Summer', exact: true }).check();
  await expect(page.locator('.outfit-card')).toHaveCount(0);
  await suggest(page);
  await expect(page.locator('.outfit-slot-jacket')).toHaveCount(0);
  await page.goto('/wardrobe');
  const tee = page.getByRole('article', { name: 'White T-shirt', exact: true });
  await tee.getByRole('button', { name: 'Edit clothing' }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: 'Garment name' })
    .fill('Weekend tee');
  await dialog.getByRole('radio', { name: 'Navy', exact: true }).check();
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await page.goto('/outfits');
  await suggest(page);
  await expect(page.locator('.outfit-card').getByRole('heading')).toContainText(
    'Weekend tee',
  );
  await expect(page.locator('.outfit-slot-top img')).toHaveAttribute(
    'alt',
    /Navy T-shirt/,
  );
  await page.goto('/wardrobe');
  const shoes = page.getByRole('article', {
    name: 'White Sneakers',
    exact: true,
  });
  await shoes.getByRole('button', { name: 'Remove', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remove clothing', exact: true })
    .click();
  await page.goto('/outfits');
  await suggest(page);
  await expect(page.getByRole('link', { name: 'Add shoes' })).toBeVisible();
  await expect(page.locator('.outfit-card')).toHaveCount(0);
});

test('worker startup failure preserves work and retry recovers', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    let first = true;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        if (first) {
          first = false;
          throw new Error('Injected worker startup failure');
        }
        super(url, options);
      }
    };
  });
  await page.goto('/quick-add');
  for (const type of ['T-shirt', 'Jeans', 'Sneakers']) await add(page, type);
  await page.goto('/outfits');
  await suggest(page);
  await expect(
    page.getByRole('heading', { name: 'Suggestions could not be generated.' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Suggestions could not be generated.' }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Retry suggestions' }).click();
  await expect(page.locator('.outfit-card')).toHaveCount(1);
  await expect(page.getByText('Any season · Any formality')).toBeVisible();
});

test('image failure remains recoverable at 320px with reduced motion and keyboard navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/quick-add');
  for (const type of ['T-shirt', 'Jeans', 'Sneakers']) await add(page, type);
  await page.goto('/outfits');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(/\/_next\/image\?.*tshirt/, (route) => route.abort());
  await suggest(page);
  const card = page.locator('.outfit-card');
  const retry = card.getByRole('button', { name: /Retry photo/ });
  await expect(retry).toBeVisible();
  await retry.scrollIntoViewIfNeeded();
  const target = await retry.boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(44);
  expect(target?.width).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: testInfo.outputPath('outfit-photo-recovery-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.unroute(/\/_next\/image\?.*tshirt/);
  await retry.click();
  await expect(card.getByRole('img')).toHaveCount(3);
  await expect(card.getByRole('img').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const radios = page
    .getByRole('group', { name: 'Season', exact: true })
    .getByRole('radio');
  await radios.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(radios.nth(1)).toBeChecked();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(radios.nth(1)).not.toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(radios.nth(1)).toBeChecked();
  await page.emulateMedia({ forcedColors: 'active' });
  await page.screenshot({
    path: testInfo.outputPath('outfit-filters-forced-colors.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('blocked storage still permits in-memory suggestions and unknown catalog groups recover', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
  });
  await page.goto('/quick-add?group=Invalid');
  await expect(page.getByRole('article')).toHaveCount(8);
  for (const type of ['T-shirt', 'Jeans', 'Sneakers']) await add(page, type);
  // Client navigation retains the same in-memory provider when storage is blocked.
  await page.getByRole('link', { name: 'Outfits', exact: true }).last().click();
  await suggest(page);
  await expect(page.locator('.outfit-card')).toHaveCount(1);
  await expect(
    page.getByText(/Saved selections could not be read/),
  ).toBeVisible();
});

test('pending work keeps controls responsive and cannot restore obsolete results', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    let holdFirst = true;
    window.Worker = class extends NativeWorker {
      postMessage(message: unknown) {
        if (holdFirst) {
          holdFirst = false;
          (
            window as unknown as { releaseOutfitRequest: () => void }
          ).releaseOutfitRequest = () => super.postMessage(message);
        } else super.postMessage(message);
      }
    };
  });
  await page.goto('/quick-add');
  for (const type of ['T-shirt', 'Jeans', 'Sneakers']) await add(page, type);
  await page.goto('/outfits');
  const submit = page.getByRole('button', {
    name: 'Suggest outfits',
    exact: true,
  });
  await expect(submit).toBeEnabled();
  const initial = await submit.boundingBox();
  await submit.click();
  await expect(submit).toHaveAttribute('aria-busy', 'true');
  const busy = await submit.boundingBox();
  expect(busy?.width).toBe(initial?.width);
  expect(busy?.height).toBe(initial?.height);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page
    .getByRole('group', { name: 'Formality', exact: true })
    .getByRole('radio', { name: 'Formal', exact: true })
    .check();
  await suggest(page);
  await expect(
    page.getByRole('heading', { name: 'These filters need different pieces.' }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { releaseOutfitRequest: () => void }
    ).releaseOutfitRequest(),
  );
  await expect(page.locator('.outfit-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Try Any filters' }).click();
  await expect(page.locator('.outfit-card')).toHaveCount(1);
});

test('large generation stays in the production worker with bounded results', async ({
  page,
}, testInfo) => {
  let workerUrl = '';
  page.on('worker', (worker) => {
    workerUrl = worker.url();
  });
  await page.goto('/quick-add');
  for (const type of ['T-shirt', 'Jeans', 'Sneakers']) await add(page, type);
  await page.goto('/outfits');
  await suggest(page);
  await expect(page.locator('.outfit-card')).toHaveCount(1);
  expect(workerUrl).toBeTruthy();
  const measurement = await page.evaluate(async (url) => {
    const items = ['Tops', 'Bottoms', 'Shoes'].flatMap((group) =>
      Array.from({ length: 50 }, (_, index) => ({
        id: `${group}-${index}`,
        group,
        color: 'white',
        formality: 'Casual',
        seasons: ['Summer'],
        pattern: 'Solid',
        available: true,
      })),
    );
    let ticks = 0;
    const heartbeat = setInterval(() => ticks++, 1);
    const start = performance.now();
    const worker = new Worker(url);
    try {
      const response = await new Promise<{
        ok: boolean;
        candidates: unknown[];
        moreAvailable: boolean;
        diagnostics: { evaluations: number };
      }>((resolve, reject) => {
        worker.onerror = () => reject(new Error('Worker failed'));
        worker.onmessage = (event) => resolve(event.data.result);
        worker.postMessage({
          id: 1,
          request: {
            items,
            now: 0,
            filters: { season: 'Any', formality: 'Any' },
          },
        });
      });
      return { elapsedMs: performance.now() - start, ticks, response };
    } finally {
      clearInterval(heartbeat);
      worker.terminate();
    }
  }, workerUrl);
  expect(measurement.response.ok).toBe(true);
  expect(measurement.response.candidates).toHaveLength(3);
  expect(measurement.response.moreAvailable).toBe(true);
  expect(measurement.response.diagnostics.evaluations).toBe(50_000);
  expect(measurement.ticks).toBeGreaterThan(0);
  await testInfo.attach('worker-performance', {
    body: JSON.stringify({
      elapsedMs: measurement.elapsedMs,
      mainThreadTicks: measurement.ticks,
    }),
    contentType: 'application/json',
  });
});
