// Shared by the admin editor and server so pasted addresses behave consistently.
export function normalizeURL(value, {label='Link',optional=false,webOnly=false}={}) {
  let url=String(value ?? '').trim();
  const invalid=()=>{throw Object.assign(new Error(`${label}: enter a website address such as example.com${webOnly?'':', or a local path beginning with /'}.`),{status:400});};
  if(!url){if(optional)return '';throw Object.assign(new Error(`${label} is required. Choose a file from the media library or enter its URL.`),{status:400});}
  if(/[\s\\<>"'\u0000-\u001f\u007f]/.test(url))return invalid();
  if(!webOnly && url.startsWith('/') && !url.startsWith('//'))return url;
  if(!webOnly && /^(mailto:|tel:|#)/i.test(url))return url;
  if(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(url))url='https://'+url;
  try {
    const parsed=new URL(url);
    if(!['https:','http:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password)return invalid();
    return parsed.href;
  } catch {return invalid();}
}
