import { expect, test } from '@playwright/test';

test('anonymous requests are denied without exposing an identity', async ({
  request,
}) => {
  const response = await request.get('/api/session');
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ authenticated: false });
  expect(response.headers()['cache-control']).toContain('no-store');
});

test('signed-out controls and recovery work at this viewport', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Signed out.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check server session' }).click();
  await expect(
    page.getByRole('status'),
  ).toHaveText('Access denied. Sign in to verify your session.');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
});

test('signup renders the configured email and Google options', async ({
  page,
}) => {
  await page.goto('/sign-up');
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
});
