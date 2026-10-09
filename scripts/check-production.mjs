import fs from 'node:fs/promises';
const { siteUrl } = JSON.parse(await fs.readFile('content/editorial.json', 'utf8'));
const pages = ['index.html', 'kategorie/index.html', 'wybor-tygodnia.html', 'feed.xml', 'sitemap.xml', 'assets/share.png'];
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    for (const page of pages) {
      const response = await fetch(new URL(page, siteUrl), { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(page + ': HTTP ' + response.status);
      if (page === 'index.html' && !(await response.text()).includes('data-saved-view')) throw new Error('Old homepage');
      if (page === 'feed.xml' && !(await response.text()).includes('<rss')) throw new Error('Invalid feed');
    }
    console.log('Production verified: ' + siteUrl);
    process.exit(0);
  } catch (error) {
    if (attempt === 11) throw error;
    console.log('Waiting for Pages: ' + error.message);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
