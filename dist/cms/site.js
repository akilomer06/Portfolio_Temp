(async () => {
  const preview = new URLSearchParams(location.search).get('preview') === 'draft';
  let content;
  try {
    const response = await fetch((preview ? '/api/admin/preview' : '/api/site') + '?path=' + encodeURIComponent(location.pathname));
    if (!response.ok) return;
    content = await response.json();
  } catch { return; }
  const { theme, settings, projects, navigation, page, hiddenPaths=[] } = content;
  document.documentElement.dataset.cmsMotion=theme.animations===false?'off':'on';
  document.dispatchEvent(new CustomEvent('cms:settings',{detail:{animations:theme.animations}}));
  const css = document.getElementById('cms-initial-theme') || document.createElement('style');
  const font = value => '"' + value.replace(/[^a-zA-Z0-9 -]/g, '') + '"';
  css.textContent = `[hidden]{display:none!important}:root{--lime:${theme.accent};--acid:${theme.accent};--paper:${theme.paper};--ink:${theme.ink};--muted:${theme.muted};--line:${theme.line};--display:${font(theme.headingFont)},Hanken,Arial,sans-serif}body{font-family:${font(theme.bodyFont)},Arial,sans-serif;font-size:${theme.bodySize}px}em{font-family:${font(theme.serifFont)},Georgia,serif}`;
  for (const custom of theme.customFonts || []) css.textContent += `@font-face{font-family:${font(custom.name)};src:url(${JSON.stringify(custom.url)});font-display:swap}`;
  if (theme.headingFont !== 'Endcap Grotesk') css.textContent += `h1,h2,h3{font-family:${font(theme.headingFont)},Arial,sans-serif!important}`;
  if (theme.bodyFont !== 'Hanken') css.textContent += `p,li,label,input,textarea,button,nav,.eyebrow{font-family:${font(theme.bodyFont)},Arial,sans-serif!important}`;
  if (theme.serifFont !== 'Fraunces') css.textContent += `em,h1 em,h2 em,h3 em,blockquote,.hx-hero-quote{font-family:${font(theme.serifFont)},Georgia,serif!important}`;
  if (theme.headingScale !== 1) css.textContent += `h1,h2{zoom:${theme.headingScale}}`;
  if (!theme.animations) css.textContent += `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}[data-mo-reveal],.gx-reveal,.mo-word,.mo-dot,.mo-letter,.hx-w,.hx-proof,.hx-map,.hx-step{opacity:1!important;transform:none!important;clip-path:none!important}.hx-ln{stroke-dashoffset:0!important}`;
  document.head.append(css);
  if (page) {
    document.title = page.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);
    const nodes = new Map([...document.querySelectorAll('[data-cms-node]')].map(el => [el.dataset.cmsNode, el]));
    for (const field of page.fields) {
      const node = nodes.get(field.node)?.childNodes[field.index];
      if (node?.nodeType === Node.TEXT_NODE && node.nodeValue !== field.value) node.nodeValue = field.value;
    }
  }
  document.querySelectorAll('.wordmark').forEach(el => { const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE); if (node) node.nodeValue = settings.siteName; });
  document.querySelectorAll('.ed-signoff').forEach(el => {
    if (el.textContent === settings.siteName + '.') return;
    el.replaceChildren(...[...settings.siteName,'.'].map((char,index)=>{const span=document.createElement('span');span.className='mo-letter';span.style.setProperty('--i',index);span.textContent=char;return span;}));
    if (matchMedia('(pointer:fine)').matches) el.querySelectorAll('.mo-letter').forEach(letter => {
      letter.addEventListener('pointerenter', () => { letter.classList.add('is-lift'); clearTimeout(letter._t); letter._t = setTimeout(() => letter.classList.remove('is-lift'), 650); });
    });
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => { el.href = 'mailto:' + settings.email; const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.includes('@')); if (node) node.nodeValue = settings.email + ' '; });
  document.querySelectorAll('a[href^="tel:"]').forEach(el => { el.href = 'tel:' + settings.phoneLink; el.textContent = settings.phone; });
  const copyright = document.querySelector('.footer-bottom > span'); if (copyright) copyright.textContent = settings.copyright;
  const tagline = document.querySelector('.ed-issue-line p'); if (tagline) tagline.textContent = settings.tagline;
  if (location.pathname === '/contact/') {
    const form = document.querySelector('#review-form');
    if (form) {
      const details = document.createElement('p');
      details.style.cssText='grid-column:1/-1;font:12px/1.8 Hanken,Arial;color:var(--muted);margin:16px 0';
      details.textContent = `${settings.location} · ${settings.businessHours} · Replies: ${settings.replyTime}`;
      if (settings.instagram) { const link=document.createElement('a');link.href=settings.instagram;link.textContent=' · Instagram ↗';link.rel='noopener';link.target='_blank';details.append(link); }
      form.append(details);
    }
  }
  const nav = document.querySelector('#main-nav');
  if (nav) {
    const old = [...nav.querySelectorAll(':scope > a')];
    const visible = navigation.filter(n => n.visible);
    visible.forEach((item, index) => { const link = old[index] || document.createElement('a'); link.textContent = item.label; link.href = item.href; link.classList.toggle('nav-contact', /contact\/?$/.test(item.href)); if (!link.parentElement) nav.insertBefore(link, nav.querySelector('.nav-reach')); });
    old.slice(visible.length).forEach(el => el.remove());
  }
  const cover = document.querySelector('.ed-cover');
  const featured = projects.find(p => p.featured && p.status === 'published');
  if (cover && featured) {
    cover.href = featured.url;
    if (featured.name !== 'Parker & Associates, Inc.') cover.querySelector('h2').textContent = featured.name;
    cover.querySelector('.ed-cover-lede').textContent = featured.description;
    cover.querySelector('.ed-cover-note span').textContent = featured.category;
    const stage = cover.querySelector('.ed-device-stage');
    if (stage && stage.getAttribute('src') !== featured.image) { stage.src = featured.image; stage.removeAttribute('srcset'); }
    const screen = cover.querySelector('.ed-device-screen');
    if (screen) { screen.hidden = !featured.screen; if (featured.screen && screen.getAttribute('src') !== featured.screen) { screen.src = featured.screen; screen.removeAttribute('srcset'); } screen.alt = featured.alt; }
  } else if (cover) cover.hidden = true;
  const grids = [...document.querySelectorAll('.ed-print-grid')];
  if (grids.length && ['/', '/work/'].includes(location.pathname)) {
    const originals = new Map([...document.querySelectorAll('[data-project-id]')].map(el => [el.dataset.projectId, el]));
    const sample = document.querySelector('.ed-print-grid article');
    const capacities = grids.map(g => g.children.length);
    const cards = projects.filter(p => p.status === 'published' && (location.pathname !== '/' || p.homeVisible !== false)).sort((a,b)=>Number(b.featured)-Number(a.featured));
    grids.forEach(g => g.replaceChildren());
    const projectIndex=document.querySelector('.work-index-items'); if(projectIndex){projectIndex.replaceChildren(...cards.map((p,index)=>{const a=document.createElement('a');a.href='#project-'+p.id;const n=document.createElement('span');n.className='work-index-number';n.textContent=String(index+1).padStart(2,'0');const label=document.createElement('span');label.className='work-index-label';label.textContent=p.category;a.append(n,label);return a;}));const total=document.querySelector('.work-index-total');if(total)total.textContent=String(cards.length).padStart(2,'0')+' PROJECTS';}
    cards.forEach((p, index) => {
      let article = originals.get(p.id);
      if (!article && sample) {
        article = sample.cloneNode(true);
        article.querySelectorAll('[data-cms-node]').forEach(n => n.removeAttribute('data-cms-node'));
        article.querySelectorAll('[data-mo-reveal]').forEach(n => { n.removeAttribute('data-mo-reveal'); n.classList.add('is-in'); });
        article.querySelectorAll('.mo-cursor-zone').forEach(n => n.classList.remove('mo-cursor-zone'));
      }
      if (!article) return;
      article.dataset.projectId = p.id; article.id = 'project-' + p.id;
      article.querySelectorAll('a').forEach(a => a.href = p.url);
      const image = article.querySelector('img');
      if (!image) return;
      const mark=article.querySelector('.ed-print-image'); if(mark) mark.dataset.projectMark=p.name.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
      if (image.getAttribute('src') !== p.image) { image.src = p.image; image.removeAttribute('srcset'); }
      image.alt = p.alt;
      article.querySelector('h3 a').textContent = p.name;
      article.querySelector('.ed-print-caption p').textContent = p.category;
      const description=article.querySelector('.portfolio-description');if(description)description.textContent=p.description;
      article.querySelector('.ed-print-caption > span').textContent = String(index + 1).padStart(2, '0');
      article.classList.add('is-in'); article.removeAttribute('data-mo-reveal');
      let gridIndex = 0, offset = index;
      while (gridIndex < grids.length - 1 && offset >= capacities[gridIndex]) { offset -= capacities[gridIndex]; gridIndex++; }
      grids[gridIndex].append(article);
      originals.delete(p.id);
    });
    originals.forEach(article => article.remove());
    grids.forEach(grid => { grid.hidden = !grid.children.length; });
  }
  document.querySelectorAll('a[href]').forEach(link=>{
    const destination=new URL(link.href,location.href);
    let pathname=destination.pathname.replace(/\/index\.html$/,'/');
    if(!/\.[^/]+$/.test(pathname)&&!pathname.endsWith('/'))pathname+='/';
    if(destination.origin===location.origin&&hiddenPaths.includes(pathname))link.remove();
  });
  if (preview && content.preview) {
    document.querySelectorAll('a[href]').forEach(link => {
      const destination = new URL(link.href,location.href);
      if (destination.origin === location.origin && !destination.pathname.startsWith('/admin') && !destination.pathname.startsWith('/media/')) { destination.searchParams.set('preview','draft'); link.href=destination.href; }
    });
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#181a17;color:#fff;padding:12px 20px;z-index:10000;font:14px Hanken,Arial;box-shadow:0 4px 20px #0003;border-radius:6px;display:flex;gap:20px;align-items:center';
    banner.append('Draft preview'); const link = document.createElement('a'); link.href = '/admin/'; link.textContent = 'Back to admin ↗'; link.style.color = '#b7e1c4'; banner.append(link); document.body.append(banner);
  }
})();
