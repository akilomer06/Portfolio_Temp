import { normalizeURL } from '../dist/cms/urls.mjs';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));
const e = escapeHTML;

export const studioSettings = {
  bookingUrl: '', whatsappUrl: '', linkedin: '', github: '', city: '', registration: '',
  starterPrice: '₹25,000', businessPrice: '₹55,000',
  projectTimeline: 'Starter: about 2–3 weeks. Business: about 4–6 weeks. Custom platforms are scheduled after discovery.',
  paymentTerms: 'A typical project is split into a 50% deposit and 50% before launch. The proposal confirms the payment schedule.',
  revisionTerms: 'Standard packages allow for two rounds of consolidated feedback. Further changes can be scoped separately.',
  maintenanceTerms: 'We can quote ongoing updates and maintenance separately. Hosting and domain charges depend on the provider and are listed in the proposal.',
  ownershipTerms: 'We agree access to the site, source code, and domain before the project starts and document the handover in the proposal.',
  timeZone: 'India Standard Time (IST)'
};
export const studioLinks = ['bookingUrl', 'whatsappUrl', 'instagram', 'linkedin', 'github'];
const founders = ['Mohamed Fardeen', 'Mohammed Omer Akil'];
export const contactOptions = {
  interest: [['website', 'Business website'], ['store', 'Online store or ordering'], ['event', 'Event or competition site'], ['redesign', 'Redesign'], ['other', 'Something else']],
  budget: [['under-25k', 'Under ₹25,000'], ['25k-50k', '₹25,000–₹50,000'], ['50k-100k', '₹50,000–₹1,00,000'], ['100k-plus', '₹1,00,000+'], ['unsure', 'Not sure yet']],
  timeline: [['asap', 'As soon as possible'], ['one-month', 'About one month'], ['two-three-months', 'Two to three months'], ['flexible', 'Flexible']]
};

export function externalLink(value) {
  try { return normalizeURL(value, { optional: true, webOnly: true }); }
  catch { return ''; }
}

const navLink = (href, label, className = '', attributes = '') =>
  `<a href="${e(href)}"${className ? ` class="${className}"` : ''}${attributes}>${e(label)}</a>`;
export function contactActions(settings, { secondary = false, label } = {}) {
  const booking = externalLink(settings.bookingUrl);
  const whatsapp = externalLink(settings.whatsappUrl);
  return `<div class="audit-actions">${navLink(booking || '/contact/', label || (booking ? 'Book a call' : 'Tell us about your project'), 'audit-button')}
    ${whatsapp ? navLink(whatsapp, 'WhatsApp us', 'audit-button audit-secondary', ' data-analytics="whatsapp"') : ''}
    ${secondary ? navLink('/work/', 'See our work', 'audit-button audit-secondary') : ''}</div>`;
}

export function socialLinks(settings) {
  const links = [['Instagram', settings.instagram], ['LinkedIn', settings.linkedin], ['GitHub', settings.github]]
    .map(([name, href]) => externalLink(href) ? navLink(externalLink(href), name) : '').join('');
  return links ? `<nav class="audit-social" aria-label="Social profiles">${links}</nav>` : '';
}

export function pageField(page, node, fallback) {
  return page?.fields?.find(field => field.node === node)?.value || fallback;
}

export const auditFields = {
  '/': [
    ['audit-home-title', 'Websites that take orders on WhatsApp.', 'h1'],
    ['audit-home-lead', 'We build websites for restaurants, independent brands, and event teams in India. Give people a clear next step, from choosing a meal to signing up for an event.', 'p']
  ],
  '/about/': [
    ['audit-about-title', 'A web studio for independent businesses and events.', 'h1'],
    ['audit-about-intro', 'We’re two developers who started Webly around a simple idea: the people who understand the brief should also be the people building the site. We design and develop websites for independent businesses and event teams, with particular care for the moments when someone needs to place an order, find information, or sign up.', 'p']
  ],
  '/services/': [
    ['audit-services-title', 'Websites for businesses that take orders and run events.', 'h1'],
    ['audit-services-lead', 'We work with restaurants and cloud kitchens, fragrance and retail brands, colleges, and event organisers. Start with a package or talk to us about a custom build.', 'p']
  ]
};

