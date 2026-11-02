// Static project controls survive the move away from the old React entries.
for (const viewer of document.querySelectorAll('[data-document-preview]')) {
  const image = viewer.querySelector('[data-preview-image]');
  const label = viewer.querySelector('[data-preview-label]:not(button)');
  const buttons = [...viewer.querySelectorAll('[data-preview-src]')];
  if (!image || !buttons.length) continue;
  let revision = 0;
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const current = ++revision;
      const next = new Image();
      next.onload = () => {
        if (current !== revision) return;
        image.src = button.dataset.previewSrc;
        image.alt = button.dataset.previewAlt || image.alt;
        if (label) label.textContent = button.dataset.previewLabel || button.textContent;
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      };
      next.onerror = () => {
        if (current === revision && label) label.textContent = 'Could not load this page. The full PDF is available below.';
      };
      next.src = button.dataset.previewSrc;
    });
  }
}
