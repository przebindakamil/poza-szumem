import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import MarkdownIt from 'markdown-it';
import matter from 'gray-matter';
import sharp from 'sharp';
import { Feed } from 'feed';
import { build as bundle } from 'esbuild';

const output = path.resolve('_site');
if (path.dirname(output) !== process.cwd()) throw new Error('Invalid output directory');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
const settings = JSON.parse(await fs.readFile('content/editorial.json', 'utf8'));
const site = new URL(settings.siteUrl);
if (site.protocol !== 'https:' || !site.pathname.endsWith('/')) throw new Error('siteUrl must be an HTTPS directory URL');
const categoryLabels = { rozwoj: 'Rozwój i psychologia', ai: 'AI i technologia', sport: 'Sport i zdrowie', finanse: 'Finanse i biznes', swiat: 'Świat i nauka', dom: 'Dom i codzienność', kultura: 'Kultura i reportaż' };
const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const homepage = await fs.readFile('index.html', 'utf8');
const home = load(homepage);
const originalCards = new Map();
home('.article-card').each((_, node) => {
  const card = home(node);
  const href = card.find('.card-link').attr('href');
  if (href) originalCards.set(path.basename(href, '.html'), {
    category: card.attr('data-category'), date: card.find('time').attr('datetime'), keywords: card.attr('data-search') || ''
  });
});
const template = await fs.readFile('templates/article.html', 'utf8');
const names = (await fs.readdir('artykuly')).filter(name => name.endsWith('.html'));
const markdownNames = (await fs.readdir('content')).filter(name => name.endsWith('.md') && !name.startsWith('_'));
const records = [];
const addRecord = (slug, $, metadata, sourcePath) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid article slug: ' + slug);
  const old = originalCards.get(slug) || {};
  const dateText = $('.article-meta').text().match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const date = (metadata.date instanceof Date ? metadata.date.toISOString().slice(0, 10) : metadata.date) || old.date || (dateText ? dateText[3] + '-' + dateText[2] + '-' + dateText[1] : '');
  const category = metadata.category || old.category || Object.keys(categoryLabels).find(key => categoryLabels[key] === $('.article-category').text().trim());
  const title = metadata.title || $('.article-title').text().trim();
  const excerpt = metadata.excerpt || $('.article-deck').text().trim();
  if (!title || !excerpt || !categoryLabels[category] || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) throw new Error('Missing or invalid article metadata: ' + sourcePath);
  const readingContent = $('.article-body').clone();
  readingContent.find('h2, h3').remove();
  const words = readingContent.text().trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const sources = metadata.sources || [];
  for (const source of sources) {
    if (!source.title || new URL(source.url).protocol !== 'https:') throw new Error('Invalid source for ' + slug);
  }
  records.push({ slug, $, title, excerpt, date, category, minutes, author: metadata.author || settings.publisher, updated: metadata.updated || date, series: metadata.series || '', sources, headings: metadata.headings || [], keywords: metadata.keywords || old.keywords || '', sourcePath });
};
for (const name of names) {
  const slug = path.basename(name, '.html');
  const $ = load(await fs.readFile('artykuly/' + name, 'utf8'));
  addRecord(slug, $, settings.articles[slug] || {}, 'artykuly/' + name);
}
for (const name of markdownNames) {
  const parsed = matter(await fs.readFile('content/' + name, 'utf8'));
  for (const key of ['title', 'excerpt', 'date', 'category']) if (!parsed.data[key]) throw new Error('Missing Markdown field ' + key + ': ' + name);
  if (parsed.data.updated instanceof Date) parsed.data.updated = parsed.data.updated.toISOString().slice(0, 10);
  const slug = parsed.data.slug || path.basename(name, '.md');
  if (records.some(record => record.slug === slug)) throw new Error('Duplicate article: ' + slug);
  const $ = load(template);
  $('.article-body').html(markdown.render(parsed.content));
  addRecord(slug, $, parsed.data, 'content/' + name);
}
records.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
const card = record => '<article class="article-card" data-category="' + record.category + '" data-search="' + escape(record.keywords) + '"><a class="card-link" href="artykuly/' + record.slug + '.html" aria-label="Czytaj: ' + escape(record.title) + '"></a><div class="card-topline"><span class="pill">' + categoryLabels[record.category] + '</span><time datetime="' + record.date + '">' + record.date.split('-').reverse().join('.') + '</time></div><div class="card-copy"><h3>' + escape(record.title) + '</h3><p>' + escape(record.excerpt) + '</p></div><div class="card-footer"><span>' + record.minutes + ' min czytania</span><span class="arrow" aria-hidden="true">↗</span></div></article>';

