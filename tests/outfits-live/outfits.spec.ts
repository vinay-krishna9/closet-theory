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
  for (const user of (await readJournal()).users) {
    const db = directClient(await tokenFor(user.id));
    for (const table of [
      'wardrobe_mutations',
      'visitor_import_items',
      'visitor_imports',
      'wardrobe_items',
      'account_profiles',
    ])
      expect(
        (await db.from(table).delete().eq('owner_id', user.id).retry(false))
          .error,
      ).toBeNull();
  }
}
async function seed(index: number, tops: number) {
  const user = (await readJournal()).users[index];
  const db = directClient(await tokenFor(user.id));
  expect(
    (
      await db
        .from('account_profiles')
        .upsert({ owner_id: user.id, timezone: 'UTC' })
        .retry(false)
    ).error,
  ).toBeNull();
  const rows = [
    ...Array.from({ length: tops }, () => defaultGarment('tshirt')),
    defaultGarment('jeans'),
    defaultGarment('sneakers'),
  ].map((x, i) => ({
    id: randomUUID(),
    owner_id: user.id,
    name: `Fixture ${index} clothing ${i}`,
    type_id: x.typeId,
    color: x.color,
    formality: x.formality,
    seasons: x.seasons,
    pattern: x.pattern,
    neckline: x.neckline ?? null,
    sleeves: x.sleeves ?? null,
  }));
  expect(
    (await db.from('wardrobe_items').insert(rows).retry(false)).error,
  ).toBeNull();
  return { db, rows };
}
async function signIn(page: Page, index = 0) {
  await page.goto('/sign-in');
  await clerk.signIn({
    page,
    emailAddress: (await readJournal()).users[index].email,
  });
  await expect(page).toHaveURL(/\/profile(?:[?#].*)?$/);
}
async function browserToken(page: Page) {
  return page.evaluate(async () =>
    (
      window as unknown as {
        Clerk: { session: { getToken: () => Promise<string> } };
      }
    ).Clerk.session.getToken(),
  );
}
async function suggest(page: Page) {
  await page
    .getByRole('button', { name: 'Suggest outfits', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Suggest outfits', exact: true }),
  ).toBeEnabled();
}
test.beforeEach(clearRows);
test.afterEach(clearRows);

test('fewer, exactly six and more than six use persisted clothes, distinct pages and reload', async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const count of [1, 6, 8]) {
    await clearRows();
    await seed(0, count);
    await page.goto('/outfits');
    await suggest(page);
    const cards = page.locator('.outfit-card');
    await expect(cards).toHaveCount(Math.min(count, 6));
    await expect(
      page.getByRole('region', { name: 'Account benefits' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /Favorite|Not for me|I wore this/ }),
    ).toHaveCount(0);
    if (count > 6) {
      const more = page.getByRole('button', { name: 'Show more', exact: true });
      await more.focus();
      await page.keyboard.press('Enter');
      await expect(cards).toHaveCount(8);
      await expect(cards.nth(6).getByRole('heading')).toBeFocused();
      await expect(more).toHaveCount(0);
      expect(
        new Set(
          await cards.evaluateAll((elements) =>
            elements.map((x) => x.getAttribute('data-outfit-id')),
          ),
        ).size,
      ).toBe(8);
      await cards.first().scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath('fixture-outfits.png'),
        animations: 'disabled',
      });
      await cards.first().screenshot({
        path: testInfo.outputPath('fixture-card.png'),
        animations: 'disabled',
      });
    } else
      await expect(
        page.getByRole('button', { name: 'Show more', exact: true }),
      ).toHaveCount(0);
    const identities = await cards.evaluateAll((elements) =>
      elements.map((x) => x.getAttribute('data-outfit-id')),
    );
    await page.reload();
    await suggest(page);
    expect(
      await cards.evaluateAll((elements) =>
        elements.map((x) => x.getAttribute('data-outfit-id')),
      ),
    ).toEqual(identities.slice(0, 6));
  }
});

