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
const tagline = 'Teksty do których warto wracać.';
const site = new URL(settings.siteUrl);
if (site.protocol !== 'https:' || !site.pathname.endsWith('/')) throw new Error('siteUrl must be an HTTPS directory URL');
const textCount = count => count + ' ' + (count === 1 ? 'tekst' : count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14) ? 'teksty' : 'tekstów');
const categoryLabels = { rozwoj: 'Rozwój i psychologia', ai: 'AI i technologia', sport: 'Sport i zdrowie', finanse: 'Finanse i biznes', swiat: 'Świat i nauka', dom: 'Dom i codzienność', kultura: 'Kultura i reportaż', zwierzeta: 'Zwierzęta' };
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

  const image = typeof metadata.image === 'string' ? metadata.image.trim() : '';
  const imageAlt = typeof metadata.imageAlt === 'string' ? metadata.imageAlt.trim() : '';
  const imageCredit = typeof metadata.imageCredit === 'string' ? metadata.imageCredit.trim() : '';
  if (image) {
    const isRemoteImage = /^https:\/\//.test(image);
    const isLocalArticleImage = /^assets\/articles\/[a-zA-Z0-9._/-]+$/.test(image);
    if (!isRemoteImage && !isLocalArticleImage) throw new Error('Invalid article image path for ' + slug);
    if (!imageAlt) throw new Error('Missing imageAlt for article image: ' + slug);
  }

  records.push({
    slug, $, title, excerpt, date, category, minutes,
    author: metadata.author || settings.publisher,
    updated: metadata.updated || date,
    series: metadata.series || '',
    sources,
    headings: metadata.headings || [],
    keywords: metadata.keywords || old.keywords || '',
    image,
    imageAlt,
    imageCredit,
    visualMotif: typeof metadata.visualMotif === 'string' ? metadata.visualMotif.trim() : '',
    visualAlt: typeof metadata.visualAlt === 'string' ? metadata.visualAlt.trim() : '',
    socialImage: '',
    sourcePath
  });
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
for (const record of records) {
  if (record.image && record.image.startsWith('assets/articles/')) {
    try {
      await fs.access(record.image);
    } catch {
      throw new Error('Missing local article image: ' + record.image + ' (' + record.slug + ')');
    }
  }
}
records.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
const warsawToday = (() => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return value.year + '-' + value.month + '-' + value.day;
})();
const visualMotifs = new Set(['orbit', 'network', 'flow', 'grid', 'waves', 'rings', 'layers', 'signal']);

