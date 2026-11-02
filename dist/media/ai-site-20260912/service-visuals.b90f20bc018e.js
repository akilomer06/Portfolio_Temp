(()=>{
// Illustrated service pages. Content is complete without this script; it arms the reveal states,
// steps each storyboard scene, runs the before/after switches, and pauses loops off screen.
if(!document.querySelector('.sv')||!('IntersectionObserver' in window))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.documentElement;

// Reveal blocks once. Anything already on screen is shown at once so arming never flashes.
const blocks=[...document.querySelectorAll('.sv [data-sv-in]')];
blocks.forEach(el=>{
 const sibs=[...el.parentElement.children].filter(c=>c.hasAttribute('data-sv-in'));
 if(sibs.length>1)el.style.setProperty('--sv-delay',Math.min(sibs.indexOf(el),5)*.08+'s');
});
const vh=innerHeight;
blocks.forEach(el=>{const r=el.getBoundingClientRect();if(reduce||(r.top<vh*.9&&r.bottom>0))el.classList.add('is-in');});
root.classList.add('sv-armed');
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}
}),{rootMargin:'100000px 0px -10% 0px',threshold:0});
blocks.forEach(el=>{if(!el.classList.contains('is-in'))io.observe(el);});

// Storyboards: step N shows every .sv-at-N, the finished drawing holds, then the panel clears and repeats.
document.querySelectorAll('[data-sv-story]').forEach(fig=>{
 const total=+fig.dataset.svStory,tick=+fig.dataset.svTick||1600,hold=3;
 const svg=fig.querySelector('svg');
 const legend=[...fig.querySelectorAll('.sv-legend li[data-step]')];
 const mark=n=>legend.forEach(li=>{const s=+li.dataset.step;li.classList.toggle('is-on',s===n);li.classList.toggle('is-done',s<n||n>total);});
 const show=n=>{fig.querySelectorAll('.sv-at-'+n).forEach(el=>el.classList.add('is-shown'));mark(n);};
 const clear=()=>{fig.querySelectorAll('.is-shown').forEach(el=>el.classList.remove('is-shown'));legend.forEach(li=>li.classList.remove('is-on','is-done'));};
 if(reduce){for(let n=1;n<=total;n++)show(n);mark(total+1);if(svg&&svg.pauseAnimations)svg.pauseAnimations();return;}
 let step=0,timer=0;
 const advance=()=>{
  step=step>=total+hold+1?1:step+1;
  if(step<=total)show(step);else if(step===total+1)mark(total+1);else if(step===total+hold)clear();
  timer=setTimeout(advance,tick);
 };
 new IntersectionObserver(([e])=>{
  fig.classList.toggle('is-paused',!e.isIntersecting);
  if(svg&&svg.pauseAnimations)e.isIntersecting?svg.unpauseAnimations():svg.pauseAnimations();
  clearTimeout(timer);
  if(e.isIntersecting)timer=setTimeout(advance,step?tick:350);
 },{threshold:.2}).observe(fig);
});

// Switches: buttons set data-state. They cycle while visible until someone chooses one.
document.querySelectorAll('[data-sv-switch]').forEach(box=>{
 const tabs=[...box.querySelectorAll('[data-sv-tab]')];
 const keys=tabs.map(t=>t.dataset.svTab);
 const set=k=>{box.dataset.state=k;tabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.svTab===k)));box.querySelectorAll('[data-sv-st]').forEach(el=>el.classList.toggle('is-active',el.dataset.svSt===k));};
 let auto=!reduce,timer=0,i=0,started=false;
 tabs.forEach(t=>t.addEventListener('click',()=>{auto=false;clearTimeout(timer);set(t.dataset.svTab);}));
 if(!auto)return;
 const every=+box.dataset.svEvery||3400;
 const cycle=()=>{i=(i+1)%keys.length;set(keys[i]);timer=setTimeout(cycle,every);};
 new IntersectionObserver(([e])=>{
  clearTimeout(timer);
  if(!e.isIntersecting||!auto)return;
  if(!started){started=true;i=0;set(keys[0]);}
  timer=setTimeout(cycle,every*.6);
 },{threshold:.45}).observe(box);
});

// On narrow screens a scene scrolls sideways; open it on its main subject.
const focus=()=>document.querySelectorAll('.sv-scene-art').forEach(art=>{
 const f=+(art.dataset.svFocus||.5);
 if(art.scrollWidth>art.clientWidth+4)art.scrollLeft=Math.max(0,f*art.scrollWidth-art.clientWidth/2);
});
focus();addEventListener('resize',focus);

// Small looping drawings pause off screen.
const loops=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-paused',!e.isIntersecting)),{rootMargin:'120px 0px'});
document.querySelectorAll('.sv-cards, .sv-pair').forEach(el=>loops.observe(el));
})();
