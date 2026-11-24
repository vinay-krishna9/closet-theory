import { expect, test, type Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { randomUUID } from 'node:crypto';
import { defaultGarment } from '../../src/features/wardrobe/model';
import { clerkApi, directClient, readJournal } from '../account-live/fixtures';

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
      expect(error).toBeNull();
    }
  }
}
async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await clerk.signIn({ page, emailAddress: email });
  await expect(page).toHaveURL(/\/profile(?:[?#].*)?$/);
}
async function addShirt(page: Page) {
  await page.goto('/quick-add');
  const card = page.getByRole('article', {
    name: 'T-shirt catalog item',
    exact: true,
  });
  await card.getByRole('button', { name: 'I own this', exact: true }).click();
  await expect(
    card.getByRole('link', { name: 'In wardrobe', exact: true }),
  ).toBeVisible();
  await page.goto('/wardrobe');
  await expect(page.getByRole('article')).toHaveCount(1);
}
test.beforeEach(clearRows);
test.afterEach(clearRows);

test('a stale editor requires explicit review and pending responses cannot survive sign-out', async ({
  page,
  browser,
  baseURL,
}) => {
  const { users } = await readJournal();
  await signIn(page, users[0].email);
  await addShirt(page);
  await page
    .getByRole('button', { name: 'Edit clothing', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Garment name').fill('My retained draft');
  const second = await browser.newContext({ baseURL });
  try {
    const other = await second.newPage();
    await signIn(other, users[0].email);
    await other.goto('/wardrobe');
    await other
      .getByRole('button', { name: 'Edit clothing', exact: true })
      .click();
    await other.getByLabel('Garment name').fill('Other saved version');
    await other
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(other.getByRole('dialog')).not.toBeVisible();
    await dialog
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(
      dialog.getByRole('region', {
        name: 'Latest saved clothing',
        exact: true,
      }),
    ).toBeVisible();
    await expect(dialog).toContainText('Other saved version');
    await expect(dialog.getByLabel('Garment name')).toHaveValue(
      'My retained draft',
    );
    await expect(
      dialog.getByRole('button', { name: 'Save changes', exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole('button', {
        name: 'Save my draft over this version',
        exact: true,
      })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('article', { name: 'My retained draft', exact: true }),
    ).toBeVisible();

    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route('**/api/account/wardrobe', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      requested = true;
      await held;
      await route.fulfill({ response }).catch(() => {});
    });
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect.poll(() => requested).toBe(true);
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'Sign in', exact: true }).last(),
      ).toBeVisible();
      release();
      await expect(
        page.getByRole('article', { name: 'My retained draft', exact: true }),
      ).toHaveCount(0);
      await page.unroute('**/api/account/wardrobe');
      await signIn(page, users[1].email);
      await page.goto('/wardrobe');
      await expect(
        page.getByText('Make room for what you love wearing.'),
      ).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(0);
    } finally {
      release();
    }
  } finally {
    await second.close();
  }
});

test('catalog CRUD survives reload and a second context, with accessible editor focus and stable removal', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const { users } = await readJournal();
  await signIn(page, users[0].email);
  await page.goto('/wardrobe');
  await expect(
    page.getByText('Make room for what you love wearing.'),
  ).toBeVisible();
  await addShirt(page);
  await page.getByLabel('Search clothing').fill('shirt');
  const edit = page.getByRole('button', { name: 'Edit clothing', exact: true });
  await edit.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Garment name').fill('Fixture shirt');
  await expect(
    dialog.getByRole('button', { name: 'Save changes', exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('fixture-editor.png'),
    fullPage: false,
    animations: 'disabled',
  });
  await dialog
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(edit).toBeFocused();
  await expect(page.getByLabel('Search clothing')).toHaveValue('shirt');
  await expect(
    page.getByRole('article', { name: 'Fixture shirt', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('article', { name: 'Fixture shirt', exact: true }),
  ).toBeVisible();
  const second = await browser.newContext({ baseURL });
  try {
    const other = await second.newPage();
    await signIn(other, users[0].email);
    await other.goto('/wardrobe');
    await expect(
      other.getByRole('article', { name: 'Fixture shirt', exact: true }),
    ).toBeVisible();
    await other.getByRole('button', { name: 'Remove', exact: true }).click();
    await other
      .getByRole('button', { name: 'Remove clothing', exact: true })
      .click();
    await expect(other.getByRole('article')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(0);
    const db = directClient(await tokenFor(users[0].id));
    const rows = await db
      .from('wardrobe_items')
      .select('id, removed_at, revision')
      .retry(false);
    expect(rows.error).toBeNull();
    expect(rows.data).toHaveLength(1);
    expect(rows.data![0].removed_at).not.toBeNull();
    expect(rows.data![0].revision).toBe(3);
  } finally {
    await second.close();
  }
});

test('a committed save with a lost response retains the draft and retries one operation', async ({
  page,
}) => {
  const { users } = await readJournal();
  await signIn(page, users[0].email);
  await addShirt(page);
  const operations: string[] = [];
  let lose = true;
  await page.route('**/api/account/wardrobe', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    operations.push(route.request().postDataJSON().operationId);
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (lose) await route.abort('failed');
    else await route.fulfill({ response });
  });
  await page
    .getByRole('button', { name: 'Edit clothing', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Garment name').fill('Retry fixture');
  await dialog
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toContainText('retry safely');
  await expect(dialog.getByLabel('Garment name')).toHaveValue('Retry fixture');
  lose = false;
  await dialog
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(operations).toHaveLength(2);
  expect(new Set(operations).size).toBe(1);
  const rows = await directClient(await tokenFor(users[0].id))
    .from('wardrobe_items')
    .select('revision')
    .retry(false);
  expect(rows.data).toEqual([{ revision: 2 }]);
  const stored = await page.evaluate(() =>
    localStorage.getItem('closet-theory.visitor-wardrobe'),
  );
  expect(stored ?? '').not.toContain('Retry fixture');
});

test('real API and RLS reject foreign IDs and stale edits without changing another owner', async ({
  browser,
  request,
  baseURL,
}) => {
  const { users } = await readJournal();
  const contexts = await Promise.all(
    users.map(() => browser.newContext({ baseURL })),
  );
  try {
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
    const post = (body: unknown, owner = 0) =>
      request.post(`${baseURL}/api/account/wardrobe`, {
        headers: { Authorization: `Bearer ${tokens[owner]}` },
        data: body,
      });
    const item = { ...defaultGarment('tshirt'), id: randomUUID() };
    const add = {
      action: 'add',
      expectedOwner: users[0].id,
      expectedRevision: null,
      separate: false,
      timezone: 'UTC',
      operationId: randomUUID(),
      item,
    };
    expect((await post(add)).status()).toBe(200);
    expect((await post(add)).status()).toBe(200);
    expect((await post(add, 1)).status()).toBe(409);
    const update = {
      ...add,
      action: 'update',
      expectedRevision: 1,
      operationId: randomUUID(),
      item: { ...item, name: 'Updated fixture' },
    };
    expect((await post(update)).status()).toBe(200);
    expect(
      (await post({ ...update, operationId: randomUUID() })).status(),
    ).toBe(409);
    expect(
      (
        await post(
          { ...update, expectedOwner: users[1].id, operationId: randomUUID() },
          1,
        )
      ).status(),
    ).toBe(404);
    const foreign = directClient(tokens[1]);
    expect(
      (
        await foreign
          .from('wardrobe_items')
          .select('id')
          .eq('id', item.id)
          .retry(false)
      ).data,
    ).toEqual([]);
    expect(
      (await foreign.from('wardrobe_mutations').select('id').retry(false)).data,
    ).toEqual([]);
    const forged = await foreign
      .from('wardrobe_mutations')
      .insert({
        owner_id: users[1].id,
        id: randomUUID(),
        item_id: item.id,
        payload_hash: 'a'.repeat(64),
        matched: false,
      })
      .retry(false);
    expect(forged.error).not.toBeNull();
    const owned = await directClient(tokens[0])
      .from('wardrobe_items')
      .select('id,revision,name')
      .retry(false);
    expect(owned.data).toEqual([
      { id: item.id, revision: 2, name: 'Updated fixture' },
    ]);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
