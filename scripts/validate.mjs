import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const root = path.resolve('_site');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/articles.json'), 'utf8'));
assert(catalog.length >= 19, 'Archive must be preserved');
const unique = new Set(catalog.map(record => record.slug));
assert.equal(unique.size, catalog.length, 'Duplicate slugs');
const todayParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(new Date());
const todayValue = Object.fromEntries(todayParts.map(part => [part.type, part.value]));
const warsawToday = todayValue.year + '-' + todayValue.month + '-' + todayValue.day;
for (const record of catalog) {
  assert(record.date <= warsawToday, 'Public catalog contains a future article: ' + record.slug);
}
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target)); else result.push(target);
  }
  return result;
}
for (const file of (await walk(root)).filter(file => file.endsWith('.html') && !file.includes(path.sep + 'admin' + path.sep))) {
  const $ = load(await fs.readFile(file, 'utf8'));
  assert.equal($('h1').length, 1, file + ': one H1');
  assert.equal($('link[rel="canonical"]').length, 1, file + ': canonical');
  assert($('meta[property="og:image"]').attr('content'), file + ': share image');
  const appVersion = new URL($('script[src*="script.js"]').attr('src'), 'https://local.test').searchParams.get('v');
  const iconVersion = new URL($('script[src*="lucide"]').attr('src'), 'https://local.test').searchParams.get('v');
  assert(appVersion && iconVersion === appVersion, file + ': matching icon asset version');
  for (const node of $('[href], [src]').toArray()) {
    for (const attribute of ['href', 'src']) {
      const href = $(node).attr(attribute);
      if (!href || /^(https?:|data:|mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, 'https://local.test/' + path.relative(root, file).split(path.sep).join('/'));
      const target = path.join(root, decodeURIComponent(url.pathname).replace(/^\//, ''));
      const stat = await fs.stat(target).catch(() => null);
      assert(stat?.isFile(), file + ': missing ' + href);
    }
  }
  const ids = $('[id]').toArray().map(node => $(node).attr('id'));
  assert.equal(new Set(ids).size, ids.length, file + ': duplicate IDs');
  for (const node of $('a[href^="#"]').toArray()) {
    const href = $(node).attr('href');
    if (href === '#' || href === '#saved' || href.startsWith('#category/')) continue;
    assert(ids.includes(decodeURIComponent(href.slice(1))), file + ': missing anchor ' + href);
  }
  for (const node of $('script[type="application/ld+json"]').toArray()) JSON.parse($(node).text());
}
const schedule = JSON.parse(await fs.readFile('content/schedule.json', 'utf8'));
assert(Array.isArray(schedule.items), 'schedule.items must be an array');
const allowedStatuses = new Set(['idea', 'research', 'draft', 'ready']);
const allowedCategories = new Set(['rozwoj', 'ai', 'sport', 'finanse', 'swiat', 'dom', 'kultura']);
const scheduleDates = new Set();
for (const item of schedule.items) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(item.date || ''), 'Invalid schedule date');
  assert(!scheduleDates.has(item.date), 'Duplicate schedule date: ' + item.date);
  scheduleDates.add(item.date);
  assert(typeof item.title === 'string' && item.title.trim(), 'Schedule item must have a title: ' + item.date);
  assert(allowedStatuses.has(item.status), 'Invalid schedule status: ' + item.status);
  assert(allowedCategories.has(item.category), 'Invalid schedule category: ' + item.category);
  if (item.notes !== undefined) assert(typeof item.notes === 'string', 'Schedule notes must be text: ' + item.date);
}
const admin = load(await fs.readFile(path.join(root, 'admin', 'index.html'), 'utf8'));
assert.equal(admin('meta[name="robots"]').attr('content'), 'noindex,nofollow', 'Admin dashboard must not be indexed');
const adminData = JSON.parse(await fs.readFile(path.join(root, 'admin', 'data.json'), 'utf8'));
assert(Array.isArray(adminData.schedule), 'Admin schedule data');
assert(Array.isArray(adminData.articles), 'Admin article data');

const rss = load(await fs.readFile(path.join(root, 'feed.xml'), 'utf8'), { xmlMode: true });
assert.equal(rss('item').length, catalog.length, 'RSS item count');
const sitemap = load(await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8'), { xmlMode: true });
assert(sitemap('url').length > catalog.length, 'Sitemap includes collections');
console.log('Validated ' + catalog.length + ' articles, links, metadata, RSS and sitemap');