test('paging failure preserves results, removal invalidates the snapshot and filters recover with Any', async ({
  page,
}) => {
  const { db, rows } = await seed(0, 8);
  await signIn(page);
  await page.goto('/outfits');
  await suggest(page);
  let fail = true;
  await page.route('**/api/account/outfits', async (route) => {
    if (fail && route.request().postDataJSON().offset === 6)
      await route.fulfill({
        status: 503,
        json: { code: 'suggestions_unavailable' },
      });
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Retry more outfits', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.outfit-card')).toHaveCount(6);
  fail = false;
  expect(
    (
      await db
        .from('wardrobe_items')
        .update({ removed_at: new Date().toISOString(), revision: 2 })
        .eq('id', rows[0].id)
        .retry(false)
    ).error,
  ).toBeNull();
  await page
    .getByRole('button', { name: 'Retry more outfits', exact: true })
    .click();
  await expect(
    page.getByText('Your wardrobe changed.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.outfit-card')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Retry suggestions', exact: true })
    .click();
  await expect(page.locator('.outfit-card')).toHaveCount(6);
  expect(
    (
      await page
        .locator('.outfit-card')
        .evaluateAll((elements) =>
          elements.map((x) => x.getAttribute('data-outfit-id')),
        )
    ).join(),
  ).not.toContain(rows[0].id);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('radio', { name: 'Formal', exact: true }).check();
  await expect(page.locator('.outfit-card')).toHaveCount(0);
  await suggest(page);
  await expect(
    page.getByRole('heading', { name: 'These filters need different pieces.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Try Any filters', exact: true })
    .click();
  await expect(page.locator('.outfit-card')).toHaveCount(6);
});

test('actual authenticated API binds filters, item membership and page snapshots to their owner', async ({
  browser,
  request,
  baseURL,
}) => {
  const a = await seed(0, 8),
    b = await seed(1, 1);
  const contexts = await Promise.all([
    browser.newContext({ baseURL }),
    browser.newContext({ baseURL }),
  ]);
  try {
    const tokens = await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        await signIn(page, index);
        return browserToken(page);
      }),
    );
    const users = (await readJournal()).users;
    const post = (body: unknown, index = 0) =>
      request.post(`${baseURL}/api/account/outfits`, {
        headers: { Authorization: `Bearer ${tokens[index]}` },
        data: body,
      });
    const input = {
      expectedOwner: users[0].id,
      filters: { season: 'Any', formality: 'Any' },
      offset: 0,
      snapshot: null,
    };
    const firstResponse = await post(input);
    expect(firstResponse.status()).toBe(200);
    const first = await firstResponse.json();
    expect(first.candidates).toHaveLength(6);
    expect(first.items.map((x: { id: string }) => x.id).sort()).toEqual(
      a.rows.map((x) => x.id).sort(),
    );
    const next = { ...input, snapshot: first.snapshot, offset: 6 };
    expect((await post(next, 1)).status()).toBe(409);
    expect(
      (await post({ ...next, expectedOwner: users[1].id }, 1)).status(),
    ).toBe(409);
    expect(
      (await post({ ...input, itemIds: a.rows.map((x) => x.id) }, 1)).status(),
    ).toBe(400);
    const own = await (
      await post({ ...input, expectedOwner: users[1].id }, 1)
    ).json();
    expect(own.items.map((x: { id: string }) => x.id).sort()).toEqual(
      b.rows.map((x) => x.id).sort(),
    );
    expect(
      (
        await post({ ...next, filters: { season: 'Winter', formality: 'Any' } })
      ).status(),
    ).toBe(409);
    expect(
      (
        await request.post(`${baseURL}/api/account/outfits`, { data: input })
      ).status(),
    ).toBe(401);
    const foreign = await b.db
      .from('wardrobe_items')
      .select('id')
      .in(
        'id',
        a.rows.map((x) => x.id),
      )
      .retry(false);
    expect(foreign.data).toEqual([]);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test('pending generation cannot survive changed filters, sign-out or a different account', async ({
  page,
}) => {
  await seed(0, 8);
  await seed(1, 1);
  await signIn(page);
  await page.goto('/outfits');
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route('**/api/account/outfits', async (route) => {
    const response = await route.fetch();
    requested = true;
    await held;
    await route.fulfill({ response }).catch(() => {});
  });
  try {
    await page
      .getByRole('button', { name: 'Suggest outfits', exact: true })
      .click();
    await expect.poll(() => requested).toBe(true);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('radio', { name: 'Winter', exact: true }).check();
    await expect(page.locator('.outfit-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'Sign in', exact: true }).last(),
    ).toBeVisible();
    release();
    await page.unroute('**/api/account/outfits');
    await signIn(page, 1);
    await page.goto('/outfits');
    await suggest(page);
    await expect(page.locator('.outfit-card')).toHaveCount(1);
    await expect(page.locator('.outfit-card')).not.toContainText(
      'Fixture 0 clothing',
    );
  } finally {
    release();
  }
});
