(()=>{
// Conversion sections: drawings, the statement reveal, the process rail, the map, and the mobile dock.
// Everything is readable without this script; html.gx arms the motion states.
const root=document.documentElement;
root.classList.add('gx-js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO='IntersectionObserver' in window;

// Full-screen mobile menu: keep the page behind it still while it is open.
const mastEl=document.querySelector('.mast');
if(mastEl)new MutationObserver(()=>{root.classList.toggle('menu-locked',mastEl.classList.contains('menu-open')&&matchMedia('(max-width:900px)').matches);}).observe(mastEl,{attributes:true,attributeFilter:['class']});

// Which call to action brought someone to the contact page (hero, dock, menu, city guide, article card…).
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="/contact/"]');if(!a)return;
 const zone=a.closest('.hx-dock')?'dock':a.closest('.mast')?'header':a.closest('.hx-hero-side')?'hero':a.closest('.gx-aside')?'article_card':a.closest('.mk-hero,.ix-hero')?'landing_hero':a.closest('.mk-advice')?'city_advice':a.closest('.re-invitation')?'closing_band':a.closest('.hx-faq')?'faq':'other';
 try{window.endcapTrack?.('cta_click',{cta:zone,landing_page:location.pathname});}catch(_){}
});

// Desktop header: compact once the page scrolls, hidden while reading down, back on any upward scroll.
(()=>{const mast=document.querySelector('.mast');if(!mast)return;const wide=matchMedia('(min-width:901px)');let lastY=scrollY,raf=0;
 const update=()=>{raf=0;const y=scrollY;if(!wide.matches){mast.classList.remove('is-scrolled','is-away');lastY=y;return;}
  // Compact past 120px, full size again under 40px. One threshold let the 28px size change bounce the header (2026-10-18).
  if(y>120)mast.classList.add('is-scrolled');else if(y<40)mast.classList.remove('is-scrolled');
  if(y>480&&y>lastY+6)mast.classList.add('is-away');else if(y<lastY-6||y<=480)mast.classList.remove('is-away');
  if(Math.abs(y-lastY)>6)lastY=y;};
 addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update);},{passive:true});
 mast.addEventListener('focusin',()=>mast.classList.remove('is-away'));update();})();

// Mobile dock: shows once the first screen has scrolled away, except on pages that carry a form. The ad landing pages
// keep it, pointed at their form further down, and hide it while that form is on screen.
const dock=document.querySelector('.hx-dock');
if(dock){
 const toForm=dock.querySelector('a[href="#inquiry"]')&&document.getElementById('inquiry');
 if((document.getElementById('review-form')&&!toForm)||!hasIO)dock.remove();
 else{
  const first=document.querySelector('main>*:first-child')||document.querySelector('header');
  const footer=toForm||document.querySelector('.footer, .re-invitation');
  let past=false,atEnd=false;
  const sync=()=>dock.classList.toggle('is-on',past&&!atEnd);
  new IntersectionObserver(([e])=>{past=!e.isIntersecting;sync();}).observe(first);
  if(footer)new IntersectionObserver(es=>{atEnd=es.some(e=>e.isIntersecting);sync();}).observe(footer);
 }
}

