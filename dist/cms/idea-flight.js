(() => {
  const section = document.querySelector('#ideas-in-flight');
  if (!section) return;
  const svg = section.querySelector('.flight-art');
  const route = section.querySelector('[data-flight-route]');
  const trace = section.querySelector('[data-flight-trace]');
  const plane = section.querySelector('[data-flight-plane]');
  const result = section.querySelector('[data-flight-result]');
  const complete = section.querySelector('[data-flight-complete]');
  const paperLines = section.querySelector('[data-flight-paper-lines]');
  const caption = section.querySelector('[data-flight-caption]');
  const pause = section.querySelector('[data-flight-pause]');
  const replay = section.querySelector('[data-flight-replay]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const small = matchMedia('(max-width:650px)');
  const shapes = {
    top: { flat:[[32,-42],[-32,-42],[-32,42]], folded:[[46,0],[-38,-30],[-15,0]] },
    bottom: { flat:[[32,-42],[-32,42],[32,42]], folded:[[46,0],[-15,0],[-30,32]] },
    fold: { flat:[[32,-42],[-32,42],[32,42]], folded:[[46,0],[-30,32],[-10,8]] }
  };
  const wings = [...section.querySelectorAll('[data-flight-wing]')];
  const steps = [...section.querySelectorAll('[data-flight-step]')];
  const clamp = value => Math.min(1,Math.max(0,value));
  const ease = value => { const t=clamp(value);return t*t*(3-2*t); };
  const desktopPath = 'M160 190C340 265 448 250 536 174C611 108 574 38 520 64C452 97 501 237 660 210C814 184 816 72 984 126C1038 143 1084 180 1110 140';
  const mobilePath = 'M88 112C176 44 342 62 326 146C310 229 150 232 156 151C161 78 277 128 248 204C224 265 252 279 300 306';
  let length=1, elapsed=6500, previousTime=0, frame=0, visible=false, userPaused=false, entered=false;
  let motionEnabled=document.documentElement.dataset.cmsMotion!=='off';
  const allowed = () => motionEnabled && !reduced.matches && !connection?.saveData && !['slow-2g','2g','3g'].includes(connection?.effectiveType);
  const active = () => allowed()&&visible&&!document.hidden&&!userPaused;
  let previousStage=-1;
  function geometry() {
    const mobile=small.matches;
    svg.setAttribute('viewBox',mobile?'0 0 420 430':'0 0 1280 330');
    const path=mobile?mobilePath:desktopPath;
    route.setAttribute('d',path);trace.setAttribute('d',path);length=route.getTotalLength();
    section.querySelector('[data-flight-origin]').setAttribute('transform',mobile?'translate(88 112) scale(.75)':'translate(160 190)');
    section.querySelector('[data-flight-destination]').setAttribute('transform',mobile?'translate(300 306) scale(.85)':'translate(1110 140)');
    section.querySelector('.flight-grid').setAttribute('width',mobile?'420':'1280');
    section.querySelector('.flight-grid').setAttribute('height',mobile?'430':'330');
    paint(elapsed);
  }
  function paint(time) {
    const still=!allowed();
    const seconds=(time%16000)/1000; // Use a 16-second, offscreen-paused narrative.
    const folded=still?1:ease((seconds-1)/1.5);
    const progress=still ? .61 : ease((seconds-2.7)/8.6);
    const distance=progress*length;
    const point=route.getPointAtLength(distance);
    const before=route.getPointAtLength(Math.max(0,distance-1));
    const after=route.getPointAtLength(Math.min(length,distance+1));
    const tangent=Math.atan2(after.y-before.y,after.x-before.x)*180/Math.PI;
    const angle=-8+(tangent+8)*folded;
    plane.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${small.matches ? .75 : 1})`);
    plane.style.opacity=still?'1':String(1-ease((seconds-11.4)/.8));
    wings.forEach(wing=>{
      const shape=shapes[wing.dataset.flightWing];
      wing.setAttribute('points',shape.flat.map((start,index)=>start.map((coordinate,axis)=>coordinate+(shape.folded[index][axis]-coordinate)*folded).join(',')).join(' '));
      if(wing.dataset.flightWing==='fold')wing.style.opacity=String(folded*.9);
    });
    paperLines.style.opacity=String((1-folded)*.65);
    trace.style.strokeDashoffset=String(1-progress);
    trace.style.opacity=still?'.8':String(1-ease((seconds-15)/1));
    const landed=still?1:ease((seconds-10.2)/1.4)*(1-ease((seconds-15)/1));
    result.style.opacity=String(.18+.82*landed);
    complete.style.opacity=String(landed);
    const stage=still?1:seconds<2.7?0:seconds<10.2?1:2;
    if(stage!==previousStage){
      previousStage=stage;
      steps.forEach((step,index)=>step.classList.toggle('is-active',index===stage));
      caption.textContent=still?'A little craft can take an idea a long way.':[
        'Every good thing starts with a simple idea.',
        'A little craft. A different point of view.',
        'Ready to make its mark on the world.'
      ][stage];
    }
  }
  function tick(now) {
    frame=0;
    if(!active()){previousTime=0;return;}
    if(previousTime)elapsed=(elapsed+Math.min(now-previousTime,100))%16000;
    previousTime=now;paint(elapsed);frame=requestAnimationFrame(tick);
  }
  function sync() {
    section.toggleAttribute('data-audit-static', !allowed());
    pause.disabled=!allowed();replay.disabled=!allowed();
    pause.setAttribute('aria-label',userPaused?'Play paper plane animation':'Pause paper plane animation');
    pause.setAttribute('aria-pressed',String(userPaused));
    section.querySelector('[data-flight-play-label]').textContent=!allowed()?'Motion off':userPaused?'Play':'Pause';
    section.querySelector('[data-flight-play-icon]').setAttribute('d',userPaused?'m5 3 7 5-7 5z':'M5 3v10M11 3v10');
    if(!allowed()){if(frame)cancelAnimationFrame(frame);frame=0;previousTime=0;paint(elapsed);}
    else if(active()&&!frame){previousTime=0;frame=requestAnimationFrame(tick);}
    else if(!active()&&frame){cancelAnimationFrame(frame);frame=0;previousTime=0;}
  }
  pause.addEventListener('click',()=>{userPaused=!userPaused;sync();});
  replay.addEventListener('click',()=>{elapsed=0;previousStage=-1;userPaused=false;paint(0);sync();});
  reduced.addEventListener('change',()=>{previousStage=-1;sync();});
  connection?.addEventListener('change', sync);
  small.addEventListener('change',geometry);
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('cms:settings',event=>{motionEnabled=event.detail.animations!==false;previousStage=-1;sync();});
  geometry();sync();
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!entered){entered=true;elapsed=0;previousStage=-1;paint(elapsed);}sync();},{threshold:.12}).observe(section);
  else {visible=true;sync();}
})();
