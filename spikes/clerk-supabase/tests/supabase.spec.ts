import { expect, test } from '@playwright/test';

test('anonymous Supabase probe is private and denied', async ({ request }) => {
  const response = await request.get('/api/supabase');
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ code: 'sign_in_required' });
  expect(response.headers()['cache-control']).toBe('private, no-store');
});

test('signed-out browser gets a useful Supabase sign-in prompt', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Supabase connection' });
  await section
    .getByRole('button', { name: 'Check Supabase connection' })
    .click();
  await expect(section.getByRole('status')).toHaveText(
    'Sign in before checking Supabase.',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
