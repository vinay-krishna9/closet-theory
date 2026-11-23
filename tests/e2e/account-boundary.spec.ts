import { expect, test } from '@playwright/test';

test('visitor-only environment never permits private profile operations', async ({
  request,
}) => {
  for (const endpoint of ['/api/account/session', '/api/account/profile']) {
    const response = await request.get(endpoint);
    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toContain('no-store');
  }
  const save = await request.patch('/api/account/profile', {
    data: { timezone: 'UTC', owner_id: 'user_other' },
  });
  expect(save.status()).toBe(401);
});

test('unconfigured account entry preserves visitor browsing and exposes no private form', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(
    page.getByText('Account access is not configured', { exact: false }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to your wardrobe' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your wardrobe', exact: true }),
  ).toBeVisible();
});
