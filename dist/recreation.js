document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!form.reportValidity() || form.dataset.sending) return;
    let status = form.querySelector('[role="status"], #review-status');
    if (!status) { status = document.createElement('p'); status.setAttribute('role','status'); form.append(status); }
    if (form.id !== 'review-form') { status.textContent = 'This tool is part of the visual recreation. Please use the contact page to send an inquiry.'; return; }
    const values = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[type="submit"]');
    form.dataset.sending = 'true'; if (button) button.disabled = true;
    status.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch('/api/inquiries', { method:'POST', headers:{'Content-Type':'application/json','X-CMS-Request':'1'}, body:JSON.stringify({ ...values, source:location.pathname }) });
      let result; try { result = await response.json(); } catch { throw new Error('The inquiry server is unavailable. Your details are still here.'); }
      if (!response.ok) throw new Error(result.error || 'Unable to save your inquiry.');
      status.textContent = 'Thanks. Your inquiry has been received. We’ll be in touch by email.';
      form.reset();
    } catch (error) { status.textContent = error.message; }
    finally { delete form.dataset.sending; if (button) button.disabled = false; status.tabIndex=-1; status.focus(); }
  }, true);
});