// Inquiries from a city guide or industry page carry the page name, so the reply can start there.
(()=>{const from=new URLSearchParams(location.search).get('from')||new URLSearchParams(location.hash.slice(1)).get('from'),form=document.getElementById('review-form');
 if(!from||!form)return;const ex=form.querySelector('[name=example]');if(ex&&!ex.value)ex.value=from.slice(0,120);
 // Requests from the research pages and the website check get a note saying what to send and what comes back.
 const kind=/scorecard request/i.test(from)?'center':/scan results request/i.test(from)?'agency':/^Website check request/i.test(from)?'checkreq':/^Website check/i.test(from)?'check':/^Website law calendar/i.test(from)?'deadline':'';
 const copy={center:['Scorecard request','Tell us the center’s name and city, and whether you own, manage, or lease it. Noah will email the scorecard: every criterion, what we found, and what would raise the score.','Center name, city, and your role (owner, manager, or leasing broker)'],
  agency:['Accessibility results request','Tell us the agency’s name and your role. Noah will email the results for your homepage and the PDFs we checked, with the fixes that clear the most problems.','Agency name and your role'],
  check:['Your free video review','Your scores come with this message. Tell us what you would like to improve, and Noah will email a five-minute video review of your site: what to fix first, and whether repairs or a redesign make more sense.','What would you like to improve?'],
  checkreq:['Website check request','Your website address comes with this message. We will run the check and email you the scores, the problems it found in plain English, and what we would fix first.','Anything you would like us to look at in particular?'],
  deadline:['Website update before a deadline','Tell us the website address and the rules or dates you are working toward. Noah will reply with what would change on the site, the timing, and a quote. Your counsel approves any legal wording.','Website address, and the rules or dates that apply to you']}[kind];
 if(!copy)return;
 form.classList.add('is-request');
 const note=document.createElement('div');note.className='hx-request';note.innerHTML='<strong></strong><p></p>';
 note.querySelector('strong').textContent=copy[0];note.querySelector('p').textContent=copy[1];form.prepend(note);
 const msg=form.querySelector('textarea');if(msg)msg.placeholder=copy[2];
 const h1=document.getElementById('contact-title');if(h1)h1.innerHTML={center:'Request your<br> <em>scorecard.</em>',agency:'Request your<br> <em>results.</em>',check:'Send your<br> <em>results.</em>',checkreq:'Request your<br> <em>check.</em>',deadline:'Plan your<br> <em>update.</em>'}[kind];
 const label=form.querySelector('#message-label'),select=form.querySelector('select[name=interest]'),button=form.querySelector('button[type=submit]');
 if(label&&kind!=='check'&&kind!=='checkreq')label.textContent=kind==='center'?'Your center':kind==='deadline'?'Your website':'Your agency';
 if(select&&!select.value)select.value=kind==='center'?'property':'website';
 if(button&&button.firstChild&&button.firstChild.nodeType===3)button.firstChild.textContent=kind==='check'?'Send my results ':'Send the request ';
 try{window.endcapTrack?.('request_view',{kind});}catch(_){}
})();

// Contact brief: tapped answers become the first line of the message, which stays editable.
document.querySelectorAll('.hx-brief').forEach(box=>{
 const form=box.closest('form'),message=form.querySelector('textarea'),select=form.querySelector('select[name=interest]');
 if(!message)return;
 box.hidden=false;
 // The "What do you need?" answers set the project type, so the duplicate dropdown is hidden while the brief works.
 // It stays in the form (and visible without this script), so the value is still submitted.
 if(select){select.hidden=true;const l=form.querySelector('label[for="'+select.id+'"]');if(l)l.hidden=true;}
 const picked={};let last='';
 const sentence=()=>{
  if(!picked.need&&!picked.kind&&!picked.when)return '';
  let s='We need '+(picked.need||'help with a project');
  if(picked.kind)s+=' for '+(/^(a |an )/.test(picked.kind)?picked.kind:'a '+picked.kind+' business');
  if(picked.when)s+=picked.when==='just exploring'?'. We are just exploring for now.':', '+picked.when+'.';
  else s+='.';
  return s;
 };
 box.addEventListener('click',e=>{
  const chip=e.target.closest('.hx-chip');if(!chip)return;
  const row=chip.closest('.hx-brief-row'),key=row.dataset.key,on=chip.getAttribute('aria-pressed')!=='true';
  row.querySelectorAll('.hx-chip').forEach(c=>c.setAttribute('aria-pressed','false'));
  if(on){chip.setAttribute('aria-pressed','true');picked[key]=chip.dataset.value;}else delete picked[key];
  if(key==='need'&&select&&chip.dataset.interest&&on)select.value=chip.dataset.interest;
  const next=sentence(),current=message.value;
  const rest=last&&current.startsWith(last)?current.slice(last.length).replace(/^\n+/,''):(last?current:current);
  message.value=next?(next+(rest?'\n\n'+rest:'\n\n')):rest;
  last=next;
  try{window.endcapTrack?.('brief_chip',{key,value:chip.dataset.value});}catch(_){}
 });
});

