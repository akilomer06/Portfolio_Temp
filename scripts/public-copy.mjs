import { escapeHTML as e } from './site-audit.mjs';

const articles = [
  {
    slug: 'whatsapp-ordering-for-a-cloud-kitchen',
    title: 'How a cloud kitchen can take orders on WhatsApp',
    category: 'Food & ordering',
    description: 'The Quality Kitchen shows how a menu, portion choices, and a basket can turn browsing into a useful WhatsApp enquiry.',
    related: ['The Quality Kitchen', '/work/quality-kitchen/'],
    sections: [
      ['Start with the questions customers ask', 'A catering menu needs to help someone decide what to serve and how much to get. The Quality Kitchen website lets visitors filter dishes and select portions before they talk to the kitchen. That puts the decisions about food first, while the photography gives each dish room to make an impression.'],
      ['Use the basket to collect choices', 'Visitors can gather dishes and portions in one place before reaching out. The basket carries those selections into a WhatsApp message. The customer can review the message and send it in WhatsApp, where the kitchen can confirm availability and discuss the order.'],
      ['Decide what happens after the message', 'Agree who replies, what they need to confirm, and how payment and delivery will be arranged. A useful handoff tells the customer they are starting a conversation. Test the message on a phone with several items and portion sizes before you share the menu.']
    ]
  },
  {
    slug: 'designing-nura-fragrance-store',
    title: 'Designing a fragrance store around the way people choose',
    category: 'Retail design',
    description: 'How NURA’s storefront uses scent notes, formats, and a shopping bag to make a fragrance easier to choose online.',
    related: ['NURA', '/work/nura/'],
    sections: [
      ['Give the collection a visual identity', 'NURA by Bin Sadhik already had a recognisable emerald and gold identity. The website carries those colours into the storefront, with a dark backdrop and large type so the product photography can lead. Consistent product presentation helps shoppers compare items while keeping the character of the brand.'],
      ['Describe what an image can’t show', 'Fragrance photography sets the tone. Scent notes and product information help someone decide if a perfume is for them. Keep those details easy to scan and present perfume and concentrated oil as distinct formats. Give size and quantity their own controls before the shopper adds an item to the bag.'],
      ['Keep the choices visible at the handoff', 'NURA uses a shopping bag before the move to WhatsApp. That gives a visitor one more chance to check the format, size, and quantity. When a store uses messaging to take orders, label the transition clearly and explain what the business will confirm in the conversation.']
    ]
  },
  {
    slug: 'menu-site-or-ordering-site',
    title: 'Does your restaurant need a menu site or an ordering site?',
    category: 'Buyer guide',
    description: 'Choose between a simple menu, WhatsApp ordering, and an online checkout based on how your team handles orders.',
    related: ['E-commerce and ordering services', '/services/ecommerce/'],
    sections: [
      ['Start with a menu if customers mainly need information', 'A simple mobile menu can answer the common questions about dishes, portions, opening hours, and how to contact you. It suits businesses that change the menu regularly or confirm orders by phone. Put the useful details in page text so customers can read them without zooming into a PDF.'],
      ['Add a basket when orders need several choices', 'A basket helps when one order might include multiple dishes, quantities, or portion sizes. With WhatsApp ordering, the site passes those choices into a message. Your team still handles availability, fulfilment, and payment in the conversation. Plan how you will respond during your busiest hours.'],
      ['Scope a checkout when you need to take payment online', 'An online checkout also needs decisions about stock, delivery areas, fees, payment confirmation, cancellations, and refunds. Write down who will manage each part before commissioning the build. If customers regularly ask how to pay online or your team spends time re-entering orders, a checkout or order dashboard may be the next useful step.']
    ]
  },
  {
    slug: 'ai-assisted-enquiries',
    title: 'A sample workflow for AI-assisted enquiries',
    category: 'Concept example',
    description: 'A practical example of how a small business could answer repeat questions and hand anything uncertain to its team.',
    related: ['Content management and integrations', '/services/cms-integrations/'],
    sections: [
      ['Start with questions you already know how to answer', 'Imagine a cloud kitchen that receives the same questions about serving sizes, delivery areas, and ordering cutoffs each week. Gather the answers the owner has approved and keep them in one place. Use them as the assistant’s source, so changing a delivery rule means updating one record.'],
      ['Give the team control of exceptions', 'A visitor asking about a regular delivery area can get a short answer from the approved list. A request for an out-of-area delivery or a change to a confirmed order should go to a person. Show the customer what the assistant can handle, and make it easy to reach the team.'],
      ['Check the workflow before it replies on its own', 'Start in draft mode and compare suggested replies with what your team would send. Check incorrect assumptions, outdated information, and questions that should be handed off. Track how often the team accepts or edits a reply before deciding whether to automate any of it.']
    ]
  }
];