function seededNumber(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function chooseVisualMotif(record) {
  if (visualMotifs.has(record.visualMotif)) return record.visualMotif;
  const haystack = [record.title, ...(Array.isArray(record.keywords) ? record.keywords : [record.keywords || ''])]
    .join(' ')
    .toLocaleLowerCase('pl-PL');

  if (/(gps|satelit|orbita|kosmos|einstein|gwiazd|planeta)/.test(haystack)) return 'orbit';
  if (/(pieniadz|pieniądz|karta|platn|płatn|bank|finans|handel|transakc)/.test(haystack)) return 'flow';
  if (/(mozg|mózg|sen|pamiec|pamięć|ai|model|mowa|komputer|sieć|siec)/.test(haystack)) return 'network';
  if (/(kontener|port|metr|miasto|budynek|dom|logisty|transport)/.test(haystack)) return 'grid';
  if (/(deszcz|woda|ocean|morze|fala|rzeka)/.test(haystack)) return 'waves';
  if (/(czas|czek|zeg|cykl|nawyk|powtarz)/.test(haystack)) return 'rings';
  if (/(malar|kolor|sztuk|kultur|warstw|histori)/.test(haystack)) return 'layers';
  if (/(gołęb|goleb|ptak|migrac|nawigac|magnetorecepc|zwierz|ssak|owad|ryb|ośmior|osmior|nietoperz|wilk|kruk|delfin|pszczoł|pszczol)/.test(haystack)) {
    if (/(migrac|nawigac|magnetorecepc|gołęb|goleb|ptak)/.test(haystack)) return 'orbit';
    if (/(ryb|ośmior|osmior|delfin|ocean|morze)/.test(haystack)) return 'waves';
    return 'network';
  }

  return {
    rozwoj: 'rings',
    ai: 'network',
    sport: 'signal',
    finanse: 'flow',
    swiat: 'orbit',
    dom: 'grid',
    kultura: 'layers',
    zwierzeta: 'network'
  }[record.category] || 'signal';
}

const artPalettes = {
  rozwoj: { accent: '#91664f', accent2: '#c7a78d', ink: '#26342c' },
  ai: { accent: '#5d728f', accent2: '#9aabc2', ink: '#26323b' },
  sport: { accent: '#71825f', accent2: '#a8b596', ink: '#29352a' },
  finanse: { accent: '#8b6a42', accent2: '#c2a578', ink: '#382f25' },
  swiat: { accent: '#4d7280', accent2: '#90aeb6', ink: '#25363b' },
  dom: { accent: '#9a7858', accent2: '#ccb095', ink: '#3a3028' },
  kultura: { accent: '#806982', accent2: '#b4a0b5', ink: '#352b36' },
  zwierzeta: { accent: '#607a55', accent2: '#a7b99b', ink: '#283529' }
};

function visualAltFor(record, motif) {
  if (record.visualAlt) return record.visualAlt;
  const labels = {
    orbit: 'Abstrakcyjna ilustracja z orbitami i punktami krążącymi wokół centralnego kształtu.',
    network: 'Abstrakcyjna ilustracja przedstawiająca sieć połączonych punktów i linii.',
    flow: 'Abstrakcyjna ilustracja przedstawiająca przepływ między połączonymi elementami.',
    grid: 'Abstrakcyjna ilustracja z uporządkowaną siatką modułów i geometrycznych bloków.',
    waves: 'Abstrakcyjna ilustracja z falami i opadającymi punktami.',
    rings: 'Abstrakcyjna ilustracja z koncentrycznymi kręgami i zaznaczonym rytmem.',
    layers: 'Abstrakcyjna ilustracja z nakładającymi się półprzezroczystymi warstwami.',
    signal: 'Abstrakcyjna ilustracja z rytmiczną linią sygnału i geometrycznymi punktami.'
  };
  return labels[motif] || 'Abstrakcyjna ilustracja redakcyjna.';
}

function motifMarkup(motif, palette, seed) {
  const a = palette.accent;
  const b = palette.accent2;
  const ink = palette.ink;
  const shift = Math.round(seed * 120);

  if (motif === 'orbit') return `
    <circle cx="800" cy="600" r="170" fill="${a}" opacity=".18"/>
    <circle cx="800" cy="600" r="92" fill="${a}" opacity=".92"/>
    <ellipse cx="800" cy="600" rx="520" ry="250" fill="none" stroke="${ink}" stroke-width="8" opacity=".65" transform="rotate(-12 800 600)"/>
    <ellipse cx="800" cy="600" rx="390" ry="410" fill="none" stroke="${b}" stroke-width="10" opacity=".8" transform="rotate(22 800 600)"/>
    <circle cx="${1180-shift}" cy="${430+shift/3}" r="34" fill="${ink}"/>
    <circle cx="${510+shift/2}" cy="${900-shift/4}" r="24" fill="${b}"/>
    <path d="M325 300H610" stroke="${ink}" stroke-width="8" stroke-linecap="round" opacity=".45"/>
  `;

  if (motif === 'network') return `
    <path d="M330 780L570 430L840 600L1120 330L1310 760" fill="none" stroke="${ink}" stroke-width="9" opacity=".7"/>
    <path d="M420 300L620 800L940 340L1210 850" fill="none" stroke="${b}" stroke-width="8" opacity=".55"/>
    <g fill="${a}">
      <circle cx="330" cy="780" r="36"/><circle cx="570" cy="430" r="48"/><circle cx="840" cy="600" r="32"/>
      <circle cx="1120" cy="330" r="56"/><circle cx="1310" cy="760" r="38"/>
    </g>
    <circle cx="${650+shift}" cy="${250+shift/4}" r="96" fill="${b}" opacity=".25"/>
  `;

  if (motif === 'flow') return `
    <rect x="260" y="300" width="280" height="600" rx="70" fill="${a}" opacity=".9"/>
    <rect x="1060" y="300" width="280" height="600" rx="70" fill="${b}" opacity=".85"/>
    <path d="M560 470C700 350 890 350 1035 470" fill="none" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
    <path d="M560 720C720 860 890 850 1035 720" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round" opacity=".55"/>
    <circle cx="${760+shift/3}" cy="600" r="42" fill="${ink}"/>
    <circle cx="${900-shift/4}" cy="600" r="24" fill="${a}"/>
  `;

  if (motif === 'grid') return `
    <g stroke="${ink}" stroke-width="6" opacity=".55">
      <path d="M300 310H1300M300 500H1300M300 690H1300M300 880H1300"/>
      <path d="M460 260V940M700 260V940M940 260V940M1180 260V940"/>
    </g>
    <rect x="${460+shift/2}" y="500" width="240" height="190" fill="${a}" opacity=".92"/>
    <rect x="${940-shift/3}" y="310" width="240" height="190" fill="${b}" opacity=".88"/>
    <circle cx="820" cy="785" r="70" fill="${ink}" opacity=".82"/>
  `;

  if (motif === 'waves') return `
    <path d="M180 620C360 430 520 810 700 620S1040 430 1220 620S1480 790 1560 610" fill="none" stroke="${a}" stroke-width="34" stroke-linecap="round"/>
    <path d="M160 760C350 590 520 920 710 760S1060 590 1240 760S1450 890 1560 730" fill="none" stroke="${ink}" stroke-width="10" opacity=".55"/>
    <g fill="${b}">
      <circle cx="${430+shift/3}" cy="300" r="28"/><circle cx="${760-shift/4}" cy="250" r="20"/><circle cx="${1050+shift/5}" cy="340" r="34"/>
    </g>
  `;

  if (motif === 'rings') return `
    <g fill="none" stroke-linecap="round">
      <circle cx="800" cy="600" r="360" stroke="${ink}" stroke-width="12" opacity=".35"/>
      <circle cx="800" cy="600" r="270" stroke="${b}" stroke-width="22" opacity=".62"/>
      <circle cx="800" cy="600" r="165" stroke="${a}" stroke-width="34" opacity=".9"/>
    </g>
    <path d="M800 600L${1090-shift/3} ${420+shift/4}" stroke="${ink}" stroke-width="13" stroke-linecap="round"/>
    <circle cx="800" cy="600" r="34" fill="${ink}"/>
  `;

  if (motif === 'layers') return `
    <rect x="330" y="250" width="620" height="700" rx="90" fill="${a}" opacity=".55" transform="rotate(-8 640 600)"/>
    <rect x="650" y="250" width="620" height="700" rx="90" fill="${b}" opacity=".58" transform="rotate(9 960 600)"/>
    <circle cx="${800+shift/4}" cy="600" r="210" fill="${ink}" opacity=".18"/>
    <path d="M470 810C700 680 900 900 1180 690" fill="none" stroke="${ink}" stroke-width="12" opacity=".65"/>
  `;

  return `
    <path d="M230 650H410L500 420L620 790L760 540L880 630L1010 360L1130 760L1370 560" fill="none" stroke="${ink}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${500+shift/4}" cy="420" r="34" fill="${a}"/>
    <circle cx="${1010-shift/5}" cy="360" r="48" fill="${b}"/>
    <rect x="270" y="870" width="1060" height="16" rx="8" fill="${a}" opacity=".45"/>
  `;
}

function articleArtSvg(record, motif) {
  const palette = artPalettes[record.category] || artPalettes.swiat;
  const seed = seededNumber(record.slug);
  const accentX = 180 + Math.round(seed * 1100);
  const accentY = 150 + Math.round((1 - seed) * 760);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
    <rect width="1600" height="1200" fill="#f3f0e8"/>
    <circle cx="${accentX}" cy="${accentY}" r="240" fill="${palette.accent2}" opacity=".13"/>
    <path d="M120 140H1480M120 1060H1480" stroke="#cbd2cc" stroke-width="4" opacity=".8"/>
    ${motifMarkup(motif, palette, seed)}
    <circle cx="1450" cy="150" r="16" fill="${palette.accent}" opacity=".85"/>
  </svg>`;
}

const publishedRecords = records.filter(record => record.date <= warsawToday);
const card = record => '<article class="article-card" data-category="' + record.category + '" data-search="' + escape(record.keywords) + '"><a class="card-link" href="artykuly/' + record.slug + '.html" aria-label="Czytaj: ' + escape(record.title) + '"></a><div class="card-topline"><span class="pill">' + categoryLabels[record.category] + '</span><time datetime="' + record.date + '">' + record.date.split('-').reverse().join('.') + '</time></div><div class="card-copy"><h3>' + escape(record.title) + '</h3><p>' + escape(record.excerpt) + '</p></div><div class="card-footer"><div class="card-meta"><span class="reading-time">' + record.minutes + ' min czytania</span></div></div></article>';

const assetNames = ['script.js', 'styles.css', 'manifest.webmanifest'];
for (const name of assetNames) await fs.copyFile(name, path.join(output, name));
try { await fs.copyFile('CNAME', path.join(output, 'CNAME')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const name of ['icon.svg', 'icon-192.svg', 'icon-512.svg']) await fs.copyFile('assets/brand.svg', path.join(output, name));
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await fs.mkdir(path.join(output, 'assets/articles'), { recursive: true });

for (const record of records) {
  if (record.image) {
    record.socialImage = record.image;
    continue;
  }

  const motif = chooseVisualMotif(record);
  const svg = articleArtSvg(record, motif);
  const heroFile = 'assets/articles/' + record.slug + '.webp';
  const socialFile = 'assets/articles/' + record.slug + '-social.jpg';

  await sharp(Buffer.from(svg))
    .resize(1600, 1200, { fit: 'cover' })
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(output, heroFile));

  await sharp(Buffer.from(svg))
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
    .toFile(path.join(output, socialFile));

  record.image = heroFile;
  record.socialImage = socialFile;
  record.imageAlt = visualAltFor(record, motif);
  record.imageCredit = record.imageCredit || 'Ilustracja: Poza Szumem';
  record.generatedArt = true;
}
try {
  await fs.cp('assets/articles', path.join(output, 'assets/articles'), { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await fs.copyFile('assets/LUCIDE-LICENSE.txt', path.join(output, 'assets/LUCIDE-LICENSE.txt'));
await bundle({ entryPoints: ['scripts/icons.mjs'], outfile: path.join(output, 'assets/lucide.min.js'), bundle: true, minify: true, format: 'iife', target: 'es2020' });
const brand = await fs.readFile('assets/brand.svg');
const icon = brand.toString('base64');
const shareSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f6f8f6"/><rect x="0" y="0" width="18" height="630" fill="#355f4a"/><image x="80" y="70" width="145" height="145" href="data:image/svg+xml;base64,' + icon + '"/><text x="80" y="340" font-family="Georgia,serif" font-size="100" fill="#171b18">Poza Szumem</text><text x="86" y="424" font-family="sans-serif" font-size="33" fill="#515c55">' + escape(tagline) + '</text></svg>';
await sharp(Buffer.from(shareSvg)).png().toFile(path.join(output, 'assets/share.png'));
await sharp(brand).resize(192, 192).png().toFile(path.join(output, 'assets/icon-192.png'));
await sharp(brand).resize(512, 512).png().toFile(path.join(output, 'assets/icon-512.png'));
const manifest = JSON.parse(await fs.readFile('manifest.webmanifest', 'utf8'));
manifest.icons = [{ src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }];
await fs.writeFile(path.join(output, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
const version = createHash('sha256').update(await fs.readFile('script.js')).update(await fs.readFile('styles.css')).update(await fs.readFile('scripts/icons.mjs')).update(brand).update(await fs.readFile('content/editorial.json')).update(JSON.stringify(records.map(record => [record.slug, record.date, record.title, record.excerpt, record.visualMotif, record.visualAlt]))).digest('hex').slice(0, 12);

function metadata($, title, description, file, schema, socialImage = '') {
  $('title').text(title);
  $('meta[name="description"]').attr('content', description);
  $('head').find('link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]').remove();
  const url = new URL(file, site).href;
  const image = socialImage ? new URL(socialImage, site).href : new URL('assets/share.png', site).href;
  $('head').append('<link rel="canonical" href="' + url + '"><meta property="og:type" content="' + (schema?.['@type'] === 'Article' ? 'article' : 'website') + '"><meta property="og:locale" content="pl_PL"><meta property="og:site_name" content="Poza Szumem"><meta property="og:title" content="' + escape(title) + '"><meta property="og:description" content="' + escape(description) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + image + '"><meta name="twitter:card" content="summary_large_image">');
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
  $('script[src*="lucide"]').attr('src', 'assets/lucide.min.js?v=' + version);
  $('link[rel="alternate"][type="application/rss+xml"]').attr('href', 'feed.xml');
  const isArticlePage = $('.article-shell').length > 0;
  const mainTarget = isArticlePage ? 'article-content' : 'main-content';
  const skipLabel = isArticlePage ? 'Przejdź do treści artykułu' : 'Przejdź do treści';
  if (!$('.skip-link').length) $('body').prepend('<a class="skip-link" href="#' + mainTarget + '">' + skipLabel + '</a>');
  $('.skip-link').attr('href', '#' + mainTarget).text(skipLabel);
  $('main').attr('id', mainTarget);
  $('.brand').attr('href', 'index.html');
  $('.brand-mark').html('<img class="brand-symbol" src="icon.svg?v=' + version + '" alt="" width="36" height="36">');
  $('.search-toggle, .theme-toggle, .library-actions').attr('data-requires-js', '');
  if ($('.library').length) {
    const heading = $('body').hasClass('home') ? 'Biblioteka' : 'Teksty';
    $('.library').attr('data-default-heading', heading);
    $('.library-title').html('<h2><span data-library-heading>' + heading + '</span></h2><p class="library-count" role="status" aria-live="polite">' + textCount($('.article-card').length) + '</p>');
    if (!$('#clear-filters').length) $('.library-actions').append('<button id="clear-filters" class="clear-filters" type="button" hidden>Wyczyść filtry</button>');
    $('.category-menu summary').text('Wszystkie tematy');
    if ($('body').attr('data-category')) {
      $('.category-menu').each((_, node) => {
        for (const sibling of [node.prev, node.next]) {
          if (sibling?.type === 'text' && !sibling.data.trim()) sibling.data = '\n';
        }
      }).remove();
    }
  }
  $('.article-back, .article-end a').attr('href', 'index.html#artykuly');
  if (!$('.primary-nav').length) $('.header-actions').before('<nav class="primary-nav" aria-label="Główna nawigacja"></nav>');
  $('.primary-nav').html('<a href="index.html#artykuly" data-library-view>Biblioteka</a><a href="kategorie/index.html">Kategorie</a><a href="index.html#saved" data-saved-view>Zapisane</a>');
  if (file.startsWith('kategorie/')) $('.primary-nav a[href="kategorie/index.html"]').attr('aria-current', 'page');
  $('footer').html('<span>Poza Szumem</span><nav aria-label="Stopka"><a href="wybor-tygodnia.html">Wybór tygodnia</a><a href="serie/index.html">Serie</a><a href="feed.xml">RSS</a></nav>');
  $('input[name="library-view"]').each((_, node) => {
    const input = $(node);
    const list = input.attr('value') === 'list';
    input.attr('aria-label', list ? 'Lista' : 'Karty');
    input.next('span').html('<i data-lucide="' + (list ? 'rows-3' : 'columns-2') + '"></i>');
  });
  $('script[data-theme-init]').remove();
  $('head').prepend('<script data-theme-init>document.documentElement.classList.add("js");try{var t=localStorage.getItem("poza-szumem-theme");document.documentElement.dataset.theme=t==="dark"||t==="light"?t:(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}catch(e){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}</script>');
  relativeLinks($, file);
  const target = path.join(output, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, $.html());
}

const keywordSet = record => {
  const raw = Array.isArray(record.keywords) ? record.keywords : String(record.keywords || '').split(',');
  return new Set(raw.map(value => String(value).trim().toLocaleLowerCase('pl-PL')).filter(Boolean));
};

const relatedFor = record => {
  const ownKeywords = keywordSet(record);
  return publishedRecords
    .filter(candidate => candidate.slug !== record.slug)
    .map(candidate => {
      let score = 0;
      if (record.series && candidate.series === record.series) score += 7;
      if (candidate.category === record.category) score += 4;
      const overlap = [...keywordSet(candidate)].filter(keyword => ownKeywords.has(keyword)).length;
      score += Math.min(6, overlap * 2);
      if (candidate.date > record.date) score += 0.5;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date) || a.candidate.title.localeCompare(b.candidate.title, 'pl'))
    .slice(0, 3)
    .map(item => item.candidate);
};

for (const record of publishedRecords) {
  const $ = record.$;
  const heading = $('.article-heading');
  $('.article-sources, .article-toc').remove();

  const updatedLabel = record.updated !== record.date
    ? ' · Aktualizacja: ' + record.updated.split('-').reverse().join('.')
    : '';
  const seriesMarkup = record.series
    ? '<p class="series-link"><a href="serie/' + slugify(record.series) + '.html">' + escape(record.series) + '</a></p>'
    : '<p class="series-link" hidden></p>';

  const heroMediaMarkup = record.image
    ? '<figure class="article-hero-media">' +
        '<img src="' + escape(record.image) + '" alt="' + escape(record.imageAlt) + '" loading="eager" decoding="async" fetchpriority="high">' +
        (record.imageCredit ? '<figcaption>' + escape(record.imageCredit) + '</figcaption>' : '') +
      '</figure>'
    : '';

  heading.html(
    '<div class="article-kicker-row">' +
      '<div class="article-kicker-info">' +
        '<span class="article-category">' + escape(categoryLabels[record.category]) + '</span>' +
        '<div class="article-meta">' + escape(record.date.split('-').reverse().join('.') + ' · ' + record.minutes + ' min czytania') + '</div>' +
      '</div>' +
      '<div class="article-actions" aria-label="Akcje artykułu"></div>' +
    '</div>' +
    '<div class="article-hero-grid' + (record.image ? ' has-image' : '') + (record.generatedArt ? ' has-generated-art' : '') + '">' +
      '<div class="article-hero-copy">' +
        '<h1 class="article-title">' + escape(record.title) + '</h1>' +
        '<p class="article-deck">' + escape(record.excerpt) + '</p>' +
        '<div class="article-heading-footer">' +
          '<div class="article-author">' +
            '<span class="article-author-avatar" aria-hidden="true">PS</span>' +
            '<div class="article-author-copy">' +
              '<p class="article-byline">' + escape(record.author) + escape(updatedLabel) + '</p>' +
              seriesMarkup +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      heroMediaMarkup +
    '</div>'
  );

  $('.article-end').html('<a href="index.html#artykuly">Wróć do biblioteki →</a>');

  // Normalize legacy HTML articles to the current reading structure.
  $('.article-shell').attr('id', 'article-content');
  if ($('.skip-link').length) {
    $('.skip-link').attr('href', '#article-content').text('Przejdź do treści artykułu');
  } else {
    $('body').prepend('<a class="skip-link" href="#article-content">Przejdź do treści artykułu</a>');
  }

  const body = $('.article-body');
  if (!$('.article-reading-layout').length) {
    body.wrap('<div class="article-reading-main"></div>');
    body.parent().wrap('<div class="article-reading-layout"></div>');
  } else if (!body.parent().hasClass('article-reading-main')) {
    body.wrap('<div class="article-reading-main"></div>');
  }
  if (record.slug === 'czlowiek-ktory-zawsze-czekal-na-lepszy-moment') body.html(body.html().replace('W 2009 roku Karl Pillemer', 'W 2004 roku Karl Pillemer'));
  const paragraphs = body.find('p').toArray();
  paragraphs.forEach((node, index) => { $(node).attr('id', 'reading-p-' + index); });
  for (const [index, title] of record.headings) {
    const existing = body.find('#section-' + index);
    if (existing.length) existing.text(title);
    else if (paragraphs[index]) $(paragraphs[index]).before('<h2 id="section-' + index + '">' + escape(title) + '</h2>');
  }
  const headings = body.find('h2, h3').toArray();
  const readingLayout = $('.article-reading-layout');
  readingLayout.find('.article-toc').remove();
  if (headings.length > 1) {
    const items = headings.map((node, index) => {
      $(node).attr('id', $(node).attr('id') || 'section-' + index);
      const id = $(node).attr('id');
      const label = escape($(node).text());
      return '<li><a class="toc-link" href="#' + id + '" data-toc-target="' + id + '">' + label + '</a></li>';
    }).join('');
    readingLayout.append(
      '<aside class="article-toc" aria-label="Spis treści">' +
        '<div class="article-toc-sticky">' +
          '<p class="article-toc-label">W tym tekście</p>' +
          '<nav class="article-toc-desktop" aria-label="Sekcje artykułu"><ol>' + items + '</ol></nav>' +
          '<details class="article-toc-mobile"><summary>W tym tekście</summary><ol>' + items + '</ol></details>' +
        '</div>' +
      '</aside>'
    );
  }

  if (record.sources.length) $('.article-end').before('<section class="article-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Dalsza lektura</h2><ul>' + record.sources.map(source => '<li><a href="' + escape(source.url) + '" rel="noopener noreferrer">' + escape(source.title) + '</a></li>').join('') + '</ul></section>');

  $('.related-articles').remove();
  const related = relatedFor(record);
  if (related.length) {
    const relatedCards = related.map(item =>
      '<a class="related-link" href="artykuly/' + item.slug + '.html">' +
        '<span class="related-meta">' + escape(categoryLabels[item.category]) + ' · ' + item.minutes + ' min</span>' +
        '<span class="related-title">' + escape(item.title) + '</span>' +
        '<span class="related-excerpt">' + escape(item.excerpt) + '</span>' +
        '<span class="related-arrow" aria-hidden="true">↗</span>' +
      '</a>'
    ).join('');

    $('.article-end').after(
      '<section class="related-articles" aria-labelledby="related-heading">' +
        '<div class="related-heading">' +
          '<p class="related-kicker">Czytaj dalej</p>' +
          '<h2 id="related-heading">Jeszcze kilka rzeczy, które mogą Cię zainteresować</h2>' +
        '</div>' +
        '<div class="related-list">' + relatedCards + '</div>' +
      '</section>'
    );
  }

  metadata($, record.title + ' — Poza Szumem', record.excerpt, 'artykuly/' + record.slug + '.html', {
    '@type': 'Article', headline: record.title, description: record.excerpt, datePublished: record.date, dateModified: record.updated, author: { '@type': 'Organization', name: record.author }, publisher: { '@type': 'Organization', name: settings.publisher }, mainEntityOfPage: new URL('artykuly/' + record.slug + '.html', site).href, image: new URL(record.socialImage || record.image || 'assets/share.png', site).href, inLanguage: 'pl', wordCount: $('.article-body').text().trim().split(/\s+/).length
  }, record.socialImage || record.image);
  await writePage($, 'artykuly/' + record.slug + '.html');
}
home('.article-grid').html(publishedRecords.map(card).join(''));
home('.hero-copy p').text(tagline);
home('.library-count').text(textCount(publishedRecords.length));
home('.library').after(home('.categories-section'));
const recommendationRotationDays = Math.max(2, Math.min(14, Number(settings.recommendedRotationDays) || 3));
const recommendationRotationStart = /^\d{4}-\d{2}-\d{2}$/.test(settings.recommendedRotationStart || '')
  ? settings.recommendedRotationStart
  : warsawToday;
const recommendationStartDay = Math.floor(Date.parse(recommendationRotationStart + 'T00:00:00Z') / 86400000);
const recommendationTodayDay = Math.floor(Date.parse(warsawToday + 'T00:00:00Z') / 86400000);
const recommendationWindow = Math.max(0, Math.floor((recommendationTodayDay - recommendationStartDay) / recommendationRotationDays));
const recommendationWindowStartDay = recommendationStartDay + recommendationWindow * recommendationRotationDays;
const recommendationWindowStart = new Date(recommendationWindowStartDay * 86400000).toISOString().slice(0, 10);

const recommendationPool = publishedRecords.filter(record => record.date < recommendationWindowStart);
const recommendationCandidates = recommendationPool.length >= 3 ? recommendationPool : publishedRecords;
const recommendationSignature = recommendationCandidates.map(record => record.slug).sort().join('|');
const recommendationIndexForWindow = window => Math.floor(
  seededNumber('featured:' + window + ':' + recommendationSignature) * recommendationCandidates.length
);

let recommendationIndex = recommendationIndexForWindow(recommendationWindow);
if (recommendationCandidates.length > 1 && recommendationWindow > 0) {
  const previousIndex = recommendationIndexForWindow(recommendationWindow - 1);
  if (recommendationIndex === previousIndex) recommendationIndex = (recommendationIndex + 1) % recommendationCandidates.length;
}
const recommended = recommendationCandidates[recommendationIndex] || publishedRecords[0];

home('.featured-reading')
  .attr('data-recommended-slug', recommended.slug)
  .attr('data-recommendation-window', String(recommendationWindow))
  .attr('data-rotation-days', String(recommendationRotationDays))
  .removeClass('wrap')
  .html('<div class="wrap featured-inner"><span class="featured-label" id="featured-heading">Polecany tekst</span><div class="featured-meta"><span>' + categoryLabels[recommended.category] + '</span><span>' + recommended.minutes + ' min czytania</span></div><h2><a href="artykuly/' + recommended.slug + '.html">' + escape(recommended.title) + '</a></h2><p>' + escape(recommended.excerpt) + '</p><a class="featured-cta" href="artykuly/' + recommended.slug + '.html">Przeczytaj tekst</a></div>');

const categoryCounts = Object.entries(categoryLabels).map(([id, name]) => ({ id, name, count: publishedRecords.filter(record => record.category === id).length })).filter(category => category.count);
home('.category-index').html(categoryCounts.map(category => '<a href="kategorie/' + category.id + '.html"><span>' + category.name + '</span><small>' + textCount(category.count) + '</small></a>').join(''));
metadata(home, 'Poza Szumem — teksty warte uwagi', 'Spokojna biblioteka esejów, reportaży i tekstów, do których warto wracać.', 'index.html', { '@type': 'WebSite', name: 'Poza Szumem', url: site.href, inLanguage: 'pl' });
await writePage(home, 'index.html');

const pageFiles = ['index.html', ...publishedRecords.map(record => 'artykuly/' + record.slug + '.html')];
function collection(title, excerpt, subset, file, category) {
  const $ = load(homepage);
  $('body').removeClass('home');
  if (category) $('body').attr('data-category', category);
  $('.hero h1').text(title);
  $('.hero p').text(excerpt);
  $('.hero-orbit, .featured-reading, .categories-section').remove();
  $('.article-grid').html(subset.map(card).join(''));
  $('.library-count').text(textCount(subset.length));
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
categoryIndex('.category-index').html(categoryCounts.map(category => '<a href="kategorie/' + category.id + '.html"><span>' + category.name + '</span><small>' + textCount(category.count) + '</small></a>').join(''));
metadata(categoryIndex, 'Kategorie — Poza Szumem', 'Teksty z biblioteki Poza Szumem według tematów.', 'kategorie/index.html', { '@type': 'CollectionPage', name: 'Kategorie', inLanguage: 'pl' });
await writePage(categoryIndex, 'kategorie/index.html');
pageFiles.push('kategorie/index.html');
for (const category of categoryCounts) {
  const file = 'kategorie/' + category.id + '.html';
  const $ = collection(category.name, 'Eseje i teksty z kategorii ' + category.name.toLocaleLowerCase('pl-PL') + '.', publishedRecords.filter(record => record.category === category.id), file, category.id);
  await writePage($, file);
}
const seriesNames = [...new Set(publishedRecords.map(record => record.series).filter(Boolean))];
const seriesIndex = load(homepage);
seriesIndex('.hero h1').text('Serie');
seriesIndex('.hero p').text('Historie i idee połączone wspólnym tematem.');
seriesIndex('.featured-reading, .library, .hero-orbit, .search-toggle, .hero-discovery').remove();
seriesIndex('#categories-heading').text('Serie tematyczne');
seriesIndex('.category-index').html(seriesNames.map(name => '<a href="serie/' + slugify(name) + '.html"><span>' + escape(name) + '</span><small>' + textCount(publishedRecords.filter(record => record.series === name).length) + '</small></a>').join(''));
metadata(seriesIndex, 'Serie — Poza Szumem', 'Serie tematyczne z biblioteki Poza Szumem.', 'serie/index.html', { '@type': 'CollectionPage', name: 'Serie', inLanguage: 'pl' });
await writePage(seriesIndex, 'serie/index.html');
pageFiles.push('serie/index.html');
for (const name of seriesNames) {
  const file = 'serie/' + slugify(name) + '.html';
  const $ = collection(name, 'Seria tematyczna Poza Szumem.', publishedRecords.filter(record => record.series === name), file);
  await writePage($, file);
}
const latest = new Date(publishedRecords[0].date + 'T12:00:00Z');
const weekStart = new Date(latest);
weekStart.setUTCDate(latest.getUTCDate() - (latest.getUTCDay() + 6) % 7);
const weekDate = weekStart.toISOString().slice(0, 10);
const recent = publishedRecords.filter(record => record.date >= weekDate);
const weekly = [];
const used = new Set();
for (const record of [...recent, ...publishedRecords]) {
  if (!used.has(record.category) && !weekly.some(item => item.slug === record.slug)) { weekly.push(record); used.add(record.category); }
  if (weekly.length === 3) break;
}
const weekPage = collection('Wybór tygodnia', 'Trzy teksty z różnych tematów · tydzień od ' + weekDate.split('-').reverse().join('.'), weekly, 'wybor-tygodnia.html');
await writePage(weekPage, 'wybor-tygodnia.html');
const feed = new Feed({
  title: 'Poza Szumem', description: 'Eseje, reportaże i teksty warte uwagi.', id: site.href, link: site.href, language: 'pl',
  image: new URL('assets/share.png', site).href, favicon: new URL('icon.svg', site).href,
  copyright: 'Poza Szumem', updated: new Date(publishedRecords[0].date), feedLinks: { rss2: new URL('feed.xml', site).href }
});
for (const record of publishedRecords) feed.addItem({ title: record.title, id: new URL('artykuly/' + record.slug + '.html', site).href, link: new URL('artykuly/' + record.slug + '.html', site).href, description: record.excerpt, date: new Date(record.date), author: [{ name: record.author }], category: [{ name: categoryLabels[record.category] }] });
await fs.writeFile(path.join(output, 'feed.xml'), feed.rss2());
const sitemap = load('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { xmlMode: true });
for (const file of pageFiles) {
  const record = publishedRecords.find(item => file === 'artykuly/' + item.slug + '.html');
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
await fs.writeFile(path.join(output, 'data/articles.json'), JSON.stringify(publishedRecords.map(({ $, headings, sourcePath, ...record }) => record), null, 2));
const schedule = JSON.parse(await fs.readFile('content/schedule.json', 'utf8'));
const adminData = {
  schedule: Array.isArray(schedule.items) ? schedule.items : [],
  articles: records.map(record => ({
    published: record.date <= warsawToday,
    slug: record.slug,
    title: record.title,
    date: record.date,
    category: record.category,
    minutes: record.minutes,
    image: record.image,
    imageAlt: record.imageAlt
  })),
  categories: categoryLabels
};
await fs.mkdir(path.join(output, 'admin'), { recursive: true });
for (const name of ['index.html', 'dashboard.css', 'dashboard.js']) {
  await fs.copyFile(path.join('admin', name), path.join(output, 'admin', name));
}
await fs.writeFile(path.join(output, 'admin', 'data.json'), JSON.stringify(adminData, null, 2));
let worker = await fs.readFile('sw.js', 'utf8');
worker = worker.replace(/const CACHE_NAME = CACHE_PREFIX \+ '[^']+';/, "const CACHE_NAME = CACHE_PREFIX + '" + version + "';");
worker = worker.replace(/(script\.js|styles\.css)\?v=[a-z0-9]+/g, '$1?v=' + version);
if (!worker.includes("assets/lucide.min.js")) worker = worker.replace("'icon.svg', 'icon-192.svg', 'icon-512.svg'", "'icon.svg', 'icon-192.svg', 'icon-512.svg', 'assets/lucide.min.js', 'assets/icon-192.png', 'assets/icon-512.png'");
worker = worker.replace(/'assets\/lucide\.min\.js(?:\?v=[a-z0-9]+)?'/, "'assets/lucide.min.js?v=" + version + "'");
await fs.writeFile(path.join(output, 'sw.js'), worker);
await fs.writeFile(path.join(output, '.nojekyll'), '');
console.log('Built ' + publishedRecords.length + ' published articles and kept ' + (records.length - publishedRecords.length) + ' scheduled drafts; asset version ' + version);
