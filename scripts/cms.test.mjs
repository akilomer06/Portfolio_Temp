import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { migrateContent } from './content-migrations.mjs';

test('CMS authentication, publishing, persistence, inbox and recovery', async t => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'endcap-cms-test-'));
  const finder = net.createServer();
  await new Promise(resolve => finder.listen(0,'127.0.0.1',resolve));
  const port = finder.address().port;
  await new Promise(resolve => finder.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const cwd = fileURLToPath(new URL('../',import.meta.url));
  let process, cookie='';
  const launch = async () => {
    process = spawn(globalThis.process.execPath,['scripts/serve.mjs'],{ cwd, env:{...globalThis.process.env,PORT:String(port),CMS_DATA_DIR:temp},stdio:['ignore','pipe','pipe'] });
    await new Promise((resolve,reject) => { process.stdout.on('data',chunk=>{if(chunk.toString().includes('Admin:'))resolve();}); process.stderr.on('data',chunk=>reject(Error(chunk.toString()))); process.on('exit',code=>{if(code)reject(Error('Server exited '+code));}); });
  };
  const stop = async () => { if(process.exitCode!==null)return;const done=new Promise(resolve=>process.once('exit',resolve));process.kill();await done; };
  const request = async (route,{method='GET',data,auth=true,originHeader=origin,csrf=true,raw,headers={}}={}) => {
    const response=await fetch(origin+route,{method,headers:{Origin:originHeader,...(csrf?{'X-CMS-Request':'1'}:{}),...(auth&&cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json'}:{}),...headers},body:raw|| (data?JSON.stringify(data):undefined)});
    let result;try{result=await response.json();}catch{result=null;}
    return {response,result};
  };
  try {
    await launch();
    await t.test('requires setup and protects admin data',async()=>{
      assert.equal((await request('/api/admin/session')).result.setupRequired,true);
      assert.equal((await request('/api/admin/state')).response.status,401);
      assert.equal((await request('/api/admin/preview?path=/')).response.status,401);
      assert.equal((await request('/api/admin/setup',{method:'POST',data:{password:'short'}})).response.status,400);
      const setup=await request('/api/admin/setup',{method:'POST',data:{displayName:'Test administrator',password:'test-only-CMS-pass-2026'}});
      assert.equal(setup.response.status,200);cookie=setup.response.headers.get('set-cookie').split(';')[0];
      assert.match(setup.response.headers.get('set-cookie'),/HttpOnly/);
      assert.equal((await request('/api/admin/setup',{method:'POST',data:{password:'another-password-123'}})).response.status,409);
      assert.equal((await request('/api/admin/draft',{method:'PUT',data:{},originHeader:'https://untrusted.example'})).response.status,403);
      assert.equal((await request('/api/admin/publish',{method:'POST',data:{},csrf:false})).response.status,403);
    });
    let content, revision, originalAccent, originalMapStyle, restoredId;
    await t.test('indexes all existing content and isolates saved drafts',async()=>{
      const loaded=(await request('/api/admin/state')).result;
      assert.equal(loaded.draft.pages.length,6);assert.equal(loaded.draft.projects.length,5);assert.ok(loaded.media.length>150);
      content=loaded.draft;revision=loaded.revision;originalAccent=content.theme.accent;content.theme.accent='#b2d2ff';content.projects[0].name='Updated project';content.pages.find(p=>p.path==='/').title='Published SEO title & details';
      const saved=await request('/api/admin/draft',{method:'PUT',data:{content,revision,section:'Integration check'}});
      assert.equal(saved.response.status,200);revision=saved.result.revision;
      assert.equal((await request('/api/site?path=/',{auth:false})).result.theme.accent,originalAccent);
      assert.equal((await request('/api/admin/preview?path=/')).result.theme.accent,'#b2d2ff');
      const draftHTML=await (await fetch(origin+'/?preview=draft',{headers:{Cookie:cookie}})).text();
      assert.match(draftHTML,/<style id="cms-initial-theme">:root\{--lime:#b2d2ff;--acid:#b2d2ff;/);
      const unchangedHTML=await (await fetch(origin+'/')).text();
      assert.ok(unchangedHTML.includes('--acid:'+originalAccent+';'),'draft styles must not leak into the first public render');
      assert.equal((await request('/api/admin/draft',{method:'PUT',data:{content,revision:revision-1}})).response.status,409);
      const bad=structuredClone(content);bad.projects[0].url='javascript:alert(1)';
      assert.equal((await request('/api/admin/draft',{method:'PUT',data:{content:bad,revision}})).response.status,400);
    });
    await t.test('publishes changes and preserves a restorable previous version',async()=>{
      const published=await request('/api/admin/publish',{method:'POST',data:{revision}});assert.equal(published.response.status,200);revision=published.result.revision;
      const publicContent=(await request('/api/site?path=/',{auth:false})).result;
      assert.equal(publicContent.theme.accent,'#b2d2ff');assert.equal(publicContent.projects[0].name,'Updated project');assert.equal(publicContent.inquiries,undefined);
      const publishedHTML=await (await fetch(origin+'/')).text();assert.match(publishedHTML,/<title>Published SEO title &amp; details<\/title>/);
      for(const page of content.pages) {
        const html=await (await fetch(origin+page.path)).text();
        const style=/<style id="cms-initial-theme">([\s\S]*?)<\/style>/.exec(html);
        assert.ok(style,'every page must include the saved palette without JavaScript');
        assert.ok(style[1].includes('--acid:#b2d2ff;'));
        assert.ok(style[1].includes('--paper:'+content.theme.paper+';'));
        assert.ok(html.indexOf(style[0])<html.indexOf('</head>'),'palette must be in the render-blocking head');
        assert.ok(html.includes('name="theme-color"')&&html.includes('content="'+content.theme.paper+'"'));
      }
      restoredId=(await request('/api/admin/state')).result.revisions[0].id;
      assert.equal((await request('/api/admin/restore',{method:'POST',data:{id:restoredId}})).response.status,200);
      assert.equal((await request('/api/admin/preview?path=/')).result.theme.accent,originalAccent);
      assert.equal((await request('/api/site?path=/')).result.theme.accent,'#b2d2ff');
    });
    await t.test('captures real form inquiries and keeps private notes private',async()=>{
      const inquiry=await request('/api/inquiries',{method:'POST',auth:false,data:{name:'QA contact',email:'qa@example.com',message:'A test inquiry',source:'/contact/'}});
      assert.equal(inquiry.response.status,201);
      const inbox=(await request('/api/admin/state')).result.inquiries;
      assert.equal(inbox[0].email,'qa@example.com');
      assert.equal((await request('/api/admin/inquiry',{method:'PUT',data:{id:inquiry.result.id,status:'read',notes:'Private note'}})).response.status,200);
      assert.equal((await request('/api/admin/state',{auth:false})).response.status,401);
      assert.equal((await request('/api/inquiries',{method:'POST',auth:false,data:{name:'Missing email'}})).response.status,400);
      assert.equal((await request('/api/admin/upload?name=fake.png',{method:'POST',raw:Buffer.from('not an image')})).response.status,400);
      assert.equal((await request('/api/admin/upload?name=script.html',{method:'POST',raw:Buffer.from('<script>')})).response.status,400);
      const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
      const uploaded=await request('/api/admin/upload?name=integration-test.png',{method:'POST',raw:png});
      assert.equal(uploaded.response.status,201);
      const uploadedPath=path.resolve(cwd,'dist','.'+uploaded.result.url);
      try { const image=await fetch(origin+uploaded.result.url);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await image.arrayBuffer()),png); }
      finally { assert.ok(uploadedPath.startsWith(path.join(cwd,'dist','media','uploads')+path.sep));assert.ok(uploadedPath.endsWith('-integration-test.png'));await unlink(uploadedPath); }
    });
    await t.test('persists content and inquiries across server restarts',async()=>{
      await stop();await launch();cookie='';
      assert.equal((await request('/api/admin/session')).result.setupRequired,false);
      const login=await request('/api/admin/login',{method:'POST',data:{password:'test-only-CMS-pass-2026'}});assert.equal(login.response.status,200);cookie=login.response.headers.get('set-cookie').split(';')[0];
      const stored=(await request('/api/admin/state')).result;
      assert.equal(stored.inquiries[0].notes,'Private note');assert.equal(stored.draft.theme.accent,originalAccent);
      assert.equal((await request('/api/site?path=/')).result.theme.accent,'#b2d2ff');
      const backup=(await request('/api/admin/export')).result;
      assert.equal(backup.content.pages.length,6);assert.equal(backup.inquiries.length,1);
    });
    await t.test('hides published pages for visitors and signed-in admins, with explicit private previews',async()=>{
      const current=(await request('/api/admin/state')).result;current.draft.navigation.push({label:'About page',href:'/about/',visible:true});
      current.draft.pages.find(p=>p.path==='/about/').visible=false;
      current.draft.pages.find(p=>p.path==='/work/').visible=false;current.draft.projects[0].url='/work/';
      const saved=await request('/api/admin/draft',{method:'PUT',data:{content:current.draft,revision:current.revision,section:'Visibility regression'}});
      assert.equal(saved.response.status,200);
      assert.equal((await fetch(origin+'/about/')).status,200,'saving a draft must not change the live page');
      assert.equal((await fetch(origin+'/about/?preview=draft',{headers:{Cookie:cookie}})).status,200);
      assert.equal((await fetch(origin+'/about/?preview=draft')).status,404);
      const published=await request('/api/admin/publish',{method:'POST',data:{revision:saved.result.revision}});
      assert.equal(published.response.status,200);
      for(const route of ['/about/','/about','/about/index.html','/%61bout/','/%2Fabout/']) {
        assert.equal((await fetch(origin+route)).status,404,route+' should be hidden publicly');
        assert.equal((await fetch(origin+route,{headers:{Cookie:cookie}})).status,404,route+' should stay hidden for an admin outside preview');
      }
      assert.equal((await request('/api/site?path=/about/')).response.status,404);
      assert.equal((await request('/api/site?path=/about/index.html',{auth:false})).response.status,404);
      assert.equal((await request('/api/admin/preview?path=/about/')).response.status,200);
      assert.equal((await fetch(origin+'/about/?preview=draft',{headers:{Cookie:cookie}})).status,200);
      const publicSite=(await request('/api/site?path=/')).result;
      assert.ok(!publicSite.navigation.some(n=>n.href==='/about/'));
      assert.ok(!publicSite.projects.some(p=>p.url==='/work/'));
      const html=await (await fetch(origin+'/')).text();
      assert.ok(!html.includes('href="/about/"'));
      assert.ok(!html.includes('href="/work/"'));
      const hidden=(await request('/api/admin/state')).result;
      hidden.draft.pages.find(p=>p.path==='/about/').visible=true;
      const restored=await request('/api/admin/draft',{method:'PUT',data:{content:hidden.draft,revision:hidden.revision}});
      await request('/api/admin/publish',{method:'POST',data:{revision:restored.result.revision}});
      assert.equal((await fetch(origin+'/about/')).status,200,'showing and republishing restores access');
      assert.ok((await request('/api/site?path=/')).result.navigation.some(n=>n.href==='/about/'));
    });
  } finally {
    if(process) await stop();
    const resolved=path.resolve(temp);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'endcap-cms-test-'));
    await rm(resolved,{recursive:true,force:true});
  }
});

test('location migrations preserve custom text, colors and page visibility',()=>{
  const content={settings:{location:'Orange County, California',tagline:'Our studio / Orange County, CA'},theme:{accent:'#123456'},navigation:[{label:'City guides',href:'/web-design/',visible:false}],pages:[{path:'/',visible:false,title:'A custom title',description:'Custom description',fields:[{id:'location:0',value:'Based in Orange County'},{id:'custom:0',value:'Words chosen by the owner'},{id:'obsolete:0',value:'City list'}]}]};
  const migrations=[{id:'2026-11-worldwide-india',settings:{location:{from:'Orange County, California',to:'India'}},pages:[{path:'/',fields:[{id:'location:0',from:'Based in Orange County',to:'Based in India'},{id:'custom:0',from:'Original copy',to:'Replacement copy'}],removeFields:['obsolete:0'],title:{from:'Original title',to:'New title'}}]}];
  assert.ok(migrateContent(content,migrations)>0);
  assert.equal(content.settings.location,'India');assert.equal(content.settings.tagline,'Our studio / India');
  assert.equal(content.theme.accent,'#123456');assert.equal(content.pages[0].visible,false);
  assert.equal(content.pages[0].title,'A custom title');assert.equal(content.pages[0].fields[1].value,'Words chosen by the owner');
  assert.equal(content.pages[0].fields[0].value,'Based in India');assert.equal(content.pages[0].fields.length,2);
  assert.equal(content.navigation[0].href,'/#worldwide');assert.equal(content.navigation[0].visible,false);
  assert.equal(migrateContent(content,migrations),0,'migration should be safe to repeat');
});
