import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createCMS } from './cms-server.mjs';
import { createBlobStorage } from './blob-storage.mjs';
import { BlobPreconditionFailedError } from '@vercel/blob';

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
    const saved=await request('/api/admin/draft','PUT',{content:current.draft,revision:current.revision});
    assert.equal(saved.response.status,200);
    assert.equal((await request('/api/admin/preview?path=/')).data.theme.accent,'#afcd12');
    assert.equal((await request('/api/admin/publish','POST',{revision:saved.data.revision})).response.status,200);
    assert.equal((await request('/api/site?path=/')).data.theme.accent,'#afcd12');
    assert.equal((await request('/api/admin/logout','POST')).response.status,200);
    assert.equal((await request('/api/admin/state')).response.status,401);
    assert.equal((await request('/api/admin/login','POST',{password:'hosted-test-password-2026'})).response.status,200);
    for(let count=0;count<8;count++)assert.equal((await request('/api/admin/login','POST',{password:'incorrect'})).response.status,401);
    assert.equal((await request('/api/admin/login','POST',{password:'incorrect'})).response.status,429);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
