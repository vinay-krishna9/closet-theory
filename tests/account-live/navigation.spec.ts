import { expect, test } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { readJournal } from './fixtures';

test('back navigation cannot restore signed-out or previous-owner profile data', async ({
  page,
}) => {
  const { users } = await readJournal();
  await page.goto('/sign-in');
  await clerk.signIn({ page, emailAddress: users[0].email });
  await page.goto('/profile');
  const timezone = page.getByLabel('Your timezone');
  await expect(timezone).toBeEnabled();
  await timezone.fill('Europe/Berlin');
  await page.getByRole('button', { name: 'Save timezone' }).click();
  await expect(page.getByRole('status', { name: 'Profile saving' })).toHaveText(
    'Timezone saved.',
  );
  await page.goto('/wardrobe');
  await page.getByRole('link', { name: 'Open your profile' }).click();
  await expect(
    page.getByText(`Signed in as ${users[0].email}`, { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Sign in', exact: true }).first(),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByText(`Signed in as ${users[0].email}`, { exact: true }),
  ).toHaveCount(0);
  await expect(timezone).toHaveCount(0);
  await page.goto('/profile');
  await expect(
    page.getByRole('link', { name: 'Sign in to your account' }),
  ).toBeVisible();
  await page.goto('/sign-in');
  await clerk.signIn({ page, emailAddress: users[1].email });
  await page.goto('/profile');
  await expect(timezone).toBeEnabled();
  await timezone.fill('UTC');
  await page.getByRole('button', { name: 'Save timezone' }).click();
  await expect(page.getByRole('status', { name: 'Profile saving' })).toHaveText(
    'Timezone saved.',
  );
  await page.goBack();
  await expect(
    page.getByText(`Signed in as ${users[0].email}`, { exact: true }),
  ).toHaveCount(0);
  await page.goto('/profile');
  await expect(timezone).toHaveValue('UTC');
  await expect(
    page.getByText(`Signed in as ${users[1].email}`, { exact: true }),
  ).toBeVisible();
});
