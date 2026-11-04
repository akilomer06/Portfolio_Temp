import path from 'node:path';
import { get, put, del, list, BlobPreconditionFailedError } from '@vercel/blob';

// Each request gets its own ETag map, so a stale save cannot overwrite another request.
export function createBlobStorage({getBlob=get,putBlob=put}={}) {
  const etags=new Map();
  const key=name=>'webly/'+name;
  return {
    async read(name,fallback) {
      const result=await getBlob(key(name),{access:'private',useCache:false});
      if(!result){etags.set(name,null);return fallback;}
      // The download CDN marks compressed responses W/"etag". Conditional PUT
      // expects the underlying object tag ("etag"), not the transfer encoding tag.
      etags.set(name,result.blob.etag.replace(/^W\//i,''));
      return new Response(result.stream).json();
    },
    async write(name,value) {
      try {
        const etag=etags.get(name);
        const result=await putBlob(key(name),JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,contentType:'application/json',cacheControlMaxAge:60,...(etag?{ifMatch:etag}:{})});
        etags.set(name,result.etag);
      } catch(error) {
        if(error instanceof BlobPreconditionFailedError || error.message?.includes('already exists'))throw Object.assign(new Error('Content changed in another request. Reload and try again.'),{status:409});
        throw error;
      }
    },
    async remove(name){await del(key(name));},
    async upload(name,bytes){await put('uploads/'+name,bytes,{access:'private',addRandomSuffix:false});},
    async getUpload(name){return get('uploads/'+name,{access:'private'});},
    async mediaList(){
      const files=[];let cursor;
      do {
        const page=await list({prefix:'uploads/',cursor});cursor=page.hasMore?page.cursor:undefined;
        for(const item of page.blobs){const name=path.posix.basename(item.pathname);const ext=path.posix.extname(name);files.push({name,url:'/media/uploads/'+name,bytes:item.size,type:ext==='.mp4'?'video':ext==='.pdf'?'document':/\.(woff2?|ttf|otf)$/.test(ext)?'font':'image',uploaded:true});}
      } while(cursor);
      return files;
    }
  };
}
