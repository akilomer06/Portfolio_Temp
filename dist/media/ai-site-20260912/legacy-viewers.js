// Shared enhancements for the static campaign pages. HTML remains readable
// without JavaScript. Inquiry delivery uses the existing studio endpoint.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
function track(name, params = {}) {
  try { window.endcapTrack?.(name, { landing_page: location.pathname, ...params }) } catch { /* Analytics never blocks interaction. */ }
}
for (const link of document.querySelectorAll('a[href="#contact"], [data-track]')) {
  link.addEventListener('click', () => track(link.dataset.track || 'quote_cta_click'))
}
// Carry the visitor's selected project into the quote form without changing their message.
for (const link of document.querySelectorAll('[data-project-choice]')) {
  link.addEventListener('click', () => {
    const form = document.querySelector('[data-inquiry-form]')
    if (!form || form.hidden) return
    const service = form.elements.service
    const choice = link.dataset.projectChoice
    if (service.tagName === 'SELECT') {
      const option = Array.from(service.options).find((item) => item.value === choice)
      if (option) service.value = choice
    } else {
      service.value = choice
    }
    const note = form.querySelector('[data-selected-project]')
    note.textContent = `Project: ${choice}`
    note.hidden = false
    track('project_scope_select', { service: choice })
  })
}
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('in-view')
      observer.unobserve(entry.target)
    }
  }, { threshold: 0.12 })
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element))
}

for (const viewer of document.querySelectorAll('[data-document-preview]')) {
  const image = viewer.querySelector('[data-preview-image]')
  const label = viewer.querySelector('[data-preview-label]:not(button)')
  const buttons = viewer.querySelectorAll('[data-preview-src]')
  let revision = 0
  for (const button of buttons) {
    button.disabled = false
    button.addEventListener('click', () => {
      const current = ++revision
      const next = new Image()
      next.onload = () => {
        if (current !== revision) return
        image.src = button.dataset.previewSrc
        image.alt = button.dataset.previewAlt
        label.textContent = button.dataset.previewLabel
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)))
        track('document_preview', { sample: button.dataset.previewSrc.includes('/om-sample/'), page: button.textContent.trim() })
      }
      next.onerror = () => {
        if (current === revision) label.textContent = 'Could not load that page. You can still open the full PDF below.'
      }
      next.src = button.dataset.previewSrc
    })
  }
}

