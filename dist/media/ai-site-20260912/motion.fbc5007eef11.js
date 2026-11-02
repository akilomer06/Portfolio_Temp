(()=>{
if(!('IntersectionObserver' in window))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.documentElement;

// Split the footer signoff into letters so it can rise in and respond to the pointer.
document.querySelectorAll('.ed-signoff').forEach(signoff=>{
 const word=signoff.firstChild;
 if(!word||word.nodeType!==3)return;
 const letters=[...word.textContent].map((ch,i)=>{const s=document.createElement('span');s.className='mo-letter';s.style.setProperty('--i',i);s.textContent=ch;return s;});
 word.replaceWith(...letters);
 const dot=signoff.querySelector(':scope>span:not(.mo-letter)');
 if(dot){dot.classList.add('mo-letter');dot.style.setProperty('--i',letters.length);}
 if(matchMedia('(pointer:fine)').matches)signoff.querySelectorAll('.mo-letter').forEach(l=>{
  l.addEventListener('pointerenter',()=>{l.classList.add('is-lift');clearTimeout(l._t);l._t=setTimeout(()=>l.classList.remove('is-lift'),650);});
 });
});

const reveal=[
 ['.ed-work-heading>*, .ed-project-head>div>*, .ed-project-description, .re-section-head>*, .ed-founder-grid>div>*, .ed-cover-caption, .ed-project-foot',''],
 ['.ed-print-grid>article, .re-service',''],
 ['.ed-print-image, .ed-parker-display, .work-document','wipe'],
];
const targets=[];
reveal.forEach(([selector,kind])=>document.querySelectorAll(selector).forEach(el=>{
 if(el.closest('.ed-opening'))return;
 el.dataset.moReveal=kind;targets.push(el);
}));
// Stagger siblings that enter together.
targets.forEach(el=>{
 const sibs=[...el.parentElement.children].filter(c=>'moReveal' in c.dataset);
 el.style.setProperty('--mo-delay',Math.min(sibs.indexOf(el),5)*0.09+'s');
});
const once=[...targets,...document.querySelectorAll('.mo-strip, .ed-founder figure, .ed-signoff')];
// Anything already on screen stays put so arming the states never causes a flash.
const vh=innerHeight;
once.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<vh&&r.bottom>0&&!el.classList.contains('mo-strip'))el.classList.add('is-in');});
root.classList.add('mo');
// The huge top margin counts anything scrolled past as revealed, so jumping to an anchor never strands hidden sections.
// Once revealed, hand the element back to its own hover styles.
const settle=el=>{if('moReveal' in el.dataset)setTimeout(()=>{delete el.dataset.moReveal;},2600);};
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);settle(e.target);}
}),{rootMargin:'100000px 0px -12% 0px',threshold:0});
// The footer signoff ends the page, so it may never cross the raised trigger line; reveal it as soon as it shows.
const ioEnd=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){e.target.classList.add('is-in');ioEnd.unobserve(e.target);}
}),{rootMargin:'100000px 0px 0px 0px',threshold:0});
once.forEach(el=>{if(el.classList.contains('is-in'))settle(el);else(el.classList.contains('ed-signoff')?ioEnd:io).observe(el);});

if(reduce||!matchMedia('(pointer:fine)').matches)return;

// A "View" bubble follows the pointer over project imagery that links somewhere (the ad landing pages show theirs still).
const zones=[...document.querySelectorAll('.ed-cover, .ed-print-image, .ed-parker-display, .work-document')].filter(zone=>zone.closest('a'));
if(zones.length){
 const cursor=document.createElement('div');
 cursor.className='mo-cursor';cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML='View <svg viewBox="0 0 14 14"><path d="M3 11 L11 3 M5 3 H11 V9"/></svg>';
 document.body.append(cursor);
 let x=-200,y=-200,tx=x,ty=y,raf=0;
 const tick=()=>{x+=(tx-x)*.2;y+=(ty-y)*.2;cursor.style.setProperty('--x',x+'px');cursor.style.setProperty('--y',y+'px');raf=Math.abs(tx-x)+Math.abs(ty-y)>.3?requestAnimationFrame(tick):0;};
 const move=e=>{tx=e.clientX;ty=e.clientY;if(!raf)raf=requestAnimationFrame(tick);};
 zones.forEach(zone=>{
  zone.classList.add('mo-cursor-zone');
  zone.addEventListener('pointerenter',e=>{if(!cursor.classList.contains('is-on')){x=tx=e.clientX;y=ty=e.clientY;}cursor.classList.add('is-on');move(e);});
  zone.addEventListener('pointermove',move);
  zone.addEventListener('pointerleave',()=>cursor.classList.remove('is-on'));
 });
}

// The primary header button leans toward the pointer.
const magnet=document.querySelector('.mast .nav-contact');
if(magnet){
 magnet.style.transition='transform .6s cubic-bezier(.34,1.56,.64,1)';
 magnet.addEventListener('pointermove',e=>{const r=magnet.getBoundingClientRect();magnet.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`;});
 magnet.addEventListener('pointerleave',()=>{magnet.style.transform='';});
}
})();
