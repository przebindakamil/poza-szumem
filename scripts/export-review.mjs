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
for (const [file, value] of Object.entries(snapshot)) {
  const total = Math.ceil(value.content.length / 16000) || 1;
  for (let index = 0; index < total; index++) console.log('SITE_CHUNK ' + JSON.stringify({ file, encoding: value.encoding, index, total, content: value.content.slice(index * 16000, (index + 1) * 16000) }));
}
for (const name of ['desktop', 'mobile']) {
  const data = await fs.readFile('test-results/home-' + name + '.png');
  const content = data.toString('base64');
  const total = Math.ceil(content.length / 16000);
  for (let index = 0; index < total; index++) console.log('QA_CHUNK ' + JSON.stringify({ name, index, total, content: content.slice(index * 16000, (index + 1) * 16000) }));

}
