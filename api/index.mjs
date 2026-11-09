import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { createCMS } from '../scripts/cms-server.mjs';
import { createBlobStorage } from '../scripts/blob-storage.mjs';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
export const config={api:{bodyParser:false}};
async function notFound(response) {
  const html = await fs.readFile(path.join(root, '404.html'));
  response.writeHead(404, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex' });
  response.end(html);
}

export default async function handler(request,response) {
  try {
    const incoming=new URL(request.url,'https://'+request.headers.host);
    const route=incoming.searchParams.get('__route') || incoming.pathname;
    incoming.searchParams.delete('__route');
    const url=new URL(route+'?'+incoming.searchParams.toString(),incoming.origin);
    if(url.pathname.startsWith('/api/'))url.pathname=url.pathname.replace(/\/+$/,'');
    const storage=createBlobStorage();
    if(url.pathname.startsWith('/media/uploads/')){
      const name=url.pathname.slice('/media/uploads/'.length);
      if(!/^[a-zA-Z0-9._-]+$/.test(name))return response.status(404).end('Not found');
      const file=await storage.getUpload(name);
      if(!file)return response.status(404).end('Not found');
      response.writeHead(200,{'Content-Type':file.blob.contentType || 'application/octet-stream','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
      return Readable.fromWeb(file.stream).pipe(response);
    }
    const cms=await createCMS({root,dataDirectory:'/webly-data',cookieName:'webly_admin',storage,publicOrigin:incoming.origin});
    if(await cms.handle(request,response,url))return;
    const pathname=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
    if(!cms.isKnownPage(pathname)||cms.isHidden(pathname,request,url))return notFound(response);
    const filename=path.resolve(root,'.'+cms.templatePath(pathname),'index.html');
    if(!filename.startsWith(path.resolve(root)+path.sep))return notFound(response);
    const html=cms.renderHTML(await fs.readFile(filename,'utf8'),pathname,request,url);
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    response.end(html);
  } catch(error) {
    console.error('Hosted CMS request failed:',error.message);
    response.statusCode=error.status || 503;
    response.setHeader('Cache-Control','no-store');
    response.end('The site is temporarily unavailable. Please try again shortly.');
  }
}
