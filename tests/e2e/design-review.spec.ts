import { expect, test } from '@playwright/test';

test('review navigation, preview states and empty-search recovery', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/design-review/wardrobe');
  await expect(page.locator('.design-review')).toHaveCSS(
    'background-color',
    'rgb(16, 18, 20)',
  );
  await expect(page.locator('.design-review')).toHaveCSS(
    'color-scheme',
    'dark',
  );
  await expect(
    page.getByRole('heading', { name: 'Your wardrobe', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Design review controls')).toContainText(
    'Illustrative data',
  );
  await page.screenshot({
    path: testInfo.outputPath('wardrobe.png'),
    fullPage: true,
  });
  await page.getByLabel('Search clothing').fill('nothing matches this');
  await expect(
    page.getByRole('heading', { name: 'No pieces found.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Clear filters', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'View Ivory T-shirt', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Preview state').selectOption('loading');
  await expect(
    page.getByRole('region', { name: 'Loading preview' }),
  ).toHaveAttribute('aria-busy', 'true');
  await page.getByLabel('Preview state').selectOption('error');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'couldn’t load',
  );
  await page.screenshot({
    path: testInfo.outputPath('wardrobe-error.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Retry preview' }).click();
  await expect(page.getByLabel('Preview state')).toHaveValue('populated');
  await page.getByLabel('Preview state').selectOption('empty');
  await expect(
    page.getByRole('heading', { name: 'Make room for what you love wearing.' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('wardrobe-empty.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Choose your first pieces' }).click();
  await expect(page).toHaveURL(/\/design-review\/quick-add$/);
  expect(errors).toEqual([]);
});

test('quick-add preview toggles are temporary and dialog restores keyboard focus', async ({
  page,
}, testInfo) => {
  await page.goto('/design-review/quick-add');
  await page.screenshot({
    path: testInfo.outputPath('quick-add.png'),
    fullPage: true,
  });
  const add = page
    .getByRole('button', { name: 'I own this', exact: true })
    .first();
  await add.click();
  await expect(
    page.getByRole('button', { name: 'Selected', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText('Nothing is saved');
  await page.getByRole('button', { name: 'Selected', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Selected', exact: true }),
  ).toHaveCount(0);
  const opener = page.getByRole('button', {
    name: 'View Navy T-shirt',
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'A darker neutral' }),
  ).toBeFocused();
  await expect(
    dialog.getByRole('button', { name: 'Navy', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Ivory', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: 'Ivory', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    dialog.getByText('Selected: Ivory', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(/Choose the closest color to your garment/),
  ).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Winter', exact: true }).check();
  await expect(
    dialog.getByRole('checkbox', { name: 'Summer', exact: true }),
  ).toBeChecked();
  await expect(
    dialog.getByRole('checkbox', { name: 'Winter', exact: true }),
  ).toBeChecked();
  await dialog.getByText('Customize the details', { exact: true }).click();
  const neckline = dialog.getByRole('group', {
    name: 'Neckline / collar',
    exact: true,
  });
  const vNeck = neckline.getByRole('radio', { name: 'V-neck', exact: true });
  await vNeck.focus();
  await page.keyboard.press('Space');
  await expect(vNeck).toBeChecked();
  await expect(
    neckline.getByRole('radio', { name: 'Crew neck', exact: true }),
  ).not.toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(
    neckline.getByRole('radio', { name: 'Collared', exact: true }),
  ).toBeChecked();
  const focusedOption = await neckline
    .getByRole('radio', { name: 'Collared', exact: true })
    .boundingBox();
  const drawerFooter = await dialog
    .locator('.review-detail-footer')
    .boundingBox();
  expect(focusedOption).not.toBeNull();
  expect(drawerFooter).not.toBeNull();
  expect(focusedOption!.y + focusedOption!.height).toBeLessThanOrEqual(
    drawerFooter!.y,
  );
  await neckline.screenshot({
    path: testInfo.outputPath('neckline-options.png'),
    scale: 'css',
  });
  await page.screenshot({
    path: testInfo.outputPath('customize.png'),
    fullPage: false,
    scale: 'css',
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Selected', exact: true }),
  ).toHaveCount(0);
});

test('outfit examples disclose their source, respect jacket boundary and recover from no examples', async ({
  page,
}, testInfo) => {
  await page.goto('/design-review/outfits');
  await expect(page.getByText('hand-composed for review')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.screenshot({
    path: testInfo.outputPath('outfits.png'),
    fullPage: true,
  });
  const filters = page.getByRole('button', { name: 'Filters', exact: true });
  const season = page.getByRole('group', { name: 'Season', exact: true });
  const formality = page.getByRole('group', { name: 'Formality', exact: true });
  await expect(filters).toHaveAttribute('aria-expanded', 'false');
  await expect(season).not.toBeVisible();
  await filters.focus();
  await page.keyboard.press('Enter');
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(season).toBeVisible();
  const seasonBox = await season.boundingBox();
  const formalityBox = await formality.boundingBox();
  expect(seasonBox!.y + seasonBox!.height).toBeLessThan(formalityBox!.y);
  await page.screenshot({
    path: testInfo.outputPath('outfit-filters-expanded.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Show more examples' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('img', { name: 'Olive jacket' })).toHaveCount(0);
  await page
    .getByRole('group', { name: 'Season', exact: true })
    .getByRole('radio', { name: 'Autumn', exact: true })
    .check();
  await expect(page.getByRole('img', { name: 'Olive jacket' })).toBeVisible();
  await filters.click();
  await expect(season).not.toBeVisible();
  await expect(page.locator('.review-filter-summary')).toContainText('Autumn');
  await filters.focus();
  await page.keyboard.press('Space');
  await expect(
    season.getByRole('radio', { name: 'Autumn', exact: true }),
  ).toBeChecked();

  await page
    .getByRole('group', { name: 'Formality', exact: true })
    .getByRole('radio', { name: 'Formal', exact: true })
    .check();
  await expect(
    page.getByRole('heading', { name: 'No examples for these filters.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Clear filters', exact: true })
    .click();
  await expect(
    page
      .getByRole('group', { name: 'Season', exact: true })
      .getByRole('radio', { name: 'Any', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Favorite', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'I wore this', exact: true }),
  ).toHaveCount(0);
});

test('review screens reflow at the design breakpoints with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const screen of ['wardrobe', 'quick-add', 'outfits']) {
    await page.goto(`/design-review/${screen}`);
    if (screen === 'outfits')
      await page.getByRole('button', { name: 'Filters', exact: true }).click();
    for (const width of [320, 390, 767, 768, 1023, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${screen} at ${width}px`,
      ).toBe(true);
      await expect(
        page.getByRole('navigation', { name: 'Mobile visitor navigation' }),
      ).toBeVisible({ visible: width < 768 });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  }
});
