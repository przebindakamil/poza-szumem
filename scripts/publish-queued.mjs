import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const queueDir = path.join(root, 'planned');
const contentDir = path.join(root, 'content');
const now = new Date();
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
}).formatToParts(now);
const part = type => parts.find(item => item.type === type)?.value;
const today = [part('year'), part('month'), part('day')].join('-');
const hour = Number(part('hour'));
const manual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

if (!manual && hour !== 8) {
  console.log('Not 08:00 in Warsaw; skipping DST companion schedule.');
  process.exit(0);
}
await fs.mkdir(queueDir, { recursive: true });
const published = (await fs.readdir(contentDir)).filter(name => name.endsWith('.md') && !name.startsWith('_'));
for (const name of published) {
  const text = await fs.readFile(path.join(contentDir, name), 'utf8');
  if (new RegExp('^date:\\s*["\\\']?' + today + '["\\\']?\\s*$', 'm').test(text)) {
    console.log('Already published an article today: ' + name);
    process.exit(0);
  }
}
const queued = (await fs.readdir(queueDir)).filter(name => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name)).sort();
if (!queued.length) {
  console.log('Queue is empty; no publication today.');
  process.exit(0);
}
const name = queued[0];
const target = path.join(contentDir, name);
try { await fs.access(target); throw new Error('Slug already exists in content/: ' + name); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const source = path.join(queueDir, name);
const text = await fs.readFile(source, 'utf8');
if (!text.startsWith('---\n') || !text.includes('\n---\n')) throw new Error('Invalid Markdown frontmatter: ' + name);
if (!/^date:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m.test(text)) throw new Error('Missing date: ' + name);
for (const key of ['title', 'excerpt', 'category', 'author', 'series']) {
  if (!new RegExp('^' + key + ':\\s*\\S+', 'm').test(text)) throw new Error('Missing ' + key + ': ' + name);
}
const updated = text.replace(/^date:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m, 'date: "' + today + '"');
await fs.writeFile(target, updated);
await fs.unlink(source);
console.log('Published ' + name + ' with date ' + today);
