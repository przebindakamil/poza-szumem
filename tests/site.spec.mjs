import { test, expect } from '@playwright/test';
test('library and every article load without JavaScript errors', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('.article-card').first()).toBeVisible();
  const links = await page.locator('.article-card .card-link').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(links.length).toBeGreaterThanOrEqual(19);
  for (const link of links) expect((await request.get(link)).status(), link).toBe(200);
  await page.locator('.article-card .card-link').first().click();
  await expect(page.locator('.article-body')).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/article-' + test.info().project.name + '.png', fullPage: true });
});
test('blocked browser storage does not stop the page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value: () => { throw new DOMException('Blocked', 'SecurityError'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('./');
  await expect(page.locator('.pwa-install')).toBeVisible();
  await page.locator('.theme-toggle').click();
  expect(errors).toEqual([]);
});
test('exact article stays readable offline', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await page.locator('.article-card .card-link').first().click();
  await expect(page.locator('.article-body')).toBeVisible();
  await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find(key => key.startsWith('poza-szumem-')));
    for (let i = 0; i < 50; i++) {
      if (await cache.match(location.href)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Article was not cached: ' + JSON.stringify({ url: location.href, controller: navigator.serviceWorker.controller?.scriptURL, caches: await caches.keys(), keys: (await cache.keys()).map(request => request.url) }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.article-body')).toBeVisible();
});

test('library sorting, filters and list view survive a return from an article', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.locator('#article-sort').selectOption('shortest');
  const minutes = await page.locator('.article-card .card-footer').evaluateAll(nodes => nodes.map(node => Number(node.textContent.match(/(\d+)\s*min/)?.[1] || 0)));
  expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  await page.getByLabel('Lista', { exact: true }).check();
  await expect(page.locator('.article-grid')).toHaveClass(/list-view/);
  await page.locator('.category-menu summary').click();
  await page.getByRole('button', { name: 'Finanse i biznes', exact: true }).click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(2);
  await page.locator('.article-card:not([hidden]) .card-link').first().click();
  await page.locator('.article-back').click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(2);
  await expect(page.locator('.article-grid')).toHaveClass(/list-view/);
  await expect(page.locator('#article-sort')).toHaveValue('shortest');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/library-' + test.info().project.name + '.png', fullPage: true });
});
