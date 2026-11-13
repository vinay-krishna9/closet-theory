import { expect, test } from '@playwright/test';

test('workspace stays empty and account actions explain their availability', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/wardrobe');
  await expect(
    page.getByRole('heading', { name: 'Your wardrobe', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/this foundation does not save wardrobe data/),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Statistics', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Profile', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('workspace.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Accounts are not available yet');
  await expect(dialog.getByRole('heading')).toBeFocused();
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('account-availability.png'),
    fullPage: false,
    animations: 'disabled',
  });
  // Tab and Shift+Tab must stay inside the modal, including after wrapping.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }).last(),
  ).toBeFocused();
  await page.getByRole('link', { name: 'Explore quick-add' }).click();
  await expect(page).toHaveURL(/\/quick-add$/);
  await expect(
    page.getByRole('heading', { name: 'The catalog is coming next.' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Back to wardrobe', exact: true })
    .click();
  await page.getByRole('link', { name: 'Outfits', exact: true }).last().click();
  await expect(
    page.getByText('No recommendations have been generated.', { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('shared shell reflows with reduced motion, enlarged text and safe bottom clearance', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['wardrobe', 'quick-add', 'outfits']) {
    await page.goto(`/${route}`);
    for (const width of [320, 390, 767, 768, 1023, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route}: ${width}px`,
      ).toBe(true);
      await expect(
        page.getByRole('navigation', { name: 'Mobile visitor navigation' }),
      ).toBeVisible({ visible: width < 768 });
      await expect(
        page.getByRole('navigation', {
          name: 'Visitor navigation',
          exact: true,
        }),
      ).toBeVisible({ visible: width >= 768 });
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('main').getByRole('link').scrollIntoViewIfNeeded();
    const action = await page.getByRole('main').getByRole('link').boundingBox();
    const tabs = await page
      .getByRole('navigation', { name: 'Mobile visitor navigation' })
      .boundingBox();
    expect(action!.y + action!.height).toBeLessThanOrEqual(tabs!.y);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }
});

test('shared editor is full-screen on phones and a drawer on larger screens', async ({
  page,
}, testInfo) => {
  await page.goto('/design-review/quick-add');
  const opener = page.getByRole('button', {
    name: 'View Navy T-shirt',
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  const viewport = page.viewportSize()!;
  const box = await dialog.boundingBox();
  expect(Math.round(box!.width)).toBe(
    viewport.width < 768 ? viewport.width : 480,
  );
  expect(Math.round(box!.height)).toBe(viewport.height);
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1');
  await page.keyboard.press('Shift+Tab');
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('shared-editor.png'),
    fullPage: false,
  });
  // A shorter visual viewport approximates keyboard space without claiming a physical-phone test.
  await page.setViewportSize({ width: viewport.width, height: 480 });
  const footer = dialog.locator('.review-detail-footer');
  await expect(
    footer.getByRole('button', { name: 'Done reviewing' }),
  ).toBeVisible();
  expect(
    (await footer.boundingBox())!.y + (await footer.boundingBox())!.height,
  ).toBeLessThanOrEqual(480);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked');
});

test('shell uses readable semantic colors, visible keyboard focus and touch targets', async ({
  page,
}) => {
  await page.goto('/wardrobe');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const action = page.getByRole('link', { name: 'Explore quick-add' });
  await action.focus();
  await expect(action).toHaveCSS('outline-style', 'solid');
  await expect(action).toHaveCSS('outline-width', '2px');
  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    function rgb(name: string) {
      const hex = style.getPropertyValue(name).trim().slice(1);
      return [0, 2, 4].map(
        (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
      );
    }
    function luminance(name: string) {
      const linear = rgb(name).map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      );
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    function contrast(a: string, b: string) {
      const first = luminance(a),
        second = luminance(b);
      return (
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
      );
    }
    return {
      text: contrast('--foreground', '--background'),
      muted: contrast('--muted-foreground', '--surface'),
      primary: contrast('--primary-foreground', '--primary'),
      control: contrast('--input', '--surface'),
      focus: contrast('--ring', '--surface'),
      scheme: style.colorScheme,
    };
  });
  expect(colors.scheme).toBe('dark');
  expect(colors.text).toBeGreaterThanOrEqual(4.5);
  expect(colors.muted).toBeGreaterThanOrEqual(4.5);
  expect(colors.primary).toBeGreaterThanOrEqual(4.5);
  expect(colors.control).toBeGreaterThanOrEqual(3);
  expect(colors.focus).toBeGreaterThanOrEqual(3);
  const targets = await page
    .locator(
      '.app-header a, .app-header button, .app-mobile-tabs a, .app-mobile-tabs button, main .ui-button',
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => (element as HTMLElement).offsetParent !== null)
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            name: element.textContent,
            width: box.width,
            height: box.height,
          };
        }),
    );
  for (const target of targets) {
    expect(target.width, target.name ?? '').toBeGreaterThanOrEqual(44);
    expect(target.height, target.name ?? '').toBeGreaterThanOrEqual(44);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await expect(page.getByRole('dialog')).toHaveCSS('animation-name', 'none');
});