export function applyAuditDefaults(content) {
  let changes = 0;
  for (const [key, value] of Object.entries(studioSettings)) {
    if (!(key in content.settings)) { content.settings[key] = value; changes++; }
  }
  for (const [key, before, after] of [
    ['tagline', 'Web & AI Studio / India', 'Web Design & Development / India'],
    ['replyTime', 'Within an hour during business hours', 'Within one business day'],
    ['copyright', '© 2026 Webly Web Design', '© 2026 Webly'],
    ['instagram', 'https://www.instagram.com/endcap.design/', '']
  ]) {
    if (content.settings[key] === before) { content.settings[key] = after; changes++; }
  }
  for (const [key, before, after] of [['ink', '#181a17', '#25222b'], ['muted', '#5e6258', '#57515e'], ['line', '#bbbfb1', '#bdb6c2'], ['headingFont', 'Endcap Grotesk', 'Fraunces']]) {
    if (content.theme[key] === before) { content.theme[key] = after; changes++; }
  }
  for (const [path, fields] of Object.entries(auditFields)) {
    const page = content.pages.find(item => item.path === path);
    if (!page) continue;
    for (const [node, value, tag] of fields) {
      if (!page.fields.some(field => field.node === node)) {
        page.fields.push({ id: node + ':0', node, index: 0, value, tag, group: 'Page introduction' });
        changes++;
      }
    }
  }
  const home = content.pages.find(page => page.path === '/');
  if (home?.title === 'Webly | Web & AI Studio') {
    home.title = 'Webly | Websites and WhatsApp ordering';
    home.description = 'Webly designs business websites, WhatsApp ordering experiences, and event platforms from India.';
    changes++;
  }
  return changes;
}

export function homeOpening(content, page) {
  const title = pageField(page, 'audit-home-title', auditFields['/'][0][1]);
  const lead = pageField(page, 'audit-home-lead', auditFields['/'][1][1]);
  const count = content.projects.filter(project => project.status === 'published').length;
  return `<section class="audit-home" aria-labelledby="hero-title">
    <div class="shell audit-home-grid"><div><h1 id="hero-title" data-cms-node="audit-home-title">${e(title)}</h1>
      <p class="audit-lead" data-cms-node="audit-home-lead">${e(lead)}</p>${contactActions(content.settings, { secondary: true })}</div>
      <figure class="audit-flight-mark" aria-hidden="true">
        <svg viewBox="0 0 360 290" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 250c90 36 196-51 125-84-47-22-70 37-15 54 47 15 109-13 150-91" stroke="currentColor" stroke-width="2" stroke-dasharray="5 9"/>
          <path d="M86 100 330 25 263 182 209 139 176 169 166 119Z" fill="var(--audit-paper)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="m166 119 164-94-121 114-33 30 4-43 150-101" fill="var(--audit-lavender)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </figure>
    </div>
    <div class="shell audit-proof"><span><strong>${count} live ${count === 1 ? 'project' : 'projects'}</strong> to explore</span><span>React · Next.js · Vercel</span><span>Based in India · remote collaboration</span></div>
  </section>`;
}

export function aboutPage(page, content) {
  const { settings } = content;
  const title = pageField(page, 'audit-about-title', auditFields['/about/'][0][1]);
  const intro = pageField(page, 'audit-about-intro', auditFields['/about/'][1][1]);
  return `<section class="shell audit-page-heading"><h1 data-cms-node="audit-about-title">${e(title)}</h1>
    <p class="audit-lead" data-cms-node="audit-about-intro">${e(intro)}</p></section>
    ${teamSection(true)}
    <section class="shell audit-split"><h2>How we work</h2><div><p>We start by agreeing what the site needs to do, who will use it, and which pages and features belong in the first release.</p>
    <ol><li>Define the brief, deliverables, and review points together.</li><li>Share a working preview so you can respond to the design and the flow.</li><li>Check the main journeys on mobile before launch.</li><li>Walk you through the site and agree any ongoing support.</li></ol></div></section>
    <section class="shell audit-split"><h2>What we care about</h2><dl>
      <dt>Clear next steps</dt><dd>The Quality Kitchen carries menu and portion choices into a WhatsApp enquiry.</dd>
      <dt>Room for the brand</dt><dd>NURA’s storefront uses its own visual identity and gives fragrance details space to breathe.</dd>
      <dt>Useful structure</dt><dd>Talent Hunt puts competitions, schedules, and venue information where participants can find them.</dd>
    </dl></section>
    <section class="shell audit-split"><h2>Work with us</h2><div><p>${e(settings.city ? settings.city + ', ' : '')}${e(settings.location || 'India')} · ${e(settings.timeZone)}</p>
    ${settings.businessHours ? `<p>${e(settings.businessHours)}</p>` : ''}${settings.registration ? `<p>${e(settings.registration)}</p>` : ''}
    ${socialLinks(settings)}${contactActions(settings)}</div></section>`;
}

