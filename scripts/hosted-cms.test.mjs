import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createCMS } from './cms-server.mjs';
import { createBlobStorage } from './blob-storage.mjs';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { normalizeURL } from '../dist/cms/urls.mjs';

test('project links accept bare domains and identify invalid fields',()=>{
  assert.equal(normalizeURL(' nura-woad.vercel.app\u00a0'), 'https://nura-woad.vercel.app/');
  assert.equal(normalizeURL('www.example.com/work?x=1#about'),'https://www.example.com/work?x=1#about');
  assert.equal(normalizeURL('https://example.com/path'),'https://example.com/path');
  assert.equal(normalizeURL('/media/projects/example.jpg'),'/media/projects/example.jpg');
  assert.equal(normalizeURL('  ',{optional:true}), '');
  for(const url of ['javascript:alert(1)','data:text/html,test','//example.com','https://','https://example.com\\test','C:\\Users\\image.jpg'])assert.throws(()=>normalizeURL(url,{label:'Nura — Cover image URL'}),/Nura — Cover image URL/);
  assert.throws(()=>normalizeURL('',{label:'Nura — Cover image URL'}),/Nura — Cover image URL is required/);
});

test('compressed Blob content can be saved while genuinely stale writes are rejected',async()=>{
  let version=1,value={revision:1};
  const services={
    async getBlob(){return {blob:{etag:`W/"version-${version}"`},stream:new Response(JSON.stringify(value)).body};},
    async putBlob(name,body,options){
      if(options.ifMatch!==`"version-${version}"`)throw new BlobPreconditionFailedError();
      value=JSON.parse(body);version++;return {etag:`"version-${version}"`};
    }
  };
  const first=createBlobStorage(services),second=createBlobStorage(services);
  await first.read('content.json',null);await second.read('content.json',null);
  await first.write('content.json',{revision:2});
  assert.equal(value.revision,2);
  await assert.rejects(second.write('content.json',{revision:3}),error=>error.status===409);
  await first.write('content.json',{revision:4});
  assert.equal(value.revision,4);
});

test('hosted CMS keeps authenticated sessions and published content across fresh requests',async()=>{
  const records=new Map();
  const storage={
    async read(name,fallback){return structuredClone(records.has(name)?records.get(name):fallback);},
    async write(name,value){records.set(name,structuredClone(value));},
    async remove(name){records.delete(name);},
    async mediaList(){return [];}
  };
  let origin,cookie='';
  const server=http.createServer(async(request,response)=>{
    const cms=await createCMS({root:fileURLToPath(new URL('../dist/',import.meta.url)),dataDirectory:'/not-writable',storage,publicOrigin:origin,cookieName:'webly_test'});
    await cms.handle(request,response,new URL(request.url,origin));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  const request=async(route,method='GET',data)=>{
    const result=await fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,'X-CMS-Request':'1','Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
    return {response:result,data:await result.json()};
  };
  try {
    const setup=await request('/api/admin/setup','POST',{displayName:'Hosted test',password:'hosted-test-password-2026'});
    assert.equal(setup.response.status,200);
    assert.match(setup.response.headers.get('set-cookie'),/Secure/);
    cookie=setup.response.headers.get('set-cookie').split(';')[0];
    const current=(await request('/api/admin/state')).data;
    assert.ok(current.draft);
    current.draft.theme.accent='#afcd12';
    current.draft.projects[0].url='nura-woad.vercel.app';
    current.draft.projects[0].screen='   ';
    current.draft.projects[0].logo='/media/projects/nura-logo.png';
    current.draft.projects[0].caseStudy={headline:'A clear project story',intro:'An overview edited in the admin.',challenge:'The brief.',solution:'The approach.',design:'A considered interface.',scope:['Website design'],features:['A working ordering flow']};
    const service=current.draft.pages.find(p=>p.path==='/services/website-design/');
    service.fields.find(field=>field.node==='service-intro').value='A service introduction edited in the admin.';
    const saved=await request('/api/admin/draft','PUT',{content:current.draft,revision:current.revision});
    assert.equal(saved.response.status,200);
    assert.equal((await request('/api/admin/preview?path=/')).data.theme.accent,'#afcd12');
    const draft=(await request('/api/admin/preview?path=/')).data;
    assert.equal(draft.projects[0].url,'https://nura-woad.vercel.app/');
    assert.equal(draft.projects[0].screen,'');
    assert.equal(draft.projects[0].logo,'/media/projects/nura-logo.png');
    assert.equal(draft.projects[0].caseStudy.headline,'A clear project story');
    assert.equal((await request('/api/admin/publish','POST',{revision:saved.data.revision})).response.status,200);
    assert.equal((await request('/api/site?path=/')).data.theme.accent,'#afcd12');
    assert.equal((await request('/api/site?path=/')).data.projects[0].url,'https://nura-woad.vercel.app/');
    assert.deepEqual((await request('/api/site?path=/')).data.projects[0].caseStudy.features,['A working ordering flow']);
    assert.equal((await request('/api/site?path=/services/website-design/')).data.page.fields.find(field=>field.node==='service-intro').value,'A service introduction edited in the admin.');
    assert.equal((await request('/api/admin/logout','POST')).response.status,200);
    assert.equal((await request('/api/admin/state')).response.status,401);
    assert.equal((await request('/api/admin/login','POST',{password:'hosted-test-password-2026'})).response.status,200);
    for(let count=0;count<8;count++)assert.equal((await request('/api/admin/login','POST',{password:'incorrect'})).response.status,401);
    assert.equal((await request('/api/admin/login','POST',{password:'incorrect'})).response.status,429);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
