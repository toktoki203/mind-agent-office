import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, resolve, sep } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const type = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const decoded = decodeURIComponent(url.pathname);
    const path = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    if (['/docs/', '/tests/', '/scripts/', '/.github/'].some(prefix => decoded.startsWith(prefix))) { res.writeHead(404).end('Not found'); return; }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'content-type': `${type[extname(path)] || 'application/octet-stream'}; charset=utf-8`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, host, () => console.log(`MinD Agent Office running at http://${host}:${port}`));
