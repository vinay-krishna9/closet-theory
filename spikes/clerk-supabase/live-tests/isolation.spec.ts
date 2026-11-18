import { devices, expect, test, type Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { directClient, loadConfiguration, readJournal } from './fixtures';

test('both accounts isolate rows through the server and direct Supabase', async ({
  browser,
  baseURL,
}, testInfo) => {
  loadConfiguration();
  const {
    users: [a, b],
  } = await readJournal();
  const device =
    testInfo.project.name === 'mobile'
      ? devices['Pixel 7']
      : devices['Desktop Chrome'];
  const contexts = await Promise.all([
    browser.newContext({ ...device, reducedMotion: 'reduce' }),
    browser.newContext({ ...device, reducedMotion: 'reduce' }),
  ]);
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  const fixtures = [a, b];
  const clients = [];
  async function body(page: Page, method: string, data?: unknown, id?: string) {
    return page.request.fetch(`${baseURL}/api/items${id ? `?id=${id}` : ''}`, {
      method,
      ...(data ? { data } : {}),
    });
  }
  try {
    for (const [i, page] of pages.entries()) {
      await page.goto(baseURL!);
      await clerk.signIn({ page, emailAddress: fixtures[i].email });
      await expect(page.getByText('Signed in.', { exact: true })).toBeVisible();
      const token = await page.evaluate(async () => {
        const sdk = (
          window as unknown as {
            Clerk: { session: { getToken: () => Promise<string> } };
          }
        ).Clerk;
        return sdk.session.getToken();
      });
      clients.push(directClient(token));
      const response = await body(page, 'POST', {
        id: fixtures[i].rowId,
        label: fixtures[i].label,
      });
      expect(response.status()).toBe(201);
      expect((await body(page, 'GET')).status()).toBe(200);
    }

    for (const i of [0, 1]) {
      const owner = fixtures[i];
      const peer = fixtures[1 - i];
      const page = pages[i];
      const client = clients[i];
      const own = await body(page, 'GET', undefined, owner.rowId);
      expect((await own.json()).items).toEqual([
        { id: owner.rowId, label: owner.label },
      ]);
      expect((await body(page, 'GET', undefined, peer.rowId)).status()).toBe(
        404,
      );
      expect(
        (
          await body(page, 'PATCH', { id: peer.rowId, label: owner.label })
        ).status(),
      ).toBe(404);
      expect((await body(page, 'DELETE', { id: peer.rowId })).status()).toBe(
        404,
      );
      expect(
        (
          await body(page, 'POST', {
            id: randomUUID(),
            label: owner.label,
            owner_id: peer.id,
          })
        ).status(),
      ).toBe(400);
      expect(
        (
          await body(page, 'PATCH', {
            id: owner.rowId,
            label: owner.label,
            owner_id: peer.id,
          })
        ).status(),
      ).toBe(400);
      const ownUpdate = await body(page, 'PATCH', {
        id: owner.rowId,
        label: owner.label,
      });
      expect(ownUpdate.status()).toBe(200);

      // RLS is exercised independently of the app's explicit owner filter.
      const list = await client
        .from('spike_access_items')
        .select('id,owner_id,label')
        .retry(false);
      expect(list.error === null).toBe(true);
      expect(list.data).toEqual([
        { id: owner.rowId, owner_id: owner.id, label: owner.label },
      ]);
      const crossRead = await client
        .from('spike_access_items')
        .select('id')
        .eq('id', peer.rowId)
        .retry(false);
      expect(crossRead.error === null && crossRead.data?.length === 0).toBe(
        true,
      );
      const crossUpdate = await client
        .from('spike_access_items')
        .update({ label: owner.label })
        .eq('id', peer.rowId)
        .select('id')
        .retry(false);
      expect(crossUpdate.error === null && crossUpdate.data?.length === 0).toBe(
        true,
      );
      const crossDelete = await client
        .from('spike_access_items')
        .delete()
        .eq('id', peer.rowId)
        .select('id')
        .retry(false);
      expect(crossDelete.error === null && crossDelete.data?.length === 0).toBe(
        true,
      );
      const forged = await client
        .from('spike_access_items')
        .insert({ id: randomUUID(), owner_id: peer.id, label: owner.label })
        .retry(false);
      expect(forged.error?.code === '42501').toBe(true);
      const transfer = await client
        .from('spike_access_items')
        .update({ owner_id: peer.id })
        .eq('id', owner.rowId)
        .retry(false);
      expect(transfer.error?.code === '42501').toBe(true);
      const extraId = randomUUID();
      expect(
        (
          await client
            .from('spike_access_items')
            .insert({ id: extraId, label: owner.label })
            .retry(false)
        ).error === null,
      ).toBe(true);
      const changedLabel =
        owner.label === 'SPIKE-02 A' ? 'SPIKE-02 B' : 'SPIKE-02 A';
      expect(
        (
          await client
            .from('spike_access_items')
            .update({ label: changedLabel })
            .eq('id', extraId)
            .select('label')
            .retry(false)
        ).data,
      ).toEqual([{ label: changedLabel }]);
      expect(
        (
          await client
            .from('spike_access_items')
            .delete()
            .eq('id', extraId)
            .select('id')
            .retry(false)
        ).data,
      ).toEqual([{ id: extraId }]);

      // Exercise the visible controls and accessible recovery at this viewport.
      const section = page.getByRole('region', {
        name: 'Database isolation check',
      });
      await section
        .getByRole('button', { name: 'Load my test records' })
        .click();
      await expect(
        section.getByText(owner.rowId, { exact: true }),
      ).toBeVisible();
      await section.getByLabel('Record ID to check').fill(peer.rowId);
      await section
        .getByRole('button', { name: 'Create test record A' })
        .click();
      await expect(section.getByRole('listitem')).toHaveCount(2);
      const extra = section.getByRole('listitem').last();
      await extra.getByRole('button', { name: 'Change test label' }).click();
      await expect(
        extra.getByText('SPIKE-02 B', { exact: false }),
      ).toBeVisible();
      await extra.getByRole('button', { name: 'Delete test record' }).click();
      await expect(section.getByRole('listitem')).toHaveCount(1);
      await section
        .getByRole('button', { name: 'Check record access' })
        .click();
      await expect(section.getByRole('status')).toHaveText(
        'No accessible test record found.',
      );
      if (i === 0)
        await section.screenshot({
          path: path.resolve(
            process.cwd(),
            `spikes/clerk-supabase/artifacts/isolation-${testInfo.project.name}.png`,
          ),
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    // Failed cross-account writes must leave both owners' originals unchanged.
    for (const [i, client] of clients.entries()) {
      const row = await client
        .from('spike_access_items')
        .select('id,owner_id,label')
        .eq('id', fixtures[i].rowId)
        .single()
        .retry(false);
      expect(row.data).toEqual({
        id: fixtures[i].rowId,
        owner_id: fixtures[i].id,
        label: fixtures[i].label,
      });
      expect(
        (await body(pages[i], 'DELETE', { id: fixtures[i].rowId })).status(),
      ).toBe(200);
      expect(
        (await body(pages[i], 'GET', undefined, fixtures[i].rowId)).status(),
      ).toBe(404);
    }
    const anonymous = directClient(null);
    expect(
      (await anonymous.from('spike_access_items').select('id').retry(false))
        .error !== null,
    ).toBe(true);
    await pages[0]
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await expect(
      pages[0].getByText('Signed out.', { exact: true }),
    ).toBeVisible();
    expect((await body(pages[0], 'GET')).status()).toBe(401);
    await expect(
      pages[0].getByRole('region', { name: 'Database isolation check' }),
    ).toHaveCount(0);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
