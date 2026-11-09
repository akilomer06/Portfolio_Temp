const mast = document.querySelector('.mast');
const menuToggle = mast?.querySelector('.menu-toggle');
const menu = mast?.querySelector('#main-nav');
if (menuToggle && menu) {
  const mobile = matchMedia('(max-width: 900px)');
  const setMenu = (open, focus = false) => {
    mast.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-locked', open && mobile.matches);
    menuToggle.setAttribute('aria-expanded', String(open));
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = open ? '−' : '+';
    menuToggle.replaceChildren(open ? 'Close ' : 'Menu ', icon);
    if (focus) menuToggle.focus();
  };
  const isOpen = () => menuToggle.getAttribute('aria-expanded') === 'true';
  mast.dataset.enhanced = 'true';
  menuToggle.hidden = false;
  menuToggle.addEventListener('click', () => setMenu(!isOpen()));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && isOpen()) setMenu(false, true); });
  document.addEventListener('click', event => { if (isOpen() && !mast.contains(event.target)) setMenu(false); });
  mobile.addEventListener('change', () => setMenu(false));
}

const enquiryForm = document.querySelector('[data-audit-contact]');
if (enquiryForm && typeof fetch === 'function') {
  enquiryForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = enquiryForm.querySelector('button[type=submit]');
    const status = enquiryForm.querySelector('[role=status]');
    const data = Object.fromEntries(new FormData(enquiryForm));
    button.disabled = true;
    status.hidden = false;
    status.removeAttribute('data-error');
    status.textContent = 'Sending your enquiry…';
    try {
      const response = await fetch(enquiryForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (!response.ok || !result.received) throw new Error(result.error || 'Your enquiry could not be sent.');
      enquiryForm.reset();
      status.textContent = 'Thanks. We received your enquiry and will reply by email.';
    } catch (error) {
      status.setAttribute('data-error', '');
      status.textContent = error.name === 'TimeoutError' || error instanceof TypeError || error instanceof SyntaxError
        ? 'We couldn’t confirm delivery. Your details are still in the form. Please try again or email us.'
        : error.message;
    } finally {
      button.disabled = false;
      status.focus();
    }
  });
}

document.addEventListener('click', event => {
  if (!event.target.closest('a[data-analytics="whatsapp"]')) return;
  fetch('/api/site-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
    body: '{"event":"whatsapp"}',
    keepalive: true
  }).catch(() => {});
});
