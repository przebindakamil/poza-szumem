import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const root = path.resolve('_site');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/articles.json'), 'utf8'));
assert(catalog.length >= 19, 'Archive must be preserved');
const unique = new Set(catalog.map(record => record.slug));
assert.equal(unique.size, catalog.length, 'Duplicate slugs');
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target)); else result.push(target);
  }
  return result;
}
for (const file of (await walk(root)).filter(file => file.endsWith('.html'))) {
  const $ = load(await fs.readFile(file, 'utf8'));
  assert.equal($('h1').length, 1, file + ': one H1');
  assert.equal($('link[rel="canonical"]').length, 1, file + ': canonical');
  assert($('meta[property="og:image"]').attr('content'), file + ': share image');
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
const rss = load(await fs.readFile(path.join(root, 'feed.xml'), 'utf8'), { xmlMode: true });
assert.equal(rss('item').length, catalog.length, 'RSS item count');
const sitemap = load(await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8'), { xmlMode: true });
assert(sitemap('url').length > catalog.length, 'Sitemap includes collections');
console.log('Validated ' + catalog.length + ' articles, links, metadata, RSS and sitemap');
