import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createCMS } from './cms-server.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };
const port = Number(process.env.PORT || 5173);
const cms = await createCMS({ root, dataDirectory: process.env.CMS_DATA_DIR || fileURLToPath(new URL('../.local/', import.meta.url)), cookieName:'endcap_admin_'+port });
const notFoundPage = await fs.readFile(path.join(root, '404.html'));
function notFound(response, draft = false) {
  response.writeHead(404, { 'Content-Type': draft ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  response.end(draft ? 'Sign in to the admin to preview this page.' : notFoundPage);
}
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (await cms.handle(request, response, url)) return;
    const pathname = decodeURIComponent(url.pathname);
    if(!pathname.startsWith('/admin')&&!pathname.startsWith('/media/')&&!pathname.startsWith('/cms/')&&(/\.html$/.test(pathname)||!path.posix.extname(pathname))&&!cms.isKnownPage(pathname))return notFound(response);
    if (cms.isHidden(pathname, request, url)) return notFound(response, url.searchParams.get('preview') === 'draft');
    if (pathname === '/admin') { response.writeHead(302, { Location: '/admin/' }).end(); return; }
    const template=cms.isKnownPage(pathname)?cms.templatePath(pathname):pathname;
    let filename = path.resolve(root, '.' + template);
    if (filename !== path.resolve(root) && !filename.startsWith(path.resolve(root) + path.sep)) {
      response.writeHead(403).end('Forbidden'); return;
    }
    const stat = await fs.stat(filename);
    if (stat.isDirectory()) {
      if (!pathname.endsWith('/')) { response.writeHead(308,{Location:pathname+'/'+url.search}).end(); return; }
      filename = path.join(filename, 'index.html');
    }
    let data = await fs.readFile(filename);
    if (path.extname(filename) === '.html') data = cms.renderHTML(data.toString('utf8'), pathname, request, url);
    const extension = path.extname(filename);
    const compressible = ['.html','.css','.js','.mjs','.svg','.json'].includes(extension);
    const compressed = compressible && Buffer.byteLength(data) > 1024 && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
    if (compressed) data = gzipSync(data);
    response.writeHead(200, { 'Content-Type': extension==='.mjs'?'text/javascript; charset=utf-8':types[extension] || 'application/octet-stream', 'Cache-Control': 'no-cache',
      ...(compressible ? { Vary: 'Accept-Encoding' } : {}), ...(compressed ? { 'Content-Encoding': 'gzip' } : {}),
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', ...(pathname.startsWith('/admin') ? { 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" } : {}) });
    response.end(data);
  } catch {
    notFound(response);
  }
}).listen(port, '127.0.0.1', () => console.log(`Website: http://localhost:${port}\nAdmin:   http://localhost:${port}/admin/`));