// City guide table: sortable columns and region filter (the table reads fine without this).
document.querySelectorAll('.mk-table').forEach(table=>{
 const body=table.tBodies[0],heads=[...table.tHead.rows[0].cells];
 heads.forEach((th,col)=>{
  th.tabIndex=0;
  const sort=()=>{
   const asc=th.getAttribute('aria-sort')==='descending'?true:th.getAttribute('aria-sort')==='ascending'?false:th.dataset.sort==='text';
   heads.forEach(h=>h.removeAttribute('aria-sort'));th.setAttribute('aria-sort',asc?'ascending':'descending');
   const val=r=>th.dataset.sort==='text'?r.cells[col].textContent.trim():parseFloat(r.cells[col].dataset.v);
   [...body.rows].sort((a,b)=>{const x=val(a),y=val(b);return (typeof x==='string'?x.localeCompare(y):x-y)*(asc?1:-1);}).forEach(r=>body.append(r));
  };
  th.addEventListener('click',sort);th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sort();}});
 });
 const find=table.closest('section').querySelector('.mk-find');
 if(find){find.hidden=false;const input=find.querySelector('input');input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();[...body.rows].forEach(r=>{r.hidden=!!q&&!r.cells[0].textContent.toLowerCase().includes(q);});});}
 const filter=table.closest('section').querySelector('.mk-filter');
 if(filter)filter.addEventListener('click',e=>{const b=e.target.closest('[data-region]');if(!b)return;
  filter.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  [...body.rows].forEach(r=>r.hidden=!!b.dataset.region&&r.dataset.region!==b.dataset.region);});
});

// Articles: a reading progress line, and on wide screens a contact card that rides beside the text.
document.querySelectorAll('.legacy-reading').forEach(article=>{
 if(!article.querySelector('.legacy-article-masthead'))return;
 // Contents list on the left for long articles; the section being read is marked.
 const heads=[...article.querySelectorAll('h2')].filter(h=>!h.closest('aside,figure,.legacy-cta-band,.article-offer,[class*="offer"]')&&h.textContent.trim().length>3);
 if(heads.length>=3){
  const toc=document.createElement('nav');toc.className='gx-toc';toc.setAttribute('aria-label','In this guide');
  toc.innerHTML='<p>In this guide</p><ol></ol>';
  const ol=toc.querySelector('ol');
  heads.forEach((h,i)=>{if(!h.id)h.id='s-'+(h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||i);
   const li=document.createElement('li');li.innerHTML='<a href="#'+h.id+'"></a>';li.firstChild.textContent=h.textContent.trim();ol.append(li);});
  document.body.append(toc);
  const links=[...toc.querySelectorAll('a')];
  let tocRaf=0;
  const mark=()=>{tocRaf=0;let cur=-1;heads.forEach((h,i)=>{if(h.getBoundingClientRect().top<innerHeight*.35)cur=i;});links.forEach((a,i)=>a.classList.toggle('is-on',i===cur));
   const r=article.getBoundingClientRect();toc.classList.toggle('is-on',r.top<-innerHeight*.3&&r.bottom>innerHeight*.9);};
  addEventListener('scroll',()=>{if(!tocRaf)tocRaf=requestAnimationFrame(mark);},{passive:true});mark();
 }
 const bar=document.createElement('div');bar.className='gx-progress';bar.setAttribute('aria-hidden','true');document.body.append(bar);
 const card=document.createElement('aside');card.className='gx-aside';card.setAttribute('aria-label','Contact Endcap');
 card.innerHTML='<img src="/media/ai-site-20260912/noah.webp" alt="" width="64" height="80" loading="lazy"><p class="gx-aside-k">Endcap Design</p><p class="gx-aside-t">Want this done for your business?</p><p class="gx-aside-d">Noah designs and builds every site. Replies within an hour during business hours.</p><a class="hx-btn" href="/contact/#from='+encodeURIComponent('Article: '+document.title.split(' | ')[0])+'">Let’s talk</a><a class="gx-aside-alt" href="mailto:hello@endcap.design">or email hello@endcap.design</a>';
 document.body.append(card);
 let raf=0;
 const update=()=>{raf=0;const r=article.getBoundingClientRect(),total=r.height-innerHeight*.6,p=Math.min(1,Math.max(0,-r.top/(total||1)));bar.style.transform='scaleX('+p.toFixed(4)+')';card.classList.toggle('is-on',r.top<-innerHeight*.4&&r.bottom>innerHeight*.9);};
 addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update);},{passive:true});update();
});

