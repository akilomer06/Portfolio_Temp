(() => {
  const root = document.documentElement;
  const config = document.querySelector('meta[name="webly-intro"]');
  const connection = navigator.connection;
  if (!config || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches
      || connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return;
  const key = 'webly:intro:v1:' + config.content;
  try { if (sessionStorage.getItem(key)) return; } catch { return; }
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
    const skip = overlay.querySelector('button');
    skip?.addEventListener('click', finish);
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inertNodes = [...document.body.children].filter(node => node !== overlay && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)).map(node => [node, node.inert]);
    inertNodes.forEach(([node]) => { node.inert = true; });
    skip?.focus({ preventScroll: true });
    // Keep the wordmark steady while the local display font becomes available.
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 150))]);
    if (finished) return;
    try { sessionStorage.setItem(key, 'seen'); } catch { /* The intro still works without storage. */ }
    requestAnimationFrame(() => {
      if (finished) return;
      root.dataset.weblyIntro = 'running';
      clearTimeout(timer);
      timer = setTimeout(finish, 1330);
    });
  }, { once: true });
})();
