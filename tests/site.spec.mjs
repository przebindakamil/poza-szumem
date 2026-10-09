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
      if (await caches.match(location.href)) return;
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

test('saved articles persist and are separate from highlights', async ({ page }) => {
  await page.goto('./');
  await page.locator('.article-card .bookmark-toggle').first().click();
  await page.getByRole('link', { name: 'Zapisane', exact: true }).click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(1);
  await page.locator('.article-card:not([hidden]) .bookmark-toggle').click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(0);
  await expect(page.locator('#empty-state')).toBeVisible();
});
test('unfinished reading can be resumed from the library', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.locator('.article-card .card-link').first().click();
  await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.35));
  await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('poza-szumem-positions-v1') || '{}')).length)).toBe(1);
  await page.locator('.article-back').click();
  await expect(page.locator('.continue-reading')).toBeVisible();
  await page.locator('.continue-reading a').first().click();
  await expect(page.getByRole('button', { name: 'Wznów czytanie' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  expect(errors).toEqual([]);
});
test('highlights dialog restores keyboard focus', async ({ page }) => {
  await page.goto('./');
  const opener = page.getByRole('button', { name: 'Moje fragmenty', exact: true });
  await opener.click();
  await expect(page.locator('.highlights-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('generated collections, article metadata and feed work', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('svg.lucide-search')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/home-' + test.info().project.name + '.png' });
  await page.getByRole('link', { name: 'Kategorie', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Kategorie');
  await page.locator('.category-index a').first().click();
  await expect(page.locator('.article-card').first()).toBeVisible();
  await page.locator('.article-card .card-link').first().click();
  await expect(page.locator('.article-toc')).toBeVisible();
  await expect(page.locator('.article-byline')).toHaveText(/Poza Szumem/);
  await expect(page.locator('.article-sources a').first()).toBeVisible();
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema)['@type']).toBe('Article');
  expect((await request.get('feed.xml')).status()).toBe(200);
  expect((await request.get('sitemap.xml')).status()).toBe(200);
  expect((await request.get('assets/share.png')).headers()['content-type']).toBe('image/png');
  expect(errors).toEqual([]);
});
test('the library works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/poza-szumem/');
  await expect(page.locator('.article-card').first()).toBeVisible();
  await page.locator('.article-card .card-link').first().click();
  await expect(page.locator('.article-body h2').first()).toBeVisible();
  await context.close();
});

test('category views ignore personal saved filters and return to their category', async ({ page }) => {
  await page.goto('./');
  await page.locator('.article-card .bookmark-toggle').first().click();
  await page.getByRole('link', { name: 'Zapisane', exact: true }).click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(1);
  await page.getByRole('link', { name: 'Kategorie', exact: true }).click();
  await page.locator('a[href="finanse.html"]').click();
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(2);
  await page.locator('.article-card .card-link').first().click();
  await page.locator('.article-back').click();
  await expect(page).toHaveURL(/kategorie\/finanse\.html/);
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(2);
});
test('an update preserves previously cached articles and their offline styling', async ({ page, context, request }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const url = await page.locator('.article-card .card-link').first().getAttribute('href');
  const html = await (await request.get(url)).text();
  const target = new URL(url, 'http://127.0.0.1:4173/poza-szumem/').href;
  await page.evaluate(async ({ target, html }) => {
    const old = await caches.open('poza-szumem-previous-release');
    await old.put(target, new Response(html.replace(/(script\.js|styles\.css)\?v=[a-z0-9]+/g, '$1?v=old'), { headers: { 'Content-Type': 'text/html' } }));
    const changed = new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    await navigator.serviceWorker.register('sw.js?upgrade-test=1', { updateViaCache: 'none' });
    await changed;
  }, { target, html });
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('poza-szumem-previous-release');
  await context.setOffline(true);
  await page.goto(target);
  await expect(page.locator('.article-body')).toBeVisible();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px');
  await expect(page.locator('.focus-toggle')).toBeVisible();
});
