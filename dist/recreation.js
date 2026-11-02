// This visual recreation has no mail-delivery backend. Keep the original form
// interactions, validate fields, and save a draft on this browser only.
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    let status = form.querySelector('[role="status"], #review-status');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('role', 'status');
      form.append(status);
    }
    const draft = Object.fromEntries(new FormData(form));
    try {
      localStorage.setItem('endcap-recreation-draft', JSON.stringify(draft));
      status.textContent = 'Draft saved in this browser. This is a website recreation; your message has not been sent.';
    } catch {
      status.textContent = 'This is a website recreation. Your message has not been sent. Your details are still here.';
    }
    status.tabIndex = -1;
    status.focus();
  }, true);
});
