import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { migrateContent } from './content-migrations.mjs';
import { normalizeURL } from '../dist/cms/urls.mjs';
const scrypt = promisify(scryptCallback);
const fonts = new Set(['Hanken', 'Endcap Grotesk', 'Fraunces', 'Arial', 'Georgia', 'system-ui']);
const copy = value => structuredClone(value);
const text = (value, max = 10000) => String(value ?? '').slice(0, max);
const safeURL = (value,options) => normalizeURL(text(value,2000),options);
const problem = (status, message) => Object.assign(new Error(message), { status });
const pagePath = value => {
  try {
    const source=String(value || '/');
    let pathname=decodeURIComponent(new URL(source.startsWith('/')?source.replace(/^\/+/,'/'):source, 'http://cms.local').pathname).replace(/\/+/g,'/').replace(/\/index\.html$/i,'/');
    if(!path.posix.extname(pathname)&&!pathname.endsWith('/'))pathname+='/';
    return pathname;
  } catch { return ''; }
};

export async function createCMS({ root, dataDirectory, cookieName = 'endcap_admin', storage = null, publicOrigin = null }) {
  if (!storage) await fs.mkdir(dataDirectory, { recursive: true });
  const seed = JSON.parse(await fs.readFile(path.join(root, '../cms.seed.json'), 'utf8'));
  const storeFile = path.join(dataDirectory, 'content.json');
  const authFile = path.join(dataDirectory, 'admin.json');
  const read = async (file, fallback) => { if (storage && [storeFile,authFile].includes(file)) return storage.read(path.basename(file),fallback); try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } };
  const migration=await read(path.join(root,'../cms.migrations.json'),null);
  const migrations=migration?[migration]:[];
  let state = await read(storeFile, { revision: 1, draft: copy(seed), published: copy(seed), publishedAt: null, inquiries: [], activity: [], revisions: [] });
  let admin = await read(authFile, null);
  const sessions = new Map();
  const attempts = new Map();
  const inquiryLimits = new Map();
  let transaction = Promise.resolve();
  const atomic = async (file, value) => { if(storage)return storage.write(path.basename(file),value); const temporary = file + '.tmp'; await fs.writeFile(temporary, JSON.stringify(value), { mode: 0o600 }); await fs.rename(temporary, file); };
  const log = (action, detail = '') => { state.activity.unshift({ id: randomBytes(8).toString('hex'), action, detail, at: new Date().toISOString() }); state.activity = state.activity.slice(0, 100); };
  const mutate = action => { const result = transaction.then(async () => { const before = copy(state); try { const value = await action(); await atomic(storeFile, state); return value; } catch (error) { state = before; throw error; } }); transaction = result.catch(() => {}); return result; };
  for(const migration of migrations)if(!(state.appliedMigrations || []).includes(migration.id)) {
    const previous=copy(state.published);
    const changed=migrateContent(state.published,[migration])+migrateContent(state.draft,[migration]);
    state.appliedMigrations=[...(state.appliedMigrations || []),migration.id];
    if(changed){state.revisions.unshift({id:randomBytes(10).toString('hex'),at:new Date().toISOString(),label:'Before India / worldwide update',content:previous});state.revisions=state.revisions.slice(0,12);state.revision++;log('Studio location updated','India / worldwide map');}
    await atomic(storeFile,state);
  }
  const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(body)); };
  const body = async (request, limit = 25 * 1024 * 1024) => { const chunks = []; let bytes = 0; for await (const chunk of request) { bytes += chunk.length; if (bytes > limit) throw problem(413, 'This file is too large. The limit is 25 MB.'); chunks.push(chunk); } return Buffer.concat(chunks); };
  const payload = async request => { try { return JSON.parse((await body(request, 16 * 1024 * 1024)).toString()); } catch (error) { if (error.status) throw error; throw problem(400, 'Invalid JSON.'); } };
  const tokenFrom = request => new RegExp('(?:^|;\\s*)'+cookieName+'=([a-f0-9]+)').exec(request.headers.cookie || '')?.[1];
  const session = request => { const cookie = tokenFrom(request); const entry = sessions.get(cookie); if (entry && entry.expires > Date.now()) return entry; if (cookie) sessions.delete(cookie); return null; };
  const issueSession = async response => { const token = randomBytes(32).toString('hex'); const entry={ expires: Date.now() + 12 * 3600000, credentialVersion:admin.hash }; sessions.set(token,entry); if(storage)await storage.write('sessions/'+token+'.json',entry); response.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${publicOrigin?'; Secure':''}`); };
  const sameOrigin = request => {
    const expectedOrigin=publicOrigin || `http://${request.headers.host}`;
    if (!publicOrigin && !/^localhost(?::\d+)?$|^127\.0\.0\.1(?::\d+)?$/.test(request.headers.host || '')) throw problem(403, 'Use the localhost address to manage this site.');
    if (request.headers.origin && request.headers.origin !== expectedOrigin) throw problem(403, 'Cross-origin requests are not allowed.');
    if (!['GET', 'HEAD'].includes(request.method) && request.headers['x-cms-request'] !== '1') throw problem(403, 'The request could not be verified. Reload the dashboard.');
  };
  function validate(input) {
    if (!input || input.schema !== 1 || !Array.isArray(input.projects) || !Array.isArray(input.pages) || input.projects.length > 300) throw problem(400, 'This is not a valid site content file.');
    const out = copy(seed);
    for (const key of Object.keys(out.settings)) out.settings[key] = text(input.settings?.[key] ?? out.settings[key], 600);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.settings.email)) throw problem(400, 'Enter a valid contact email.');
    out.settings.instagram=safeURL(out.settings.instagram,{optional:true,webOnly:true,label:'Instagram URL'});
    for (const key of ['accent','paper','ink','muted','line']) {
      const value = input.theme?.[key];
      if (!/^#[a-f0-9]{6}$/i.test(value || '')) throw problem(400, 'Colors must be six-digit hex values.');
      out.theme[key] = value;
    }
    out.theme.customFonts = (input.theme?.customFonts || []).slice(0,20).map(font => {
      if (!/^[a-zA-Z][a-zA-Z0-9 -]{1,59}$/.test(font.name || '') || !/^\/media\/[a-zA-Z0-9/_.-]+\.(woff2?|ttf|otf)$/.test(font.url || '')) throw problem(400,'Use a valid font family name and a local font file.');
      return { name:font.name, url:font.url };
    });
    const availableFonts = new Set([...fonts,...out.theme.customFonts.map(f=>f.name)]);
    for (const key of ['bodyFont','headingFont','serifFont']) { if (!availableFonts.has(input.theme?.[key])) throw problem(400, 'Select one of the installed fonts.'); out.theme[key] = input.theme[key]; }
    out.theme.bodySize = Math.max(12, Math.min(24, Number(input.theme.bodySize) || 16));
    out.theme.headingScale = Math.max(.75, Math.min(1.3, Number(input.theme.headingScale) || 1));
    out.theme.animations = input.theme.animations !== false;
    out.navigation = (input.navigation || []).slice(0, 20).map(item => ({ label: text(item.label, 80), href: safeURL(item.href,{label:`Navigation link “${text(item.label,80)}”`}), visible: item.visible !== false }));
    const ids = new Set();
    out.projects = input.projects.map((p, index) => {
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(p.id || '') || ids.has(p.id)) throw problem(400, 'Each project needs a unique ID.');
      ids.add(p.id);
      const original = seed.projects.find(item => item.id === p.id);
      return { id: p.id, name: text(p.name, 150), category: text(p.category, 150), url: safeURL(p.url,{label:`${text(p.name,150) || 'Project'} — Project URL`}), image: safeURL(p.image,{label:`${text(p.name,150) || 'Project'} — Cover image URL`}), screen: safeURL(p.screen,{optional:true,label:`${text(p.name,150) || 'Project'} — Screen overlay URL`}), alt: text(p.alt, 500), description: text(p.description, 3000), status: p.status === 'draft' ? 'draft' : 'published', featured: !!p.featured, homeVisible: p.homeVisible !== false, order: index, ...(original?.template ? { template: original.template } : {}) };
    });
    if (out.projects.filter(p => p.featured && p.status === 'published').length > 1) throw problem(400, 'Only one project can be featured.');
    const inputPages = new Map(input.pages.map(page => [page.path, page]));
    for (const page of out.pages) {
      const incoming = inputPages.get(page.path);
      if (!incoming) continue;
      page.title = text(incoming.title, 250); page.description = text(incoming.description, 1000); page.visible = incoming.visible !== false;
      const fields = new Map((incoming.fields || []).map(field => [field.id, field.value]));
      for (const field of page.fields) if (fields.has(field.id)) field.value = text(fields.get(field.id), 10000);
    }
    migrateContent(out,migrations);
    return out;
  }
  async function mediaList() {
    const result = [];
    async function walk(directory) {
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(absolute);
        else if (/\.(png|jpe?g|webp|gif|avif|svg|pdf|mp4|woff2?|ttf|otf)$/i.test(entry.name)) {
          const stat = await fs.stat(absolute);
          const url = '/' + path.relative(root, absolute).split(path.sep).join('/');
          const ext = path.extname(entry.name).toLowerCase();
          result.push({ name: entry.name, url, bytes: stat.size, type: /\.(mp4)$/.test(ext) ? 'video' : /\.(pdf)$/.test(ext) ? 'document' : /\.(woff2?|ttf|otf)$/.test(ext) ? 'font' : 'image', uploaded: url.startsWith('/media/uploads/') });
        }
      }
    }
    await walk(path.join(root, 'media'));
    if(storage)result.push(...await storage.mediaList());
    return result;
  }
  const status = request => ({ authenticated: !!session(request), setupRequired: !admin, displayName: admin?.displayName || 'Studio admin' });
  const hiddenPaths = content => content.pages.filter(page=>page.visible===false).map(page=>page.path);
  const targetHidden = (href, content) => href?.startsWith('/') && !href.startsWith('//') && hiddenPaths(content).includes(pagePath(href));
  const snapshot = (content,pathname,preview=false) => ({
    settings:content.settings,theme:content.theme,
    projects:content.projects.filter(p=>p.status==='published'&&!targetHidden(p.url,content)).map(({template,...p})=>p),
    navigation:content.navigation.filter(n=>n.visible&&!targetHidden(n.href,content)),
    hiddenPaths:hiddenPaths(content),page:content.pages.find(p=>p.path===pagePath(pathname)),version:state.revision,...(preview?{preview:true}:{})
  });
  return {
    isKnownPage(pathname) { return state.published.pages.some(p=>p.path===pagePath(pathname)); },
    isHidden(pathname, request, url) {
      const preview=url?.searchParams.get('preview')==='draft';
      if(preview)return !session(request);
      return state.published.pages.find(p=>p.path===pagePath(pathname))?.visible===false;
    },
    renderHTML(html, pathname, request, url) {
      const content = url.searchParams.get('preview') === 'draft' && session(request) ? state.draft : state.published;
      const page = content.pages.find(p => p.path === pagePath(pathname));
      if (!page) return html;
      const escape = value => String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      // Apply the saved palette before the first paint, without waiting for /api/site.
      const palette = Object.fromEntries(['accent','paper','ink','muted','line'].map(key => [key, /^#[a-f0-9]{6}$/i.test(content.theme[key]) ? content.theme[key] : seed.theme[key]]));
      const initialTheme = `:root{--lime:${palette.accent};--acid:${palette.accent};--paper:${palette.paper};--ink:${palette.ink};--muted:${palette.muted};--line:${palette.line}}`;
      html = html.replace('</head>', `<style id="cms-initial-theme">${initialTheme}</style></head>`);
      html = html.replace(/<meta\b[^>]*name=["']theme-color["'][^>]*>/i, tag => tag.replace(/content=(["'])[\s\S]*?\1/i, `content="${palette.paper}"`));
      if (page.path === '/' && content.theme.animations !== false) {
        const accent = /^#[a-f0-9]{6}$/i.test(content.theme.accent) ? content.theme.accent : '#b7e1c4';
        const channels = accent.slice(1).match(/../g).map(hex => { const value = parseInt(hex,16)/255; return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4; });
        const luminance = channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
        const contrast = luminance > .179 ? '#181a17' : '#ffffff';
        const name = content.settings.siteName;
        const letters = [...name].map((letter,index) => `<span class="webly-intro-letter" style="--letter-index:${index}">${escape(letter)}</span>`).join('');
        const intro = `<section class="webly-intro" aria-label="${escape(name)} introduction" style="--intro-primary:${accent};--intro-contrast:${contrast}"><div class="webly-intro-top"><span>Web &amp; AI Studio</span><button class="webly-intro-skip" type="button">Skip intro ↗</button></div><div class="webly-intro-center"><div class="webly-intro-word" aria-label="${escape(name)}"><span aria-hidden="true">${letters}<span class="webly-intro-period">.</span></span></div><p class="webly-intro-caption">Thoughtfully designed. Carefully built.</p></div><div class="webly-intro-bottom"><i class="webly-intro-track" aria-hidden="true"></i><i class="webly-intro-progress" aria-hidden="true"></i><span>Ideas into experiences.</span><span>${escape(name)} studio © ${new Date().getFullYear()}</span></div></section>`;
        html = html.replace('</head>', `<meta name="webly-intro" content="${escape(name + ':' + accent)}"><link rel="stylesheet" href="/cms/intro.css"><script src="/cms/intro.js"></script></head>`);
        html = html.replace(/<body\b[^>]*>/i, tag => tag + intro);
      }
      html = html.replace(/<title>[\s\S]*?<\/title>/i,()=>'<title>'+escape(page.title)+'</title>');
      html=html.replace(/<meta\b[^>]*>/gi, tag => {
        let value;
        if (/(?:name|property)=["'](?:description|og:description|twitter:description)["']/i.test(tag)) value=page.description;
        else if (/(?:name|property)=["'](?:og:title|twitter:title)["']/i.test(tag)) value=page.title;
        return value === undefined ? tag : tag.replace(/content=(["'])[\s\S]*?\1/i,()=>`content="${escape(value)}"`);
      });
      html=html.replace(/<article\b[^>]*data-project-id=["'][^"']+["'][^>]*>[\s\S]*?<\/article>/gi,article=>{
        const href=/\bhref=["']([^"']+)["']/.exec(article)?.[1];return targetHidden(href,content)?'':article;
      });
      return html.replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi,(anchor,quote,href)=>targetHidden(href,content)?'':anchor);
    },
    async handle(request, response, url) {
      if(storage){const token=tokenFrom(request);if(token){const entry=await storage.read('sessions/'+token+'.json',null);if(entry&&entry.credentialVersion===admin?.hash)sessions.set(token,entry);}}
      if (!url.pathname.startsWith('/api/')) return false;
      try {
        sameOrigin(request);
        const route = url.pathname;
        if (route === '/api/site' && request.method === 'GET') {
          const content = state.published;
          const data=snapshot(content,url.searchParams.get('path'));
          if(!data.page||data.page.visible===false)throw problem(404,'Page not found.');
          return json(response, 200, data), true;
        }
        if (route === '/api/admin/session' && request.method === 'GET') return json(response, 200, status(request)), true;
        if (['/api/admin/setup','/api/admin/login'].includes(route) && request.method === 'POST') {
          const key = createHash('sha256').update(String(request.headers['x-forwarded-for'] || request.socket.remoteAddress)).digest('hex');
          const counterFile='attempts/'+key+'.json';
          const record = (storage ? await storage.read(counterFile,null) : attempts.get(key)) || { count: 0, start: Date.now() };
          if (Date.now() - record.start > 900000) { record.count = 0; record.start = Date.now(); }
          if (record.count >= 8) throw problem(429, 'Too many login attempts. Try again in 15 minutes.');
          const data = await payload(request);
          if (route.endsWith('/setup')) {
            if (admin) throw problem(409, 'An administrator is already configured. Sign in instead.');
            if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) throw problem(400, 'Choose a password between 12 and 128 characters.');
            const salt = randomBytes(16).toString('hex');
            admin = { displayName: text(data.displayName || 'Studio admin', 80), salt, hash: (await scrypt(data.password, salt, 64)).toString('hex') };
            await atomic(authFile, admin);
            await mutate(() => log('Administrator configured'));
          } else {
            record.count++; attempts.set(key, record); if(storage)await storage.write(counterFile,record);
            if (!admin || typeof data.password !== 'string' || data.password.length > 128 || !timingSafeEqual(await scrypt(data.password, admin.salt, 64), Buffer.from(admin.hash, 'hex'))) throw problem(401, 'That password is incorrect.');
            attempts.delete(key); if(storage)await storage.remove(counterFile);
          }
          await issueSession(response); return json(response, 200, { authenticated: true }), true;
        }
        if (route === '/api/inquiries' && request.method === 'POST') {
          const data = await payload(request);
          if (data.website) return json(response, 200, { received: true }), true;
          const key = createHash('sha256').update(String(request.headers['x-forwarded-for'] || request.socket.remoteAddress)).digest('hex');
          const counterFile='inquiry-limits/'+key+'.json';
          const hits = ((storage ? await storage.read(counterFile,[]) : inquiryLimits.get(key)) || []).filter(t => t > Date.now() - 3600000);
          if (hits.length >= 10) throw problem(429, 'Please try again later.');
          if (!text(data.name).trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(data.email)) || !text(data.message).trim()) throw problem(400, 'Please include your name, email and message.');
          hits.push(Date.now()); inquiryLimits.set(key, hits); if(storage)await storage.write(counterFile,hits);
          const inquiry = { id: randomBytes(12).toString('hex'), name: text(data.name, 150), email: text(data.email, 250), message: text(data.message, 10000), interest: text(data.interest, 150), source: text(data.source, 500), status: 'new', notes: '', createdAt: new Date().toISOString() };
          await mutate(() => { state.inquiries.unshift(inquiry); log('New inquiry', inquiry.name); });
          return json(response, 201, { received: true, id: inquiry.id }), true;
        }
        if (!session(request)) throw problem(401, 'Sign in to manage the site.');
        if (route === '/api/admin/logout' && request.method === 'POST') { const token=tokenFrom(request); sessions.delete(token); if(storage)await storage.remove('sessions/'+token+'.json'); response.setHeader('Set-Cookie',cookieName+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(publicOrigin?'; Secure':'')); return json(response, 200, { success: true }), true; }
        if (route === '/api/admin/state' && request.method === 'GET') return json(response, 200, { ...state, published: undefined, revisions: state.revisions.map(({ content, ...r }) => r), displayName: admin.displayName, media: await mediaList() }), true;
        if (route === '/api/admin/preview' && request.method === 'GET') { return json(response, 200, snapshot(state.draft,url.searchParams.get('path'),true)), true; }
        if (route === '/api/admin/draft' && request.method === 'PUT') {
          const data = await payload(request);
          const validated = validate(data.content);
          await mutate(() => { if (data.revision !== state.revision) throw problem(409, 'The site changed in another tab. Reload before saving.'); state.draft = validated; state.revision++; log('Draft saved', text(data.section, 100)); });
          return json(response, 200, { revision: state.revision }), true;
        }
        if (route === '/api/admin/publish' && request.method === 'POST') {
          const data = await payload(request);
          await mutate(() => {
            if (data.revision !== state.revision) throw problem(409, 'Save your latest draft before publishing.');
            state.revisions.unshift({ id: randomBytes(10).toString('hex'), at: state.publishedAt || new Date().toISOString(), label: state.publishedAt ? 'Previous published version' : 'Original recreation', content: state.published });
            state.revisions = state.revisions.slice(0, 12); state.published = copy(state.draft); state.publishedAt = new Date().toISOString(); state.revision++; log('Site published');
          });
          return json(response, 200, { revision: state.revision, publishedAt: state.publishedAt }), true;
        }
        if (route === '/api/admin/restore' && request.method === 'POST') {
          const data = await payload(request);
          await mutate(() => { const previous = state.revisions.find(r => r.id === data.id); if (!previous) throw problem(404, 'That version was not found.'); state.draft = copy(previous.content); migrateContent(state.draft,migrations); state.revision++; log('Version restored to draft', previous.at); });
          return json(response, 200, { success: true }), true;
        }
        if (route === '/api/admin/inquiry' && request.method === 'PUT') {
          const data = await payload(request);
          await mutate(() => { const inquiry = state.inquiries.find(i => i.id === data.id); if (!inquiry) throw problem(404,'Inquiry not found.'); if (!['new','read','replied','archived'].includes(data.status)) throw problem(400,'Invalid inquiry status.'); inquiry.status = data.status; inquiry.notes = text(data.notes,10000); log('Inquiry updated', inquiry.name); });
          return json(response,200,{ success: true }),true;
        }
        if (route === '/api/admin/export' && request.method === 'GET') return json(response, 200, { schema:1, exportedAt:new Date().toISOString(), content:state.draft, inquiries:state.inquiries }),true;
        if (route === '/api/admin/import' && request.method === 'POST') { const data=await payload(request); const validated=validate(data.content); await mutate(() => { state.draft=validated; state.revision++; log('Backup imported to draft'); }); return json(response,200,{success:true}),true; }
        if (route === '/api/admin/password' && request.method === 'POST') {
          const data = await payload(request);
          if (typeof data.current !== 'string' || data.current.length > 128 || !timingSafeEqual(await scrypt(data.current, admin.salt,64),Buffer.from(admin.hash,'hex'))) throw problem(400,'The current password is incorrect.');
          if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) throw problem(400,'Choose a password between 12 and 128 characters.');
          const salt=randomBytes(16).toString('hex'); admin={...admin,salt,hash:(await scrypt(data.password,salt,64)).toString('hex')}; await atomic(authFile,admin); sessions.clear(); await issueSession(response); await mutate(() => log('Admin password changed')); return json(response,200,{success:true}),true;
        }
        if (route === '/api/admin/upload' && request.method === 'POST') {
          const name = text(url.searchParams.get('name'),150).replace(/[^a-zA-Z0-9._-]/g,'-');
          const ext = path.extname(name).toLowerCase();
          if (!['.png','.jpg','.jpeg','.webp','.gif','.avif','.pdf','.mp4','.woff2','.woff','.ttf','.otf'].includes(ext)) throw problem(400,'Upload an image, video, PDF, or font file.');
          const data = await body(request);
          const valid = ext === '.png' ? data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : ['.jpg','.jpeg'].includes(ext) ? data[0] === 255 && data[1] === 216 : ext === '.webp' ? data.toString('ascii',0,4)==='RIFF' && data.toString('ascii',8,12)==='WEBP' : ext === '.gif' ? data.toString('ascii',0,3)==='GIF' : ext === '.pdf' ? data.toString('ascii',0,4)==='%PDF' : ['.avif','.mp4'].includes(ext) ? data.toString('ascii',4,8)==='ftyp' : ext === '.woff2' ? data.toString('ascii',0,4)==='wOF2' : ext === '.woff' ? data.toString('ascii',0,4)==='wOFF' : ['.ttf','.otf'].includes(ext) ? data.subarray(0,4).equals(Buffer.from([0,1,0,0])) || data.toString('ascii',0,4)==='OTTO' : false;
          if (!valid) throw problem(400,'The file contents do not match the extension.');
          const filename = randomBytes(6).toString('hex') + '-' + name;
          if(storage)await storage.upload(filename,data);
          else {const directory = path.join(root,'media/uploads'); await fs.mkdir(directory,{recursive:true}); await fs.writeFile(path.join(directory,filename),data);}
          await mutate(() => log('Media uploaded',name)); return json(response,201,{ url:'/media/uploads/'+filename }),true;
        }
        throw problem(404,'Endpoint not found.');
      } catch (error) { json(response,error.status || 500,{ error:error.status ? error.message : 'Unable to complete the request. Your existing content is preserved.' }); if (!error.status) console.error(error); return true; }
    }
  };
}
