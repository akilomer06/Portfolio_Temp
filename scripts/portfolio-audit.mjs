import { services, studyFor, projectPath, servicePath } from './portfolio-pages.mjs';
import { closingSection, contactActions, escapeHTML as e, pageField } from './site-audit.mjs';

const details = {
  'quality-kitchen': {
    client: 'Mohamed Zayaan · The Quality Kitchen', type: 'Client project', role: 'Design and development', stack: 'Next.js · Tailwind CSS · Vercel', year: '2026',
    window: '2–3 weeks', headings: ['A menu that helps people choose', 'Portions sorted before the message', 'From basket to kitchen'],
    result: 'The basket puts selected dishes and portions into a WhatsApp message the customer can review and send.',
    gallery: [['quality-kitchen-basket.webp', 'Mobile menu and basket showing portion choices before the WhatsApp handoff.']],
    logo: '/media/projects/audit/quality-kitchen-emblem.webp',
    cta: 'Need an ordering site for your kitchen?'
  },
  nura: {
    client: 'Mohamed Fahim · NURA by Bin Sadhik', type: 'Client project', role: 'Design and development', stack: 'React · Vite · Vercel', year: '2026',
    window: '3–4 weeks', headings: ['Bring a fragrance collection online', 'Make scent notes and formats easy to compare', 'From shopping bag to conversation'],
    result: 'Shoppers can browse 15 fragrances, choose perfume or oil, and check the selected size and quantity in a bag before ordering on WhatsApp.',
    gallery: [['nura-product.webp', 'NURA fragrance detail with scent information and size selection.'], ['nura-bag.webp', 'NURA shopping bag with product selections before ordering.']],
    cta: 'Need a storefront for your collection?'
  },
  'prompt-pop': {
    client: 'Crescent Institute · Department of Computer Science and Engineering', type: 'Independent college project', role: 'Built independently by a Webly co-founder', stack: 'React · Vite · Tailwind CSS · Vercel',
    year: '2026', window: '2–3 weeks', headings: ['Give each round a clear entry point', 'One platform for timed and creative challenges', 'From team code to results'],
    result: 'Teams enter with a code and use one platform for the quiz, creative challenges, and results.',
    logo: '/media/projects/audit/prompt-pop-emblem.webp',
    cta: 'Planning an interactive competition?'
  },
  'talent-hunt': {
    client: 'Crescent Institute · Department of Computer Science and Engineering', type: 'Independent college project',
    role: 'Built independently by a Webly co-founder', stack: 'React · Vite · Tailwind CSS · Vercel',
    year: '2026', window: '2–3 weeks', headings: ['Make sixteen competitions easy to find', 'Put the practical details beside each event', 'One place to plan the day'],
    date: '26 October 2026',
    result: 'Participants can browse 16 competitions and find schedules, venues, and coordinator details in one place.',
    gallery: [['talent-hunt-events.webp', 'Talent Hunt’s technical and non-technical competition listings.'], ['talent-hunt-detail.webp', 'A Talent Hunt competition detail page with information for participants.']],
    logo: '/media/projects/audit/talent-hunt-emblem.webp',
    cta: 'Need a home for a multi-event programme?'
  }
};

export const auditProjectDetails = project => ({ ...details[project.id], ...(project.caseStudy?.facts || {}) });
export const editableProjectFacts = ['client', 'year', 'role', 'stack', 'window', 'result', 'quote', 'quoteAttribution'];
export function applyPortfolioFacts(content) {
  let changes = 0;
  for (const project of content.projects) {
    if (!details[project.id]) continue;
    const facts = project.caseStudy?.facts || {};
    const additions = editableProjectFacts.filter(key => details[project.id][key] && !(key in facts));
    if (!additions.length) continue;
    project.caseStudy ||= {};
    project.caseStudy.facts = { ...Object.fromEntries(additions.map(key => [key, details[project.id][key]])), ...facts };
    changes += additions.length;
  }
  return changes;
}
const listed = content => content.projects.filter(project => project.status === 'published');
const events = project => auditProjectDetails(project).type === 'Independent college project';
const ordered = projects => [...projects].sort((a,b) => Number(events(a)) - Number(events(b)) || Number(b.featured) - Number(a.featured));
const external = ' target="_blank" rel="noopener noreferrer"';
const originalCovers = { 'quality-kitchen':'quality-kitchen.jpg', nura:'nura-homepage.png', 'prompt-pop':'prompt-pop.jpg', 'talent-hunt':'talent-hunt.jpg' };

