(() => {
  const root = document.documentElement;
  const config = document.querySelector('meta[name="webly-intro"]');
  if (!config || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const key = 'webly:intro:v1:' + config.content;
  try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
  root.dataset.weblyIntro = 'pending';

  let overlay, timer, originalOverflow, inertNodes = [];
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    const hadFocus = overlay?.contains(document.activeElement);
    delete root.dataset.weblyIntro;
    if (originalOverflow !== undefined) document.body.style.overflow = originalOverflow;
    inertNodes.forEach(([node, wasInert]) => { node.inert = wasInert; });
    overlay?.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('pagehide', finish);
    if (hadFocus) document.querySelector('.mast .wordmark')?.focus({ preventScroll: true });
  };
  const onKey = event => { if (event.key === 'Escape') finish(); };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', event => { if (event.matches) finish(); }, { once: true });
  timer = setTimeout(finish, 4500);
  window.addEventListener('pagehide', finish);
  document.addEventListener('keydown', onKey);
  document.addEventListener('DOMContentLoaded', async () => {
    overlay = document.querySelector('.webly-intro');
    if (!overlay || finished) return finish();
    overlay.querySelector('button')?.addEventListener('click', finish);
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inertNodes = [...document.body.children].filter(node => node !== overlay && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)).map(node => [node, node.inert]);
    inertNodes.forEach(([node]) => { node.inert = true; });
    // Keep the wordmark steady while the local display font becomes available.
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 300))]);
    if (finished) return;
    try { sessionStorage.setItem(key, 'seen'); } catch { /* The intro still works without storage. */ }
    requestAnimationFrame(() => {
      if (finished) return;
      root.dataset.weblyIntro = 'running';
      clearTimeout(timer);
      timer = setTimeout(finish, 1950);
    });
  }, { once: true });
})();