// Below-the-fold drawings (the homepage map) arrive just before they are needed; their sections keep plain links.
document.querySelectorAll('.gx-lazy-svg[data-src]').forEach(slot=>{
 const load=()=>fetch(slot.dataset.src).then(r=>r.ok?r.text():'').then(svg=>{if(!svg)return;slot.innerHTML=svg;slot.removeAttribute('style');slot.closest('.hx-map')?.classList.add('has-map');}).catch(()=>{});
 if(!('IntersectionObserver' in window))return load();
 const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'900px 0px'});
 io.observe(slot);
});

// Long tables open with their first rows; Show all, a search, or a region filter reveals the rest.
// Long tables ship every row; the script collapses them, so a visitor without it still sees the whole table.
document.querySelectorAll('table[data-collapse], ol[data-collapse]').forEach(table=>{
 const wrap=table.closest('section'),btn=wrap&&wrap.querySelector('.mk-showall');if(!btn)return;
 const count=table.tBodies?table.tBodies[0].rows.length:table.children.length;
 const limit=+(table.dataset.collapse||15);if(count<=limit)return;
 table.classList.add('is-collapsed');btn.hidden=false;const open=()=>{table.classList.remove('is-collapsed');btn.hidden=true;};
 btn.querySelector('button').addEventListener('click',open);
 wrap.querySelector('.mk-find input')?.addEventListener('input',open);
 wrap.querySelector('.mk-filter')?.addEventListener('click',e=>{if(e.target.closest('[data-region]'))open();});
});

// Pages with an offer of their own (a scorecard, scan results) point the phone contact bar at it.
(()=>{const s=document.querySelector('[data-dock-label]'),dock=document.querySelector('.hx-dock-main');if(!s||!dock)return;
 dock.firstChild.nodeType===3?dock.firstChild.textContent=s.dataset.dockLabel+' ':dock.prepend(s.dataset.dockLabel+' ');dock.href=s.dataset.dockHref;})();

// Deadline counters stay current between builds: days from today to the date in data-countdown. Rounded, because a
// daylight saving change in between adds or removes an hour.
document.querySelectorAll('[data-countdown]').forEach(el=>{const d=Math.round((new Date(el.dataset.countdown+'T00:00:00')-new Date().setHours(0,0,0,0))/864e5);if(d>=0)el.textContent=d.toLocaleString('en-US');});

// State rules page: type to filter the list.
document.querySelectorAll('.sr-search input').forEach(input=>{
 const rows=[...document.querySelectorAll('.sr-row')];
 input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();rows.forEach(r=>r.hidden=!!q&&!r.dataset.name.includes(q)&&r.id!==q);});
});

// Sideways-scrolling content that holds nothing focusable (article tables, the phone card rows and scenes, the La Paz
// plan) gets a tab stop while it overflows, so a keyboard can scroll it with the arrow keys (WCAG 2.1.1). Containers
// that don't overflow at the current width keep no extra tab stop.
(()=>{
 const sel='main table,.sv-cards,.sv-scene-art,.lp-map .scroller,.mk-table-scroll,[data-scroll-x]';
 const focusable='a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
 const sync=()=>document.querySelectorAll(sel).forEach(el=>{
  const ox=getComputedStyle(el).overflowX;
  const scrolls=(ox==='auto'||ox==='scroll')&&el.scrollWidth>el.clientWidth+2&&!el.querySelector(focusable);
  if(scrolls&&!el.hasAttribute('tabindex')){
   el.tabIndex=0;el.dataset.gxTab='';
   if(!el.matches('table')&&!el.hasAttribute('role')){
    const h=el.closest('section,figure')?.querySelector('h2,h3,figcaption');
    el.setAttribute('role','region');el.setAttribute('aria-label',(h?(h.innerText||h.textContent).replace(/\s+/g,' ').trim().replace(/[.:]$/,''):'Scrollable content')+' (scrolls sideways)');el.dataset.gxRole='';
   }
  }else if(!scrolls&&el.hasAttribute('data-gx-tab')){
   el.removeAttribute('tabindex');el.removeAttribute('data-gx-tab');
   if(el.hasAttribute('data-gx-role'))['role','aria-label','data-gx-role'].forEach(a=>el.removeAttribute(a));
  }
 });
 sync();let t=0;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(sync,200);});addEventListener('load',sync);
})();

