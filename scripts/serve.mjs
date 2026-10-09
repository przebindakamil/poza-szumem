import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.env.SITE_DIR || '.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/poza-szumem(?=\/|$)/, '').replace(/^\/+/, '');
    let target = path.resolve(root, relative || 'index.html');
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Forbidden');
    const info = await fs.stat(target);
    if (info.isDirectory()) target = path.join(target, 'index.html');
    const data = await fs.readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(data);
  } catch (_) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
}).listen(4173, '127.0.0.1');
