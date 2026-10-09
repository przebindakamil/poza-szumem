import fs from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file)); else result.push(file);
  }
  return result;
}
const snapshot = {};
for (const file of await walk('_site')) {
  const relative = path.relative('_site', file).split(path.sep).join('/');
  if (['script.js', 'styles.css', 'icon.svg', 'icon-192.svg', 'icon-512.svg', '.nojekyll'].includes(relative)) continue;
  const data = await fs.readFile(file);
  snapshot[relative] = { encoding: file.endsWith('.png') ? 'base64' : 'utf-8', content: data.toString(file.endsWith('.png') ? 'base64' : 'utf8') };
}
snapshot['package-lock.json'] = { encoding: 'utf-8', content: await fs.readFile('package-lock.json', 'utf8') };
console.log('SITE_SNAPSHOT ' + JSON.stringify(snapshot));
for (const name of ['desktop', 'mobile']) {
  const data = await fs.readFile('test-results/home-' + name + '.png');
  console.log('QA_IMAGE ' + JSON.stringify({ name, data: data.toString('base64') }));
}
