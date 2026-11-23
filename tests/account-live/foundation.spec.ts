import { devices, expect, test } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { randomUUID } from 'node:crypto';
import {
  clerkApi,
  directClient,
  loadConfiguration,
  readJournal,
} from './fixtures';

test('real profile, owner-safe relationships and independently expired tokens', async ({
  browser,
  baseURL,
  playwright,
}, testInfo) => {
  loadConfiguration();
  const { users } = await readJournal();
  const device =
    testInfo.project.name === 'mobile'
      ? devices['Pixel 7']
      : devices['Desktop Chrome'];
  const contexts = await Promise.all(
    users.map(() => browser.newContext(device)),
  );
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  const tokens: string[] = [];
  const batches = users.map(() => randomUUID());
  try {
    for (const [index, page] of pages.entries()) {
      if (index === 0) {
        await page.goto(`${baseURL}/quick-add`);
        await page
          .getByRole('article', { name: 'T-shirt catalog item', exact: true })
          .getByRole('button', { name: 'I own this', exact: true })
          .click();
      }
      await page.goto(`${baseURL}/sign-in`);
      await clerk.signIn({ page, emailAddress: users[index].email });
      await page.goto(`${baseURL}/profile`);
      const timezone = page.getByLabel('Your timezone');
      await expect(timezone).toBeEnabled();
      await timezone.fill(index === 0 ? 'Europe/Berlin' : 'UTC');
      await page.getByRole('button', { name: 'Save timezone' }).click();
      await expect(page.getByRole('status')).toHaveText('Timezone saved.');
      const token = await page.evaluate(async () =>
        (
          window as unknown as {
            Clerk: { session: { getToken: () => Promise<string> } };
          }
        ).Clerk.session.getToken(),
      );
      tokens.push(token);
      const db = directClient(token);
      expect(
        (
          await db
            .from('wardrobe_items')
            .insert({
              id: users[index].rowId,
              name: users[index].label,
              type_id: 'tshirt',
              color: 'white',
              formality: 'Casual',
              seasons: ['Summer'],
              pattern: 'Solid',
              neckline: 'Crew neck',
              sleeves: 'Short sleeves',
            })
            .retry(false)
        ).error === null,
      ).toBe(true);
      expect(
        (
          await db
            .from('visitor_imports')
            .insert({ id: batches[index], payload_hash: 'a'.repeat(64) })
            .retry(false)
        ).error === null,
      ).toBe(true);
    }
    for (const [index, token] of tokens.entries()) {
      const db = directClient(token);
      const peer = users[1 - index];
      const own = users[index];
      expect(
        (await db.from('account_profiles').select('owner_id').retry(false))
          .data,
      ).toEqual([{ owner_id: own.id }]);
      expect(
        (
          await db
            .from('wardrobe_items')
            .select('id')
            .eq('id', peer.rowId)
            .retry(false)
        ).data,
      ).toEqual([]);
      expect(
        (
          await db
            .from('account_profiles')
            .update({ timezone: 'UTC' })
            .eq('owner_id', peer.id)
            .select('owner_id')
            .retry(false)
        ).data,
      ).toEqual([]);
      const mapping = await db
        .from('visitor_import_items')
        .insert({
          import_id: batches[index],
          selection_id: randomUUID(),
          item_id: peer.rowId,
        })
        .retry(false);
      expect(mapping.error?.code === '23503').toBe(true);
      expect(
        (
          await db
            .from('visitor_import_items')
            .insert({
              import_id: batches[index],
              selection_id: randomUUID(),
              item_id: own.rowId,
            })
            .retry(false)
        ).error === null,
      ).toBe(true);
      const forged = await pages[index].request.patch(
        `${baseURL}/api/account/profile`,
        {
          headers: { Origin: baseURL! },
          data: { timezone: 'UTC', owner_id: peer.id },
        },
      );
      expect(forged.status()).toBe(400);
    }
    const secondUser = await clerkApi(`users/${users[1].id}`);
    const emailId = secondUser.primary_email_address_id;
    try {
      await clerkApi(`email_addresses/${emailId}`, 'PATCH', {
        verified: false,
      });
      const sessionId = JSON.parse(
        Buffer.from(tokens[1].split('.')[1], 'base64url').toString(),
      ).sid;
      const unverified = await clerkApi(`sessions/${sessionId}/tokens`, 'POST');
      const payload = JSON.parse(
        Buffer.from(unverified.jwt.split('.')[1], 'base64url').toString(),
      );
      expect(payload.email_verified).toBe(false);
      const isolated = await playwright.request.newContext();
      try {
        expect(
          (
            await isolated.get(`${baseURL}/api/account/profile`, {
              headers: { Authorization: `Bearer ${unverified.jwt}` },
            })
          ).status(),
        ).toBe(403);
        const read = await directClient(unverified.jwt)
          .from('account_profiles')
          .select('owner_id')
          .retry(false);
        expect(read.data).toEqual([]);
        const write = await directClient(unverified.jwt)
          .from('wardrobe_items')
          .insert({
            id: randomUUID(),
            owner_id: users[1].id,
            name: 'ACCOUNT-01 unverified',
            type_id: 'tshirt',
            color: 'white',
            formality: 'Casual',
            seasons: ['Summer'],
            pattern: 'Solid',
          })
          .retry(false);
        expect(write.error !== null).toBe(true);
      } finally {
        await isolated.dispose();
      }
    } finally {
      await clerkApi(`email_addresses/${emailId}`, 'PATCH', { verified: true });
    }
    expect(
      (
        await directClient(null)
          .from('account_profiles')
          .select('owner_id')
          .retry(false)
      ).error !== null,
    ).toBe(true);
    // Cookie-free requests prevent a valid browser session from masking bad/expired tokens.
    const independent = await playwright.request.newContext();
    try {
      const segments = tokens[0].split('.');
      segments[2] = (segments[2][0] === 'A' ? 'B' : 'A') + segments[2].slice(1);
      const altered = segments.join('.');
      expect(
        (
          await independent.get(`${baseURL}/api/account/profile`, {
            headers: { Authorization: `Bearer ${altered}` },
          })
        ).status(),
      ).toBe(401);
      expect(
        (
          await directClient(altered)
            .from('account_profiles')
            .select('owner_id')
            .retry(false)
        ).error !== null,
      ).toBe(true);
      const payload = JSON.parse(
        Buffer.from(tokens[0].split('.')[1], 'base64url').toString(),
      );
      await pages[0].waitForTimeout(
        Math.max(0, payload.exp * 1000 - Date.now() + 10000),
      );
      expect(
        (
          await independent.get(`${baseURL}/api/account/profile`, {
            headers: { Authorization: `Bearer ${tokens[0]}` },
          })
        ).status(),
      ).toBe(401);
      expect(
        (
          await directClient(tokens[0])
            .from('account_profiles')
            .select('owner_id')
            .retry(false)
        ).error !== null,
      ).toBe(true);
    } finally {
      await independent.dispose();
    }
    await pages[0].getByLabel('Your timezone').fill('America/New_York');
    await pages[0]
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await expect(
      pages[0].getByRole('link', { name: 'Sign in', exact: true }).first(),
    ).toBeVisible();
    expect(
      await pages[0].evaluate(() =>
        localStorage.getItem('closet-theory.visitor-wardrobe'),
      ),
    ).toBeNull();
    expect(
      await pages[0].evaluate(() =>
        sessionStorage.getItem('closet-theory.account-profile-draft'),
      ),
    ).toBeNull();
    await clerk.signIn({ page: pages[0], emailAddress: users[1].email });
    await pages[0].goto(`${baseURL}/profile`);
    await expect(pages[0].getByLabel('Your timezone')).toHaveValue('UTC');
    await pages[0].reload();
    await expect(pages[0].getByLabel('Your timezone')).toHaveValue('UTC');
  } finally {
    for (const [index, fixture] of users.entries()) {
      const session = await clerkApi('sessions', 'POST', {
        user_id: fixture.id,
      });
      const fresh = await clerkApi(`sessions/${session.id}/tokens`, 'POST');
      const db = directClient(fresh.jwt);
      for (const table of ['visitor_import_items', 'visitor_imports']) {
        const result = await db
          .from(table)
          .delete()
          .eq('owner_id', fixture.id)
          .eq(
            table === 'visitor_import_items' ? 'import_id' : 'id',
            batches[index],
          )
          .retry(false);
        if (result.error)
          throw new Error(
            'Per-journey fixture cleanup failed; global cleanup will retry.',
          );
      }
      if (
        (
          await db
            .from('wardrobe_items')
            .delete()
            .eq('owner_id', fixture.id)
            .eq('id', fixture.rowId)
            .retry(false)
        ).error
      )
        throw new Error('Per-journey clothing cleanup failed.');
    }
    await Promise.all(contexts.map((context) => context.close()));
  }
});
