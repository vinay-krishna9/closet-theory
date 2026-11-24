import { expect, test } from '@playwright/test';

test('real main-app sign-in and signup forms render; cancellation keeps visitor clothing', async ({
  page,
}, testInfo) => {
  await page.goto('/quick-add');
  await page
    .getByRole('article', { name: 'T-shirt catalog item', exact: true })
    .getByRole('button', { name: 'I own this', exact: true })
    .click();
  await page.goto('/wardrobe');
  const saved = await page.evaluate(() =>
    localStorage.getItem('closet-theory.visitor-wardrobe'),
  );
  expect(saved).toBeTruthy();
  await page
    .getByRole('link', { name: 'Sign in', exact: true })
    .first()
    .click();
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
  expect(
    (await page.getByRole('button', { name: /Google/ }).boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: testInfo.outputPath('sign-in.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Back to your wardrobe' }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('closet-theory.visitor-wardrobe'),
    ),
  ).toBe(saved);
  await page.goto('/sign-up');
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible({
    timeout: 30000,
  });
});

test('signed-out and invalid-token main-app requests reveal no account data', async ({
  page,
  request,
}) => {
  for (const path of [
    '/api/account/session',
    '/api/account/profile',
    '/api/account/wardrobe',
  ]) {
    expect((await request.get(path)).status()).toBe(401);
    const altered = await request.get(path, {
      headers: { Authorization: 'Bearer deliberately-altered.fixture.token' },
    });
    expect([401, 403]).toContain(altered.status());
    expect(altered.headers()['cache-control']).toContain('no-store');
  }
  await page.goto('/profile');
  const transfer = await request.post('/api/account/import', {
    data: { owner_id: 'user_other', items: [] },
  });
  expect(transfer.status()).toBe(401);
  expect(transfer.headers()['cache-control']).toContain('no-store');
  const wardrobe = await request.post('/api/account/wardrobe', {
    data: { action: 'remove', owner_id: 'user_other' },
  });
  expect(wardrobe.status()).toBe(401);
  expect(wardrobe.headers()['cache-control']).toContain('no-store');
  await expect(
    page.getByRole('link', { name: 'Sign in to your account' }),
  ).toBeVisible();
  await expect(page.getByLabel('Your timezone')).toHaveCount(0);
});
