import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };
const port = Number(process.env.PORT || 5173);
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let filename = path.resolve(root, '.' + pathname);
    if (filename !== path.resolve(root) && !filename.startsWith(path.resolve(root) + path.sep)) {
      response.writeHead(403).end('Forbidden'); return;
    }
    const stat = await fs.stat(filename);
    if (stat.isDirectory()) filename = path.join(filename, 'index.html');
    const data = await fs.readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Page not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
