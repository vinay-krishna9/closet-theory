import { expect, test } from '@playwright/test';

test('entry page is honest, accessible by keyboard, and stays on the local origin', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4174')
      externalRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Closet Theory');
  await expect(
    page.getByRole('region', { name: 'In development' }),
  ).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('entry-page.png'),
    fullPage: true,
  });
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('region', { name: 'In development' }),
  ).toBeVisible();
});

test('missing routes return 404 and provide a working route home', async ({
  page,
}) => {
  const response = await page.goto('/not-a-real-page');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return to Closet Theory' }).click();
  await expect(
    page.getByRole('region', { name: 'In development' }),
  ).toBeVisible();
});
