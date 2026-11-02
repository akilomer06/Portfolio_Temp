(()=>{
// Free website check: calls Google PageSpeed Insights from the browser and explains the results plainly.
const form=document.querySelector('.wc-form');if(!form)return;
const input=form.querySelector('input'),error=form.querySelector('.wc-error'),results=document.querySelector('.wc-results');
const running=results.querySelector('.wc-running'),done=results.querySelector('.wc-done'),button=form.querySelector('button');
const API='https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const PLAIN={
 'render-blocking-resources':'Stylesheets and scripts hold up the first paint. Loading fewer files up front lets the page appear sooner.',
 'unused-javascript':'The page downloads code it never uses, often from a theme or plugins.',
 'unused-css-rules':'The page downloads styles it never uses, usually from a theme or page builder.',
 'uses-optimized-images':'Images are heavier than they need to be. Compressed images load much faster on phones.',
 'modern-image-formats':'Images are in older formats. WebP or AVIF versions are usually far smaller.',
 'uses-responsive-images':'Phones are sent desktop-sized images. Correctly sized images cut the download.',
 'offscreen-images':'Images far down the page load before they are needed.',
 'efficient-animated-content':'Animated GIFs are large; a short video file does the same job at a fraction of the size.',
 'server-response-time':'The server is slow to respond. Better hosting or page caching usually fixes this.',
 'uses-text-compression':'Files are sent uncompressed. Turning on compression at the server is a quick fix.',
 'font-display':'Text waits for web fonts to download before it appears.',
 'third-party-summary':'Third-party widgets such as chat, maps, or video embeds slow the page down.',
 'third-party-facades':'Embedded widgets load in full before anyone uses them.',
 'dom-size':'The page is built from a very large amount of code, which slows phones down.',
 'mainthread-work-breakdown':'The phone spends a long time running the page’s scripts.',
 'bootup-time':'Scripts take a long time to start on a phone.',
 'largest-contentful-paint-element':'The main image or heading takes a long time to appear.',
 'layout-shifts':'Parts of the page jump around while it loads.',
 'color-contrast':'Some text does not stand out enough from its background to read easily.',
 'image-alt':'Some images have no text description for screen readers and search engines.',
 'link-name':'Some links have no readable name for screen readers.',
 'button-name':'Some buttons have no readable name for screen readers.',
 'label':'Some form fields have no label.',
 'heading-order':'Headings skip levels, which makes the page harder to follow with a screen reader.',
 'html-has-lang':'The page does not declare its language.',
 'target-size':'Some links and buttons are too small or too close together to tap reliably.',
 'document-title':'The page has no title, which is what search results show.',
 'meta-description':'The page has no description for search results.',
 'is-crawlable':'The page tells search engines not to index it.',
 'link-text':'Some links say “click here” or “read more” instead of where they go.',
 'errors-in-console':'The browser reports errors while loading the page.',
 'is-on-https':'Parts of the page are not served over a secure connection.',
 'viewport':'The page is not set up to fit a phone screen.',
 'deprecations':'The page uses browser features that are being retired.',
 'inspector-issues':'The browser flags problems with how the page is built.',
 'document-latency-insight':'The first response from the server is slow or heavy. Compression and caching let the page start sooner.',
 'network-dependency-tree-insight':'Files load one after another instead of together, which delays the first paint.',
 'render-blocking-insight':'Stylesheets and scripts hold up the first paint. Loading fewer files up front lets the page appear sooner.',
 'image-delivery-insight':'Images are heavier than they need to be. Resized, compressed images load much faster on phones.',
 'lcp-discovery-insight':'The main image is found late. Marking it as a priority makes the page look ready sooner.',
 'lcp-phases-insight':'The main content takes a long time to appear after the page starts loading.',
 'lcp-breakdown-insight':'The main content takes a long time to appear after the page starts loading.',
 'font-display-insight':'Text waits for web fonts to download before it appears.',
 'cls-culprits-insight':'Parts of the page jump around while it loads.',
 'third-parties-insight':'Third-party widgets such as chat, maps, or video embeds slow the page down.',
 'dom-size-insight':'The page is built from a very large amount of code, which slows phones down.',
 'cache-insight':'Files are not cached, so returning visitors download them all again.',
 'duplicated-javascript-insight':'The same scripts are loaded more than once.',
 'legacy-javascript-insight':'Older JavaScript is sent to modern phones that do not need it.',
 'forced-reflow-insight':'Scripts force the page to recalculate its layout repeatedly.',
 'viewport-insight':'The page is not set up to respond quickly to taps on a phone.',
 'interaction-to-next-paint-insight':'The page is slow to respond after a tap.',
};
const METRICS=[['largest-contentful-paint','Main content shown',[2500,4000]],['first-contentful-paint','First content shown',[1800,3000]],['total-blocking-time','Time the page is unresponsive',[200,600]],['cumulative-layout-shift','Layout movement',[.1,.25]]];
const track=(n,p)=>{try{window.endcapTrack?.(n,p);}catch(_){}};
const tone=s=>s>=90?'good':s>=50?'fair':'poor';

form.addEventListener('submit',async e=>{
 e.preventDefault();error.hidden=true;
 let raw=input.value.trim();if(!raw){showError('Enter your website address, for example yourbusiness.com.');return;}
 if(!/^https?:\/\//i.test(raw))raw='https://'+raw;
 let url;try{url=new URL(raw);if(!url.hostname.includes('.'))throw 0;}catch(_){showError('That doesn’t look like a website address. Try something like yourbusiness.com.');return;}
 results.hidden=false;running.hidden=false;done.hidden=true;button.disabled=true;button.setAttribute('aria-busy','true');
 results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 const steps=[...running.querySelectorAll('li')];let k=0;steps.forEach(s=>s.classList.remove('is-on'));steps[0].classList.add('is-on');
 const timer=setInterval(()=>{k=Math.min(steps.length-1,k+1);steps[k].classList.add('is-on');},6000);
 track('website_check_start',{host:url.hostname});
 try{
  const q=new URLSearchParams({url:url.href,strategy:'mobile'});if(form.dataset.key)q.set('key',form.dataset.key);['PERFORMANCE','ACCESSIBILITY','BEST_PRACTICES','SEO'].forEach(c=>q.append('category',c));
  const ctrl=new AbortController();const kill=setTimeout(()=>ctrl.abort(),95000);
  const res=await fetch(API+'?'+q,{signal:ctrl.signal});clearTimeout(kill);
  if(res.status===429)throw new Error('Google’s free checker has reached its limit for now, so it can’t run this check. Send us your address and we will run it and email you the results, with what we would fix first.');
  const data=await res.json();
  if(!res.ok||!data.lighthouseResult){
   // Only a page Google could not load means the address is probably wrong; anything else is the checker itself.
   const why=JSON.stringify(data.error||'');track('website_check_error',{status:res.status,reason:why.slice(0,120)});
   if(/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP|INVALID_URL/i.test(why))throw new Error('Google couldn’t load that address. Check the spelling, or send it to us and we will look at it for you.');
   throw new Error('The checker isn’t available right now. Send us your address and we will run it and email you the results.');
  }
  render(url,data.lighthouseResult);
 }catch(err){
  running.hidden=true;results.hidden=true;showError(err.name==='AbortError'?'The check took too long. Try again, or send us your address and we will run it for you.':err instanceof TypeError?'The checker isn’t available right now. Send us your address and we will run it and email you the results.':(err.message||'Something went wrong. Try again in a moment.'));
  track('website_check_error',{});
 }finally{clearInterval(timer);button.disabled=false;button.removeAttribute('aria-busy');}
});

function showError(msg){
 error.querySelector('p').textContent=msg;error.hidden=false;
 // Any failure becomes a request: the address travels to the contact form so Noah can run the check himself.
 const v=input.value.trim();error.querySelector('.wc-fallback').href='/contact/#from='+encodeURIComponent('Website check request: '+(v||'no address given'));
}

function render(url,lh){
 document.querySelector('.hv-score')?.setAttribute('hidden','');
 const cats=lh.categories,audits=lh.audits,score=c=>Math.round((cats[c]?.score||0)*100);
 running.hidden=true;done.hidden=false;
 results.querySelector('.wc-site').innerHTML=esc(url.hostname.replace(/^www\./,'').toUpperCase()).replace(/\./g,'.<wbr>')+'<br><em>results.</em>';
 results.querySelectorAll('.wc-gauge').forEach((g,i)=>{
  const s=score(g.dataset.cat);g.dataset.tone=tone(s);
  const arc=g.querySelector('.wc-arc');arc.style.strokeDashoffset=100;
  requestAnimationFrame(()=>setTimeout(()=>{arc.style.strokeDashoffset=100-s;},120+i*140));
  const out=g.querySelector('.wc-score');const t0=performance.now();
  const tick=t=>{const p=Math.min(1,(t-t0)/1300),v=Math.round(s*(1-Math.pow(1-p,3)));out.textContent=v;if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 });
 results.querySelector('.wc-metrics').innerHTML=METRICS.map(([id,label,[good,poor]])=>{const a=audits[id];if(!a)return'';const v=a.numericValue;const t=v<=good?'good':v<=poor?'fair':'poor';
  return `<div class="wc-metric" data-tone="${t}"><b>${esc(a.displayValue||'')}</b><span>${label}</span></div>`;}).join('');
 const seen=new Set(),issues=[];
 for(const c of ['performance','accessibility','best-practices','seo'])for(const ref of (cats[c]?.auditRefs||[])){
  const a=audits[ref.id];if(!a||seen.has(ref.id)||a.score===null||a.score>=.9||a.scoreDisplayMode==='informative'||a.scoreDisplayMode==='notApplicable'||a.scoreDisplayMode==='manual')continue;
  if(['largest-contentful-paint','first-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','interactive','max-potential-fid'].includes(ref.id))continue;
  seen.add(ref.id);issues.push({id:ref.id,cat:c,weight:(ref.weight||0)+(a.details?.overallSavingsMs||0)/300,title:a.title,save:a.displayValue||''});
 }
 issues.sort((x,y)=>y.weight-x.weight);
 const top=issues.slice(0,6),names={performance:'Speed','accessibility':'Accessibility','best-practices':'Best practices',seo:'Search'};
 results.querySelector('.wc-issue-list').innerHTML=top.length?top.map((x,i)=>`<li><span>0${i+1}</span><div><p class="wc-issue-kind">${names[x.cat]}${x.save?' · '+esc(x.save):''}</p><h4>${esc(PLAIN[x.id]||x.title.replace(/`/g,''))}</h4></div></li>`).join(''):'<li><span>01</span><div><h4>Google found no significant problems. This site is in good shape.</h4></div></li>';
 const perf=score('performance'),acc=score('accessibility'),seo=score('seo'),bp=score('best-practices');
 results.querySelector('.wc-summary').textContent=`${url.hostname.replace(/^www\./,'')} scored ${perf} out of 100 for performance on a phone, ${acc} for accessibility, and ${seo} for search basics. `+(issues.length?`Google flagged ${issues.length} issue${issues.length===1?'':'s'}; the first ${Math.min(6,issues.length)} below would make the most difference.`:'Google flagged no significant issues.');
 const from=`Website check: ${url.hostname} (performance ${perf}, accessibility ${acc}, best practices ${bp}, search ${seo})`;
 results.querySelector('.wc-send').href='/contact/#from='+encodeURIComponent(from);
 track('website_check_done',{performance:perf,accessibility:acc,seo});
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
})();
