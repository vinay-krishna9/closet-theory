import { expect, test, type Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { randomUUID } from 'node:crypto';
import { defaultGarment } from '../../src/features/wardrobe/model';
import { clerkApi, directClient, readJournal } from '../account-live/fixtures';

const clothes = [
  { ...defaultGarment('tshirt'), id: 'selected-shirt' },
  { ...defaultGarment('sneakers'), id: 'selected-shoes' },
];
async function tokenFor(userId: string) {
  const session = await clerkApi('sessions', 'POST', { user_id: userId });
  return (await clerkApi(`sessions/${session.id}/tokens`, 'POST'))
    .jwt as string;
}
async function clearRows() {
  const { users } = await readJournal();
  for (const user of users) {
    const db = directClient(await tokenFor(user.id));
    for (const table of [
      'wardrobe_mutations',
      'visitor_import_items',
      'visitor_imports',
      'wardrobe_items',
      'account_profiles',
    ]) {
      const { error } = await db
        .from(table)
        .delete()
        .eq('owner_id', user.id)
        .retry(false);
      expect(
        error === null ||
          (table === 'wardrobe_mutations' && error.code === 'PGRST205'),
      ).toBe(true);
    }
  }
}
async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await clerk.signIn({ page, emailAddress: email });
  await expect(page).toHaveURL(/\/profile(?:[?#].*)?$/);
}
test.beforeEach(clearRows);
test.afterEach(clearRows);

test('actual import survives a lost response, retries once and stays saved after refresh', async ({
  page,
}, testInfo) => {
  const { users } = await readJournal();
  await page.goto('/quick-add');
  for (const article of ['T-shirt catalog item', 'Sneakers catalog item'])
    await page
      .getByRole('article', { name: article, exact: true })
      .getByRole('button', { name: 'I own this', exact: true })
      .click();
  const operations: string[] = [];
  let loseResponse = true;
  await page.route('**/api/account/import', async (route) => {
    operations.push(route.request().postDataJSON().operationId);
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (loseResponse) await route.abort('failed');
    else await route.fulfill({ response });
  });
  await signIn(page, users[0].email);
  await expect(
    page.getByRole('button', { name: 'Retry clothing transfer' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('closet-theory.visitor-wardrobe'),
    ),
  ).toBeTruthy();
  const db = directClient(await tokenFor(users[0].id));
  expect(
    (await db.from('wardrobe_items').select('id').retry(false)).data?.length,
  ).toBe(2);
  loseResponse = false;
  await page.getByRole('button', { name: 'Retry clothing transfer' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Wardrobe transfer' }),
  ).toContainText('2 visitor selections are saved');
  expect(operations.length).toBeGreaterThanOrEqual(2);
  expect(new Set(operations).size).toBe(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('closet-theory.visitor-wardrobe'),
    ),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('fixture-import.png'),
    fullPage: true,
  });
  await page.reload();
  expect(
    (await db.from('wardrobe_items').select('id').retry(false)).data?.length,
  ).toBe(2);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('closet-theory.visitor-import'),
    ),
  ).toBeNull();
});

test('same-origin tabs share an operation and cannot duplicate a concurrent transfer', async ({
  page,
  context,
}) => {
  const { users } = await readJournal();
  await signIn(page, users[0].email);
  await page.evaluate(
    (items) =>
      localStorage.setItem(
        'closet-theory.visitor-wardrobe',
        JSON.stringify({ version: 1, items }),
      ),
    clothes,
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const operations: string[] = [];
  await context.route('**/api/account/import', async (route) => {
    operations.push(route.request().postDataJSON().operationId);
    if (operations.length === 2) release();
    await ready;
    await route.continue();
  });
  const second = await context.newPage();
  await Promise.all([page.reload(), second.goto('/profile')]);
  await expect.poll(() => operations.length).toBe(2);
  expect(new Set(operations).size).toBe(1);
  await expect
    .poll(
      async () =>
        (
          await directClient(await tokenFor(users[0].id))
            .from('wardrobe_items')
            .select('id')
            .retry(false)
        ).data?.length,
    )
    .toBe(2);
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem('closet-theory.visitor-wardrobe'),
      ),
    )
    .toBeNull();
  await Promise.all([page.reload(), second.reload()]);
  expect(
    (
      await directClient(await tokenFor(users[0].id))
        .from('visitor_imports')
        .select('id')
        .retry(false)
    ).data?.length,
  ).toBe(1);
  await second.close();
});

test('real API and direct RLS enforce replay, exact-match multiplicity and owner boundaries', async ({
  request,
  baseURL,
  browser,
}) => {
  const { users } = await readJournal();
  const contexts = await Promise.all(
    users.map(() => browser.newContext({ baseURL })),
  );
  try {
    // The app accepts tokens issued for its trusted browser origin, not generic
    // backend fixture tokens. Keep the HTTP requests themselves cookie-free.
    const tokens = await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        await signIn(page, users[index].email);
        await expect(page.getByLabel('Your timezone')).toBeEnabled();
        return page.evaluate(async () =>
          (
            window as unknown as {
              Clerk: { session: { getToken: () => Promise<string> } };
            }
          ).Clerk.session.getToken(),
        );
      }),
    );
    const db = directClient(tokens[0]);
    const operationId = randomUUID();
    const payload = {
      expectedOwner: users[0].id,
      operationId,
      timezone: 'UTC',
      items: [clothes[0]],
    };
    const post = (body: unknown, index = 0) =>
      request.post(`${baseURL}/api/account/import`, {
        headers: { Authorization: `Bearer ${tokens[index]}` },
        data: body,
      });
    const first = await post(payload);
    expect(first.status()).toBe(200);
    const receipt = await first.json();
    expect((await post(payload)).status()).toBe(200);
    expect(await (await post(payload)).json()).toEqual(receipt);
    expect(
      (
        await post({
          ...payload,
          items: [{ ...clothes[0], name: 'Changed payload' }],
        })
      ).status(),
    ).toBe(409);
    expect((await post(payload, 1)).status()).toBe(409);
    const duplicates = await post({
      ...payload,
      operationId: randomUUID(),
      items: [clothes[0], { ...clothes[0], id: 'distinct-second-shirt' }],
    });
    expect(duplicates.status()).toBe(200);
    const result = await duplicates.json();
    expect(result.imported).toBe(1);
    expect(result.matched).toBe(1);
    expect(
      new Set(
        result.mappings.map((mapping: { itemId: string }) => mapping.itemId),
      ).size,
    ).toBe(2);
    const foreign = directClient(tokens[1]);
    expect(
      (
        await foreign
          .from('visitor_import_items')
          .select('item_id')
          .retry(false)
      ).data,
    ).toEqual([]);
    expect(
      (
        await foreign
          .from('visitor_import_items')
          .insert({
            owner_id: users[0].id,
            import_id: operationId,
            selection_id: 'forged',
            item_id: receipt.mappings[0].itemId,
          })
          .retry(false)
      ).error !== null,
    ).toBe(true);
    expect(
      (await db.from('wardrobe_items').select('id').retry(false)).data?.length,
    ).toBe(2);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