function cover(project, priority = false) {
  const source = '/media/projects/audit/' + project.id + '-cover-';
  const derived = project.image === '/media/projects/' + originalCovers[project.id]
    ? ` srcset="${source}640.webp 640w, ${source}1280.webp 1280w" sizes="${priority ? '(max-width: 700px) 100vw, 1200px' : '(max-width: 650px) 48vw, 600px'}"`
    : '';
  return `<img src="${e(project.image)}"${derived} alt="${e(project.alt)}" width="1280" height="720"${priority ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
}

function projectCard(project) {
  const info = auditProjectDetails(project);
  const url = projectPath(project);
  const meta = [info.year, info.type || project.category, info.role].filter(Boolean).join(' · ');
  const mark = project.name.split(/\s+/).filter(Boolean).slice(0,2).map(word => word[0]).join('');
  return `<article data-project-id="${e(project.id)}" id="project-${e(project.id)}">
    <a class="ed-print-image" href="${url}" data-project-mark="${e(mark)}" aria-label="Explore ${e(project.name)}">${cover(project)}</a>
    <div class="audit-card-copy"><h3><a href="${url}">${e(project.name)}</a></h3>
      <p class="audit-article-meta">${e(meta)}</p><p class="audit-result">${e(info.result || project.description)}</p>
      <a class="wb-case-link" href="${url}">Explore the project</a></div></article>`;
}

export function auditProjectCards(projects, heading = '') {
  if (!projects.length) return '';
  return `<section class="shell ed-print-work portfolio-projects audit-projects">
    ${heading ? `<h2 class="audit-work-heading">${e(heading)}</h2>` : ''}
    <div class="ed-print-grid">${projects.map(projectCard).join('')}</div></section>`;
}

export function auditHomeWork(content) {
  const projects = ordered(listed(content).filter(project => project.homeVisible !== false));
  return `<section id="work" class="audit-home-work">${auditProjectCards(projects.slice(0, 2), 'Selected work')}
    ${projects.length > 2 ? '<div class="shell audit-home-work-link"><a href="/work/">See all projects, including events and platforms</a></div>' : ''}</section>`;
}

export function auditWorkPage(content) {
  const projects = ordered(listed(content));
  const directory = projects.length ? `<nav class="wb-work-directory audit-directory" aria-label="Project index"><ol>${projects.map((project, index) =>
    `<li><a href="${projectPath(project)}"><span class="wb-index">${String(index + 1).padStart(2, '0')}</span><span class="wb-project-name">${e(project.name)}</span><span class="wb-project-type">${e(project.category)}</span></a></li>`).join('')}</ol></nav>` : '';
  return `<section class="shell audit-page-heading"><h1>Selected work.</h1>
    <p class="audit-lead">See how our websites help people order food, choose a fragrance, and find their way through an event.</p>
    <p>${projects.length} live ${projects.length === 1 ? 'project' : 'projects'} to explore</p>${directory}</section>
    ${auditProjectCards(projects.filter(project => !events(project)), 'Business websites and ordering')}
    ${auditProjectCards(projects.filter(events), 'Events and platforms')}${closingSection(content.settings)}`;
}

export function auditCasePage(project, content) {
  const study = studyFor(project);
  const info = auditProjectDetails(project);
  const headings = info.headings || ['The challenge', 'What we built', 'The result'];
  const projects = ordered(listed(content));
  const next = projects[(projects.findIndex(item => item.id === project.id) + 1) % projects.length];
  const facts = [
    [info.type === 'Independent college project' ? 'Institution' : 'Client', info.client],
    [info.date ? 'Event date' : 'Year', info.date || info.year], ['Role', info.role], ['Technology', info.stack], ['Typical build window', info.window],
    ['Scope', study.scope?.join(' · ')]
  ].filter(([, value]) => value);
  const gallery = (info.gallery || []).map(([file, caption]) =>
    `<figure><img src="/media/projects/audit/${e(file)}" alt="${e(caption)}" loading="lazy"><figcaption>${e(caption)}</figcaption></figure>`).join('');
  const logo = project.logo === '/media/projects/nura-logo.png' ? '/media/projects/audit/nura-wordmark.webp' : project.logo || info.logo;
  return `<section class="shell wb-case-header audit-case-header">
    <nav class="wb-breadcrumb" aria-label="Breadcrumb"><a href="/work/">All work</a><span aria-hidden="true">/</span><span>${e(project.category)}</span></nav>
    <div class="wb-case-title"><div><h1>${e(project.name)}</h1><p class="wb-case-headline">${e(study.headline || project.description)}</p></div>
    <a class="audit-button" href="${e(project.url)}"${external}>Visit live website</a></div>
    ${info.quote ? `<blockquote><p>${e(info.quote)}</p><footer>${e(info.quoteAttribution)}</footer></blockquote>` : ''}
    </section>
    <figure class="shell wb-case-hero"><div>${cover(project, true)}</div>
      <figcaption>${e(project.name)} · Website overview</figcaption></figure>
    <section class="shell wb-case-overview"><div><h2>About the project</h2><p>${e(study.intro || project.description)}</p>
      ${logo ? `<img class="audit-case-logo" src="${e(logo)}" alt="${e(project.name)} logo" loading="lazy">` : ''}</div>
      <dl>${facts.map(([key, value]) => `<div><dt>${e(key)}</dt><dd>${e(value)}</dd></div>`).join('')}
      <div><dt>Website</dt><dd><a href="${e(project.url)}"${external}>Open live project</a></dd></div></dl></section>
    <section class="shell wb-case-story"><div role="region" aria-label="The brief"><h2>${e(headings[0])}</h2><p>${e(study.challenge || project.description)}</p></div>
      <div><h2>${e(headings[1])}</h2><p>${e(study.solution || project.description)}</p></div></section>
    ${gallery ? `<div class="shell audit-case-gallery">${gallery}</div>` : ''}
    ${study.features?.length ? `<section class="wb-feature-band audit-case-features"><div class="shell"><h2>Inside the website</h2>
      <ul class="wb-feature-list">${study.features.map(feature => `<li><h3>${e(feature)}</h3></li>`).join('')}</ul></div></section>` : ''}
    <section class="shell audit-split"><h2>${e(headings[2])}</h2><div><p class="audit-result">${e(info.result || project.description)}</p>
      ${study.design ? `<h3>Visual direction</h3><p>${e(study.design)}</p>` : ''}</div></section>
    ${next && next.id !== project.id ? `<div class="shell audit-case-next"><a href="/work/">Back to all work</a><a href="${projectPath(next)}">Next: ${e(next.name)}</a></div>` : ''}
    <section class="shell audit-split"><h2>${e(info.cta || 'Planning a similar project?')}</h2>${contactActions(content.settings)}</section>`;
}

const packages = [
  ['Starter', 'For small businesses that need a clear web presence.', 'Up to five responsive pages, contact form, WhatsApp button, and launch support.', 'starterPrice'],
  ['Business', 'For restaurants and brands ready to take orders.', 'Starter, plus a menu or catalogue, a basket with WhatsApp ordering, content editing, and basic analytics.', 'businessPrice'],
  ['Commerce / Platform', 'For stores, events, and custom workflows.', 'Scoped checkout, admin tools, integrations, or interactive features, with support agreed in the proposal.', '']
];

export function auditPackages(settings, compact = false) {
  return `<section id="${compact ? 'services' : 'packages'}" class="shell audit-packages"><h2>Website packages</h2>
    ${packages.map(([name, intro, scope, price]) => `<article class="audit-package"><div><h3>${name}</h3><p>${intro}</p></div>
      <p>${scope}</p><div><strong>${price && settings[price] ? 'From ' + e(settings[price]) : 'Custom quote'}</strong>
      ${compact ? '' : '<br><a href="/contact/">Ask about this package</a>'}</div></article>`).join('')}
    <p>Starting prices are indicative. Your proposal confirms the scope, timeline, and price.</p>
    ${compact ? '<div class="audit-actions"><a class="audit-button audit-secondary" href="/services/">Explore services</a><a href="/services/ecommerce/">How WhatsApp ordering works</a></div>' : ''}</section>`;
}

const steps = [
  ['Discover', 'Discuss your customers, the project, and what success looks like.', 'Usually 1–2 days'],
  ['Define', 'Agree pages, deliverables, responsibilities, and a schedule.', 'Usually 2–3 days'],
  ['Design & build', 'Review the design and a working preview together.', 'Depends on the package'],
  ['Launch & hand over', 'Check the site, connect the domain, and walk through daily updates.', 'Usually 1–2 days after sign-off']
];

export function auditProcess() {
  return `<section class="wb-process"><div class="shell"><h2>From brief to launch</h2><ol>${steps.map(([name, text, time], index) =>
    `<li><span>${index + 1}</span><h3>${name}</h3><p><strong>${time}</strong></p><p>${text}</p></li>`).join('')}</ol>
    <div class="audit-brief"><h3>What we need from you</h3><p>Share your logo, photos, draft copy, and any menu or product list. Choose one person to gather feedback and sign off on decisions.</p></div></div></section>`;
}

function faq(settings) {
  return [
    ['How much does a website cost?', 'Starter and Business have indicative starting prices. We quote custom work after agreeing the scope.'],
    ['How long does a website take?', settings.projectTimeline],
    ['How does payment work?', settings.paymentTerms],
    ['Who owns the website, code, and domain?', settings.ownershipTerms],
    ['How many revisions are included?', settings.revisionTerms],
    ['What do hosting and maintenance cost?', settings.maintenanceTerms],
    ['Can you add Razorpay or UPI?', 'Yes, we can scope a payment gateway or UPI integration separately. The right setup depends on how you confirm payments and fulfil orders.'],
    ['Can I edit the site myself?', 'We can include a content editor for the parts of the site you need to update, such as menus, products, or event details.'],
    ['Can we work together remotely?', 'Yes. We work from India using calls, shared previews, and written feedback. We agree working hours and review times at the start.'],
    ['Can you work with our existing brand or site?', 'Yes. We can use your current identity, redesign a site, or create a visual direction for the web.']
  ];
}

export function auditFAQ(settings, compact = false) {
  const rows = faq(settings);
  const selected = compact ? [rows[0], rows[1], rows[7], rows[8]] : rows;
  return `<section class="shell wb-service-faq"><h2>Common questions</h2><div>${selected.map(([q, a]) =>
    `<details><summary>${e(q)}<span aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}</div></section>`;
}

export function auditServicesPage(page, content) {
  const { settings } = content;
  return `<section class="shell audit-page-heading"><h1 data-cms-node="audit-services-title">${e(pageField(page, 'audit-services-title', 'Websites for businesses that take orders and run events.'))}</h1>
    <p class="audit-lead" data-cms-node="audit-services-lead">${e(pageField(page, 'audit-services-lead', 'We work with restaurants and cloud kitchens, fragrance and retail brands, colleges, and event organisers. Start with a package or talk to us about a custom build.'))}</p>
    ${contactActions(settings)}</section>${auditPackages(settings)}
    <section class="shell audit-split"><h2>Ordering and automation</h2><div><p>We build menus and catalogues with a basket that sends selected items to WhatsApp. If you need to take payments online, we can scope a checkout and order dashboard.</p>
    <p>For teams handling repeat enquiries, we can scope an AI-assisted first reply that routes unclear questions to a person. We agree the approved answers, review process, and rollout with you.</p>
    <p><a href="/insights/ai-assisted-enquiries/">See an example enquiry workflow</a></p></div></section>
    <section class="shell wb-service-list audit-service-options" aria-label="Service details"><h2>What we can include</h2>
    ${services.map(service => `<a href="${servicePath(service)}"><div><h3>${e(service.title)}</h3></div><p>${e(service.description)}</p></a>`).join('')}</section>
    ${auditProcess()}${auditFAQ(settings)}${closingSection(settings)}`;
}

const serviceTerms = {
  'website-design': ['starterPrice', 'Map the pages, agree the content, and review a responsive prototype before development.'],
  ecommerce: ['businessPrice', 'Define products, variants, fulfilment, and how orders are confirmed before designing the basket.'],
  'event-platforms': ['', 'Map the programme, roles, entry rules, and event-day tasks before building the participant experience.'],
  'interface-design': ['', 'Agree the reference direction, design the key screens, and review the component states with real content.'],
  'cms-integrations': ['', 'List who updates the site, what they edit, and what needs approval before connecting any integrations.'],
  'launch-care': ['', 'Confirm access and deployment needs, check the important pages and flows, and agree handover and support.']
};

export function auditServicePage(service, page, content) {
  const { settings } = content;
  const [key, process] = serviceTerms[service.id];
  const price = key && settings[key] ? 'Packages from ' + settings[key] : 'Custom quote';
  const related = listed(content).filter(project => service.projects.includes(project.id));
  return `<section class="shell audit-page-heading"><nav class="wb-breadcrumb" aria-label="Breadcrumb"><a href="/services/">All services</a></nav>
    <h1 data-cms-node="service-title">${e(pageField(page, 'service-title', service.title))}</h1>
    <p class="audit-lead" data-cms-node="service-intro">${e(pageField(page, 'service-intro', service.intro))}</p>
    <p><strong>${e(price)}</strong></p>${contactActions(settings)}</section>
    <section class="shell audit-split"><h2>How this works</h2><div>
      <p data-cms-node="service-body">${e(pageField(page, 'service-body', service.body))}</p><p>${e(process)}</p></div></section>
    <section class="shell audit-split"><h2>What we can include</h2><ul>${service.deliverables.map((item, index) =>
      `<li data-cms-node="deliverable-${index}">${e(pageField(page, 'deliverable-' + index, item))}</li>`).join('')}</ul></section>
    <section class="shell audit-split"><h2>What you leave with</h2><p data-cms-node="service-outcome">${e(pageField(page, 'service-outcome', service.outcome))}</p></section>
    ${auditProjectCards(related, 'Related work')}${closingSection(settings)}`;
}