const assetNames = ['script.js', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.svg', 'icon-512.svg'];
for (const name of assetNames) await fs.copyFile(name, path.join(output, name));
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await bundle({ entryPoints: ['scripts/icons.mjs'], outfile: path.join(output, 'assets/lucide.min.js'), bundle: true, minify: true, format: 'iife', target: 'es2020' });
const icon = Buffer.from(await fs.readFile('icon.svg')).toString('base64');
const shareSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f6f8f6"/><rect x="0" y="0" width="18" height="630" fill="#355f4a"/><image x="80" y="70" width="145" height="145" href="data:image/svg+xml;base64,' + icon + '"/><text x="80" y="340" font-family="Georgia,serif" font-size="100" fill="#171b18">Poza Szumem</text><text x="86" y="424" font-family="sans-serif" font-size="33" fill="#515c55">Eseje, reportaże i teksty warte uwagi.</text></svg>';
await sharp(Buffer.from(shareSvg)).png().toFile(path.join(output, 'assets/share.png'));
await sharp(Buffer.from(await fs.readFile('icon-192.svg'))).resize(192, 192).png().toFile(path.join(output, 'assets/icon-192.png'));
await sharp(Buffer.from(await fs.readFile('icon-512.svg'))).resize(512, 512).png().toFile(path.join(output, 'assets/icon-512.png'));
const manifest = JSON.parse(await fs.readFile('manifest.webmanifest', 'utf8'));
manifest.icons = [{ src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }];
await fs.writeFile(path.join(output, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
const version = createHash('sha256').update(await fs.readFile('script.js')).update(await fs.readFile('styles.css')).update(await fs.readFile('content/editorial.json')).update(JSON.stringify(records.map(record => [record.slug, record.date, record.title, record.excerpt]))).digest('hex').slice(0, 12);

function metadata($, title, description, file, schema) {
  $('title').text(title);
  $('meta[name="description"]').attr('content', description);
  $('head').find('link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]').remove();
  const url = new URL(file, site).href;
  const image = new URL('assets/share.png', site).href;
  $('head').append('<link rel="canonical" href="' + url + '"><meta property="og:type" content="' + (schema?.['@type'] === 'Article' ? 'article' : 'website') + '"><meta property="og:locale" content="pl_PL"><meta property="og:site_name" content="Poza Szumem"><meta property="og:title" content="' + escape(title) + '"><meta property="og:description" content="' + escape(description) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + image + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">');
  if (schema) $('head').append('<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', ...schema }).replace(/</g, '\\u003c') + '</script>');
  if (!$('link[rel="alternate"][type="application/rss+xml"]').length) $('head').append('<link rel="alternate" type="application/rss+xml" title="Poza Szumem" href="feed.xml">');
}
function relativeLinks($, file) {
  const directory = path.posix.dirname(file);
  $('[href], [src]').each((_, node) => {
    const element = $(node);
    for (const attribute of ['href', 'src']) {
      const value = element.attr(attribute);
      if (!value || value.startsWith('#') || /^(?:https?:|data:|mailto:|tel:)/.test(value)) continue;
      const target = new URL(value, site);
      const targetPath = target.pathname.slice(site.pathname.length);
      let relative = path.posix.relative(directory, targetPath || 'index.html');
      if (!relative) relative = path.posix.basename(targetPath || 'index.html');
      element.attr(attribute, relative + target.search + target.hash);
    }
  });
}
async function writePage($, file) {
  $('script[src*="script.js"]').attr('src', 'script.js?v=' + version);
  $('link[rel="stylesheet"]').attr('href', 'styles.css?v=' + version);
  $('link[rel="manifest"]').attr('href', 'manifest.webmanifest');
  $('link[rel="icon"]').attr('href', 'icon.svg');
  if (!$('script[src*="lucide"]').length) $('script[src*="script.js"]').before('<script src="assets/lucide.min.js"></script>');
  $('script[src*="lucide"]').attr('src', 'assets/lucide.min.js');
  $('link[rel="alternate"][type="application/rss+xml"]').attr('href', 'feed.xml');
  if (!$('.skip-link').length) $('body').prepend('<a class="skip-link" href="#main-content">Przejdź do treści</a>');
  $('main').attr('id', 'main-content');
  $('.brand').attr('href', 'index.html');
  $('.article-back, .article-end a').attr('href', 'index.html#artykuly');
  if (!$('.primary-nav').length) $('.header-actions').before('<nav class="primary-nav" aria-label="Główna nawigacja"></nav>');
  $('.primary-nav').html('<a href="index.html#artykuly" data-library-view>Biblioteka</a><a href="kategorie/index.html">Kategorie</a><a href="index.html#saved" data-saved-view>Zapisane</a>');
  $('footer').html('<span>Poza Szumem</span><nav aria-label="Stopka"><a href="wybor-tygodnia.html">Wybór tygodnia</a><a href="serie/index.html">Serie</a><a href="feed.xml">RSS</a></nav>');
  $('input[name="library-view"]').each((_, node) => {
    const input = $(node);
    const list = input.attr('value') === 'list';
    input.attr('aria-label', list ? 'Lista' : 'Karty');
    input.next('span').html('<i data-lucide="' + (list ? 'rows-3' : 'columns-2') + '"></i>');
  });
  $('script[data-theme-init]').remove();
  $('head').prepend('<script data-theme-init>try{var t=localStorage.getItem("poza-szumem-theme");document.documentElement.dataset.theme=t==="dark"||t==="light"?t:(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}catch(e){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}</script>');
  relativeLinks($, file);
  const target = path.join(output, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, $.html());
}

for (const record of records) {
  const $ = record.$;
  $('.article-title').text(record.title);
  $('.article-deck').text(record.excerpt);
  $('.article-category').text(categoryLabels[record.category]);
  $('.article-meta').text(record.date.split('-').reverse().join('.') + ' · ' + record.minutes + ' min czytania');
  $('.article-byline, .article-sources, .article-toc, .series-link').remove();
  $('.article-heading').append('<p class="article-byline">' + escape(record.author) + (record.updated !== record.date ? ' · Aktualizacja: ' + record.updated.split('-').reverse().join('.') : '') + '</p>');
  const body = $('.article-body');
  if (record.slug === 'czlowiek-ktory-zawsze-czekal-na-lepszy-moment') body.html(body.html().replace('W 2009 roku Karl Pillemer', 'W 2004 roku Karl Pillemer'));
  const paragraphs = body.find('p').toArray();
  paragraphs.forEach((node, index) => { $(node).attr('id', 'reading-p-' + index); });
  for (const [index, title] of record.headings) {
    if (paragraphs[index] && !body.find('#section-' + index).length) $(paragraphs[index]).before('<h2 id="section-' + index + '">' + escape(title) + '</h2>');
  }
  const headings = body.find('h2, h3').toArray();
  if (headings.length > 1) {
    const items = headings.map((node, index) => {
      $(node).attr('id', $(node).attr('id') || 'section-' + index);
      return '<li><a href="#' + $(node).attr('id') + '">' + escape($(node).text()) + '</a></li>';
    }).join('');
    $('.article-divider').before('<details class="article-toc"><summary>W tym tekście</summary><ol>' + items + '</ol></details>');
  }
  if (record.series) $('.article-heading').append('<p class="series-link"><a href="serie/' + slugify(record.series) + '.html">' + escape(record.series) + '</a></p>');
  if (record.sources.length) $('.article-end').before('<section class="article-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Dalsza lektura</h2><ul>' + record.sources.map(source => '<li><a href="' + escape(source.url) + '" rel="noopener noreferrer">' + escape(source.title) + '</a></li>').join('') + '</ul></section>');
  metadata($, record.title + ' — Poza Szumem', record.excerpt, 'artykuly/' + record.slug + '.html', {
    '@type': 'Article', headline: record.title, description: record.excerpt, datePublished: record.date, dateModified: record.updated, author: { '@type': 'Organization', name: record.author }, publisher: { '@type': 'Organization', name: settings.publisher }, mainEntityOfPage: new URL('artykuly/' + record.slug + '.html', site).href, image: new URL('assets/share.png', site).href, inLanguage: 'pl', wordCount: $('.article-body').text().trim().split(/\s+/).length
  });
  await writePage($, 'artykuly/' + record.slug + '.html');
}
home('.article-grid').html(records.map(card).join(''));
home('.library-count').text(records.length + ' tekstów');
const recommended = records.find(record => record.slug === settings.recommendedSlug) || records[0];
home('.featured-reading h2 a').text(recommended.title).attr('href', 'artykuly/' + recommended.slug + '.html');
home('.featured-reading p').text(recommended.excerpt);
home('.featured-meta').text(categoryLabels[recommended.category]);
const categoryCounts = Object.entries(categoryLabels).map(([id, name]) => ({ id, name, count: records.filter(record => record.category === id).length })).filter(category => category.count);
home('.category-index').html(categoryCounts.map(category => '<a href="kategorie/' + category.id + '.html"><span>' + category.name + '</span><small>' + category.count + ' tekstów</small></a>').join(''));
metadata(home, 'Poza Szumem — teksty warte uwagi', 'Spokojna biblioteka esejów, reportaży i tekstów, do których warto wracać.', 'index.html', { '@type': 'WebSite', name: 'Poza Szumem', url: site.href, inLanguage: 'pl' });
await writePage(home, 'index.html');

const pageFiles = ['index.html', ...records.map(record => 'artykuly/' + record.slug + '.html')];
function collection(title, excerpt, subset, file, category) {
  const $ = load(homepage);
  $('body').removeClass('home');
  if (category) $('body').attr('data-category', category);
  $('.hero h1').text(title);
  $('.hero p').text(excerpt);
  $('.hero-orbit, .featured-reading, .categories-section').remove();
  $('.article-grid').html(subset.map(card).join(''));
  $('.library-count').text(subset.length + ' tekstów');
  metadata($, title + ' — Poza Szumem', excerpt, file, {
    '@type': 'CollectionPage', name: title, url: new URL(file, site).href, inLanguage: 'pl',
    mainEntity: { '@type': 'ItemList', itemListElement: subset.map((record, index) => ({ '@type': 'ListItem', position: index + 1, url: new URL('artykuly/' + record.slug + '.html', site).href, name: record.title })) }
  });
  pageFiles.push(file);
  return $;
}
const categoryIndex = load(homepage);
categoryIndex('.hero h1').text('Kategorie');
categoryIndex('.hero p').text('Psychologia, nauka, technologia i codzienność.');
categoryIndex('.featured-reading, .library, .hero-orbit, .search-toggle, .hero-discovery').remove();
categoryIndex('.category-index').html(categoryCounts.map(category => '<a href="kategorie/' + category.id + '.html"><span>' + category.name + '</span><small>' + category.count + ' tekstów</small></a>').join(''));
metadata(categoryIndex, 'Kategorie — Poza Szumem', 'Teksty z biblioteki Poza Szumem według tematów.', 'kategorie/index.html', { '@type': 'CollectionPage', name: 'Kategorie', inLanguage: 'pl' });
await writePage(categoryIndex, 'kategorie/index.html');
pageFiles.push('kategorie/index.html');
for (const category of categoryCounts) {
  const file = 'kategorie/' + category.id + '.html';
  const $ = collection(category.name, 'Eseje i teksty z kategorii ' + category.name.toLocaleLowerCase('pl-PL') + '.', records.filter(record => record.category === category.id), file, category.id);
  await writePage($, file);
}
const seriesNames = [...new Set(records.map(record => record.series).filter(Boolean))];
const seriesIndex = load(homepage);
seriesIndex('.hero h1').text('Serie');
seriesIndex('.hero p').text('Historie i idee połączone wspólnym tematem.');
seriesIndex('.featured-reading, .library, .hero-orbit, .search-toggle, .hero-discovery').remove();
seriesIndex('#categories-heading').text('Serie tematyczne');
seriesIndex('.category-index').html(seriesNames.map(name => '<a href="serie/' + slugify(name) + '.html"><span>' + escape(name) + '</span><small>' + records.filter(record => record.series === name).length + ' tekstów</small></a>').join(''));
metadata(seriesIndex, 'Serie — Poza Szumem', 'Serie tematyczne z biblioteki Poza Szumem.', 'serie/index.html', { '@type': 'CollectionPage', name: 'Serie', inLanguage: 'pl' });
await writePage(seriesIndex, 'serie/index.html');
pageFiles.push('serie/index.html');
for (const name of seriesNames) {
  const file = 'serie/' + slugify(name) + '.html';
  const $ = collection(name, 'Seria tematyczna Poza Szumem.', records.filter(record => record.series === name), file);
  await writePage($, file);
}
const latest = new Date(records[0].date + 'T12:00:00Z');
const weekStart = new Date(latest);
weekStart.setUTCDate(latest.getUTCDate() - (latest.getUTCDay() + 6) % 7);
const weekDate = weekStart.toISOString().slice(0, 10);
const recent = records.filter(record => record.date >= weekDate);
const weekly = [];
const used = new Set();
for (const record of [...recent, ...records]) {
  if (!used.has(record.category) && !weekly.some(item => item.slug === record.slug)) { weekly.push(record); used.add(record.category); }
  if (weekly.length === 3) break;
}
const weekPage = collection('Wybór tygodnia', 'Trzy teksty z różnych tematów · tydzień od ' + weekDate.split('-').reverse().join('.'), weekly, 'wybor-tygodnia.html');
await writePage(weekPage, 'wybor-tygodnia.html');
const feed = new Feed({
  title: 'Poza Szumem', description: 'Eseje, reportaże i teksty warte uwagi.', id: site.href, link: site.href, language: 'pl',
  image: new URL('assets/share.png', site).href, favicon: new URL('icon.svg', site).href,
  copyright: 'Poza Szumem', updated: new Date(records[0].date), feedLinks: { rss2: new URL('feed.xml', site).href }
});
for (const record of records) feed.addItem({ title: record.title, id: new URL('artykuly/' + record.slug + '.html', site).href, link: new URL('artykuly/' + record.slug + '.html', site).href, description: record.excerpt, date: new Date(record.date), author: [{ name: record.author }], category: [{ name: categoryLabels[record.category] }] });
await fs.writeFile(path.join(output, 'feed.xml'), feed.rss2());
const sitemap = load('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { xmlMode: true });
for (const file of pageFiles) {
  const record = records.find(item => file === 'artykuly/' + item.slug + '.html');
  sitemap('urlset').append('<url><loc>' + escape(new URL(file, site).href) + '</loc>' + (record ? '<lastmod>' + record.updated + '</lastmod>' : '') + '</url>');
}
await fs.writeFile(path.join(output, 'sitemap.xml'), sitemap.xml());
const notFound = load(homepage);
notFound('.hero h1').text('Nie znaleziono strony');
notFound('.hero p').html('<a href="index.html">Wróć do biblioteki Poza Szumem</a>');
notFound('.featured-reading, .library, .categories-section, .hero-orbit, .hero-discovery, .search-toggle').remove();
metadata(notFound, 'Nie znaleziono strony — Poza Szumem', 'Wróć do biblioteki Poza Szumem.', '404.html');
await writePage(notFound, '404.html');

await fs.mkdir(path.join(output, 'data'), { recursive: true });
await fs.writeFile(path.join(output, 'data/articles.json'), JSON.stringify(records.map(({ $, headings, sourcePath, ...record }) => record), null, 2));
let worker = await fs.readFile('sw.js', 'utf8');
worker = worker.replace(/const CACHE_NAME = CACHE_PREFIX \+ '[^']+';/, "const CACHE_NAME = CACHE_PREFIX + '" + version + "';");
worker = worker.replace(/(script\.js|styles\.css)\?v=[a-z0-9]+/g, '$1?v=' + version);
worker = worker.replace("'icon.svg', 'icon-192.svg', 'icon-512.svg'", "'icon.svg', 'icon-192.svg', 'icon-512.svg', 'assets/lucide.min.js', 'assets/icon-192.png', 'assets/icon-512.png'");
await fs.writeFile(path.join(output, 'sw.js'), worker);
await fs.writeFile(path.join(output, '.nojekyll'), '');
console.log('Built ' + records.length + ' articles; asset version ' + version);
