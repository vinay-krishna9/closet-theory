import { expect, test } from '@playwright/test';
const key = 'closet-theory.visitor-wardrobe';

for (const raw of [
  '{broken',
  '{"version":0,"items":[]}',
  '{"version":99,"items":[]}',
]) {
  test(`unreadable storage remains untouched until reset: ${raw}`, async ({
    page,
  }, testInfo) => {
    await page.goto('/wardrobe');
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    });
    await page.goto('/quick-add');
    await page.reload();
    await expect(
      page.getByText(/Saved selections could not be read/),
    ).toBeVisible();
    await page
      .getByRole('article', { name: 'T-shirt catalog item' })
      .getByRole('button', { name: 'I own this' })
      .click();
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      raw,
    );
    await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath('storage-recovery-mobile.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Clear visitor wardrobe' }).click();
    await expect(
      page.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Clear all selections' }).click();
    await expect(
      page.getByRole('button', { name: 'Clear visitor wardrobe' }),
    ).toBeFocused();
    await page.reload();
    await expect(
      page.getByRole('heading', {
        name: 'Make room for what you love wearing.',
      }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), key),
    ).toBeNull();
  });
}

test('blocked reads allow memory use and warn when clearing fails', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const read = Storage.prototype.getItem;
    const remove = Storage.prototype.removeItem;
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('blocked', 'SecurityError');
      return read.call(this, name);
    };
    Storage.prototype.removeItem = function (name) {
      if (name === key) throw new DOMException('blocked', 'SecurityError');
      return remove.call(this, name);
    };
  }, key);
  await page.goto('/quick-add');
  await expect(
    page.getByText(/Saved selections could not be read/),
  ).toBeVisible();
  await page
    .getByRole('article', { name: 'T-shirt catalog item' })
    .getByRole('button', { name: 'I own this' })
    .click();
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear visitor wardrobe' }).click();
  await page.getByRole('button', { name: 'Clear all selections' }).click();
  await expect(
    page.getByText(/Older saved selections may return/),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('failed writes preserve edits and retry saves the latest wardrobe', async ({
  page,
}, testInfo) => {
  await page.addInitScript((key) => {
    const write = Storage.prototype.setItem;
    let blocked = true;
    window.addEventListener('allow-storage', () => {
      blocked = false;
    });
    Storage.prototype.setItem = function (name, value) {
      if (name === key && blocked)
        throw new DOMException('full', 'QuotaExceededError');
      return write.call(this, name, value);
    };
  }, key);
  await page.goto('/quick-add');
  await page
    .getByRole('article', { name: 'T-shirt catalog item' })
    .getByRole('button', { name: 'I own this' })
    .click();
  await expect(page.getByText(/Browser saving failed/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('browser-save-failed.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: '1 piece in your wardrobe' }).click();
  await page.getByRole('button', { name: 'Edit clothing' }).click();
  await page
    .getByRole('textbox', { name: 'Garment name' })
    .fill('Retained tee');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('allow-storage')));
  await page.getByRole('button', { name: 'Retry saving' }).click();
  await expect(page.getByText(/saved in this browser only/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('article', { name: 'Retained tee' }),
  ).toBeVisible();
});

test('another tab pauses saving and can reload or explicitly keep its wardrobe', async ({
  page,
  context,
}) => {
  await page.goto('/quick-add');
  const other = await context.newPage();
  await other.goto('/quick-add');
  await expect(other.getByRole('article')).toHaveCount(8);
  await page
    .getByRole('article', { name: 'T-shirt catalog item' })
    .getByRole('button', { name: 'I own this' })
    .click();
  await expect(other.getByText(/Another tab changed/)).toBeVisible();
  await other.getByRole('button', { name: 'Reload saved wardrobe' }).click();
  await expect(
    other.getByRole('link', { name: '1 piece in your wardrobe' }),
  ).toBeVisible();
  await page
    .getByRole('article', { name: 'Jeans catalog item' })
    .getByRole('button', { name: 'I own this' })
    .click();
  await expect(other.getByText(/Another tab changed/)).toBeVisible();
  await other
    .getByRole('article', { name: 'Sneakers catalog item' })
    .getByRole('button', { name: 'I own this' })
    .click();
  await other
    .getByRole('button', { name: 'Keep and save this wardrobe' })
    .click();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/wardrobe');
  await expect(reopened.getByRole('article')).toHaveCount(2);
  await expect(
    reopened.getByRole('article', { name: 'White T-shirt' }),
  ).toBeVisible();
  await expect(
    reopened.getByRole('article', { name: 'White Sneakers' }),
  ).toBeVisible();
  await other.close();
  await reopened.close();
});