export function teamSection(full = false) {
  return `<section class="shell audit-split audit-team"><div><h2>Meet the founders</h2>
    <p>Work directly with the two developers behind Webly.</p>${full ? '' : '<a href="/about/">About the studio</a>'}</div>
    <ul class="audit-founders">${founders.map(name => `<li><div class="audit-portrait" aria-hidden="true">${name.split(' ').map(part => part[0]).join('')}</div>
      <div><h3>${e(name)}</h3><p>Co-founder &amp; developer</p>
      ${full ? '<button type="button" class="audit-portfolio-link" disabled>Portfolio coming soon</button>' : ''}</div></li>`).join('')}</ul>
  </section>`;
}

export function closingSection(settings) {
  return `<section class="shell audit-split audit-close"><h2>What would you like to build?</h2><div><p>Tell us what you need and when you’d like it live. We reply ${e((settings.replyTime || 'within one business day').toLowerCase())}.</p>
    ${contactActions(settings)}</div></section>`;
}

function select(name, label, options, required = false) {
  return `<label for="contact-${name}">${e(label)}<select id="contact-${name}" name="${name}"${required ? ' required' : ''}>
    <option value="">Choose an option</option>${options.map(([value, text]) => `<option value="${e(value)}">${e(text)}</option>`).join('')}
  </select></label>`;
}

export function contactPage(settings) {
  const phone = settings.phone && /^\+?[0-9(). -]{6,25}$/.test(settings.phoneLink || '')
    ? `<p>Call ${navLink('tel:' + settings.phoneLink, settings.phone)}</p>` : '';
  const location = [settings.city, settings.location, settings.timeZone].filter(Boolean).join(' · ');
  const booking = externalLink(settings.bookingUrl);
  const whatsapp = externalLink(settings.whatsappUrl);
  return `<section class="shell audit-contact">
    <div class="audit-contact-copy"><h1>Tell us about your project.</h1>
      <p class="audit-lead">Share what you need, who it’s for, and when you’d like it live.</p>
      <p>${navLink('mailto:' + settings.email, settings.email)}</p>${phone}
      <p>${e(location)}<br>${e(settings.businessHours)}<br>Replies: ${e(settings.replyTime)}. Estimates are in INR.</p>
      ${booking || whatsapp ? `<div class="audit-actions">${booking ? navLink(booking, 'Book a call', 'audit-button') : ''}${whatsapp ? navLink(whatsapp, 'WhatsApp us', 'audit-button audit-secondary', ' data-analytics="whatsapp"') : ''}</div>` : ''}
    </div>
    <form class="audit-form" method="post" action="/api/inquiries" data-audit-contact aria-label="Project enquiry">
      <input type="hidden" name="formVersion" value="2">
      <div class="audit-fields"><label>Your name<input name="name" autocomplete="name" maxlength="150" required></label>
      <label>Email address<input type="email" name="email" autocomplete="email" maxlength="250" required></label></div>
      <div class="audit-fields"><label>WhatsApp number <small>(optional)</small><input name="whatsapp" type="tel" autocomplete="tel" maxlength="40"></label>
      ${select('interest', 'Project type', contactOptions.interest, true)}</div>
      <div class="audit-fields">${select('budget', 'Budget range (INR)', contactOptions.budget, true)}
      ${select('timeline', 'Timeline', contactOptions.timeline, true)}</div>
      <label>Project details<textarea name="message" required maxlength="3000" rows="5" placeholder="What should the site help people do?"></textarea></label>
      <label>Existing website <small>(optional)</small><input name="site" type="url" maxlength="500" placeholder="https://"></label>
      <label>Preferred time for a call <small>(optional, include your time zone)</small><input id="contact-call" name="callTime" maxlength="120"></label>
      <div hidden><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="audit-consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that Webly can use these details to respond to my enquiry. Read the <a href="/privacy/">privacy policy</a>.</span></label>
      <button class="audit-button" type="submit">Send project enquiry</button>
      <p class="audit-form-status" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" hidden></p>
    </form>
  </section>`;
}

export function enquiryResponse(response, status, title, detail) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(title)}</title><link rel="stylesheet" href="/cms/audit.css"></head>
    <body class="audit-standalone"><main class="shell audit-page-heading"><h1>${e(title)}</h1><p class="audit-lead">${e(detail)}</p><a class="audit-button" href="/contact/">Back to contact</a></main></body></html>`;
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(html);
}