if(!hasIO||reduce)return;
root.classList.add('gx');

const once=(els,opts,fn)=>{
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){fn(e.target);io.unobserve(e.target);}}),opts);
 els.forEach(el=>io.observe(el));
};

// Line drawings draw themselves when they come into view.
const drawables=document.querySelectorAll('.hx-path svg, .hx-qmark, .gx-draw');
drawables.forEach(el=>el.classList.add('is-drawable'));
once(drawables,{rootMargin:'0px 0px -10% 0px'},el=>el.classList.add('is-in'));
once(document.querySelectorAll('.hx-proof, .hx-map, .gx-reveal, .ix-art, .rp-hero-map'),{rootMargin:'0px 0px -18% 0px'},el=>el.classList.add('is-in'));

// Process: steps light up in order and the rail follows the reader.
const process=document.querySelector('.hx-process');
if(process){
 const steps=[...process.querySelectorAll('.hx-step')];
 steps.forEach(s=>s.querySelector('svg')?.classList.add('is-drawable'));
 once(steps,{rootMargin:'0px 0px -20% 0px'},s=>{s.classList.add('is-in');s.querySelector('svg')?.classList.add('is-in');});
 const rail=process.querySelector('.hx-rail');
 let raf=0;
 const update=()=>{raf=0;const r=rail.getBoundingClientRect();const p=Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(innerHeight*.7)));rail.style.setProperty('--p',p.toFixed(3));};
 const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update);};
 new IntersectionObserver(([e])=>{if(e.isIntersecting){addEventListener('scroll',onScroll,{passive:true});update();}else removeEventListener('scroll',onScroll);}).observe(process);
}

// Statement: words darken one at a time as they cross the reading line.
document.querySelectorAll('.hx-statement').forEach(section=>{
 const words=[...section.querySelectorAll('.hx-w')];
 let raf=0;
 const update=()=>{raf=0;const line=innerHeight*.62;words.forEach(w=>w.classList.toggle('is-on',w.getBoundingClientRect().top<line));};
 const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update);};
 new IntersectionObserver(([e])=>{if(e.isIntersecting){addEventListener('scroll',onScroll,{passive:true});update();}else{removeEventListener('scroll',onScroll);update();}}).observe(section);
});

// Count-up figures on the market pages.
const fmt=new Intl.NumberFormat('en-US');
document.querySelectorAll('[data-count]').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.dataset.final=el.textContent;el.textContent=(el.dataset.pre||'')+'0'+(el.dataset.suf||'');}});
once(document.querySelectorAll('[data-count][data-final]'),{rootMargin:'0px 0px -10% 0px'},el=>{
 const end=parseFloat(el.dataset.count),dec=parseInt(el.dataset.dec||'0',10),pre=el.dataset.pre||'',suf=el.dataset.suf||'';
 const t0=performance.now(),dur=1400;
 const tick=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,4),v=end*e;el.textContent=pre+(dec?v.toFixed(dec):fmt.format(Math.round(v)))+suf;if(k<1)requestAnimationFrame(tick);else el.textContent=el.dataset.final;};
 requestAnimationFrame(tick);
});

// Bar charts grow to their values.
once(document.querySelectorAll('.gx-bars'),{rootMargin:'0px 0px -12% 0px'},el=>el.classList.add('is-in'));
})();