const information = {
  '/privacy/': {
    title: 'Privacy policy',
    description: 'How Webly handles information submitted through this site.',
    sections: [
      ['Project enquiries', 'If you send an enquiry, we store the name, email, project details, and any optional contact or website information you provide. We use it to respond, understand the project, and keep a record of the conversation. Enquiries are available to the studio through its private inbox. When email receipts are enabled, our mail provider uses your email address to deliver the receipt.'],
      ['Site measurement', 'The site counts enquiries received and clicks on any WhatsApp contact link. The conversion counters store totals and do not set tracking cookies. Submission limits help protect the form from abuse.'],
      ['Links to other services', 'Booking, WhatsApp, and live project links may take you to another service. The destination’s privacy policy applies to the information you share there.'],
      ['Your enquiry information', 'Contact the studio if you would like to ask about, correct, or request deletion of information you sent through the enquiry form.']
    ]
  },
  '/terms/': {
    title: 'Terms of use',
    description: 'Terms for using the Webly portfolio and making a project enquiry.',
    sections: [
      ['Using this site', 'This site describes the studio’s services and shows examples of past work. An enquiry starts a conversation. The scope, timeline, fees, payment terms, and ownership for client work are agreed separately before work begins.'],
      ['Project examples and external sites', 'Portfolio examples illustrate the work described on each page. Live projects and third-party services may change after launch and may have their own terms.'],
      ['Enquiry form', 'Use the form for legitimate project and studio enquiries. Avoid including passwords, payment details, or other sensitive information in your message.']
    ]
  },
  '/accessibility/': {
    title: 'Accessibility',
    description: 'Accessibility features and how to report a barrier on the Webly website.',
    sections: [
      ['Using this site', 'The site includes keyboard focus indicators, a skip link, labelled form controls, and text alternatives for project imagery. It respects the reduced motion preference on your device. The enquiry form also works without JavaScript.'],
      ['Report a barrier', 'If something is difficult to use, tell us which page or feature was affected and what you were trying to do. You can email us directly if the enquiry form is the barrier.']
    ]
  }
};

const articlePath = article => '/insights/' + article.slug + '/';
export const publicCopyPaths = [...Object.keys(information), ...articles.map(articlePath)];
const articleDate = '<time datetime="2026-11-09">9 November 2026</time>';
const displayMeta = (article, name) => {
  const words = article.sections.flat().join(' ').split(/\s+/).length;
  return `<p class="audit-article-meta">${e(name)} · ${articleDate} · ${e(article.category)} · ${Math.max(1, Math.ceil(words / 180))} min read</p>`;
};

export function publicCopyPage(content, pathname) {
  const article = articles.find(item => articlePath(item) === pathname);
  const info = information[pathname];
  if (!article && !info) return null;
  const { title, description } = article || info;
  return { path: pathname, title: title + ' | ' + content.settings.siteName, heading: title, description, fields: [], visible: true };
}

export function publicCopyMain(content, page) {
  const article = articles.find(item => articlePath(item) === page.path);
  const info = information[page.path];
  const { siteName, email } = content.settings;
  if (page.path === '/insights/') {
    return `<section class="shell audit-page-heading"><h1>Insights</h1><p class="audit-lead">Practical notes on websites, ordering, and the decisions that shape a build.</p></section>
      <section class="shell audit-body"><ul class="audit-article-list">${articles.map(item => `<li><h2><a href="${articlePath(item)}">${e(item.title)}</a></h2>${displayMeta(item, siteName)}<p>${e(item.description)}</p></li>`).join('')}</ul></section>`;
  }
  if (!article && !info) return null;
  const entry = article || info;
  const story = entry.sections.map(([heading, body]) => `<section><h2>${e(heading)}</h2><p>${e(body)}</p></section>`).join('');
  const navigation = article
    ? `<p><a href="${article.related[1]}">${e(article.related[0])}</a> · <a href="/insights/">All insights</a></p>`
    : `<p><a href="mailto:${e(email)}">${e(email)}</a></p>`;
  return `<article><header class="shell audit-page-heading"><h1>${e(entry.title)}</h1><p class="audit-lead">${e(entry.description)}</p>${article ? displayMeta(article, siteName) : ''}</header>
    <div class="shell audit-body">${story}${navigation}</div></article>`;
}
