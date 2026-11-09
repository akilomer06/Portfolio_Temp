export async function deliverEnquiryMail(enquiry) {
  const { RESEND_API_KEY: key, WEBLY_MAIL_FROM: from, WEBLY_INBOX_TO: inbox } = process.env;
  if (!key || !from || !inbox || !enquiry.consent) return;

  async function send(kind, message) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'webly-' + kind + '-' + enquiry.id
      },
      body: JSON.stringify({ from, ...message }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('Email provider returned HTTP ' + response.status);
    }
    await response.body?.cancel();
  }

  // Keep the actual enquiry in the private CMS inbox.
  const results = await Promise.allSettled([
    send('notification', {
      to: [inbox], subject: 'New Webly project enquiry',
      text: 'A project enquiry is waiting for you in the Webly CMS inbox. Sign in to review the details and reply.'
    }),
    send('receipt', {
      to: [enquiry.email], subject: 'We received your Webly enquiry',
      text: 'Thanks for getting in touch with Webly. Your enquiry reached the studio and we’ll follow up by email.'
    })
  ]);
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') console.error('Webly enquiry mail failed:', index === 0 ? 'studio notification' : 'visitor receipt', result.reason.message);
  }
}
