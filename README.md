# Webly portfolio

Run `npm run dev` and open http://localhost:5173. Admin: http://localhost:5173/admin/.

The selected work contains The Quality Kitchen, NURA, Prompt Pop 2K26, and Talent Hunt 2K26. Project images are saved in `dist/media/projects/`; NURA uses the homepage screenshot and logo image supplied by the owner, without alteration. Mobile uses paired cards with a full-width final project when the count is odd.

The header includes Services, Our work, Insights, About, and Let’s talk. The CMS manages the six published pages, four project records, theme colors, fonts, navigation, uploads, and contact inquiries.

Use the admin to edit content, colors, fonts, navigation, project descriptions and screenshots, and inquiries. Save a draft, preview it, and publish it to the local site. Runtime data and archived legacy pages are stored in `.local/` and excluded from Git.

## Contact and pricing

The enquiry form works with or without JavaScript and saves each message to the private admin inbox. Contact Details in the admin manages booking, WhatsApp, and social links, as well as indicative package prices and terms. Links appear on the site once configured. The dashboard counts submitted enquiries and WhatsApp clicks without tracking cookies.

To enable email receipts and studio notifications, set `RESEND_API_KEY`, `WEBLY_MAIL_FROM` (a sender on a verified domain), and `WEBLY_INBOX_TO` (the studio’s inbox) on the server. Enquiries are still saved if mail is disabled or delivery fails. Review the privacy and terms copy, prices, and delivery estimates before publishing.

The visual system is documented in `DESIGN.md`.

The public pages stay out of search while you review them. Set `WEBLY_PUBLIC_INDEXING=1` on the server once the site is ready to be indexed.

`npm test` checks authentication, publishing, persistence, inquiries, uploads, hidden pages, and migrations. `npm run check` validates page assets and local resources.

## Vercel deployment

Import this repository into Vercel with the Other framework preset and `dist` as the output directory. `vercel.json` routes public pages and the CMS API through `api/index.mjs`, while static assets remain on the CDN.

Connect a **private Vercel Blob store** to the project. Vercel supplies `BLOB_READ_WRITE_TOKEN`; credentials and `.env` files must never be committed. The hosted CMS stores content, accounts, sessions, uploads, and enquiries privately. Public uploaded media is served through `/media/uploads/`. Concurrent content saves use ETags to prevent overwriting newer changes.

The deployed admin is `/admin/`. Its login is the existing studio administrator account. Local development continues to use `.local/`, so local and hosted edits are independent after the initial migration. The public seed contains the published design; passwords and enquiries are excluded from Git.

The homepage intro follows the Accent color and animation toggle, plays once per browser session, and supports reduced motion and Skip/Escape.

## Services and project stories

`/work/` has an accent-coloured project index and cards that lead to `/work/<project-id>/`. Each project story has an overview, brief, approach, scope, features, visual direction, original imagery, a live website link, and next-project navigation. Edit its story in **Admin → Projects → Edit project**.

`/services/` introduces six services, the process, and FAQs. Each service has a page with deliverables and related work. Service page content is editable under **Pages & content**. Service definitions and fallback project stories live in `scripts/portfolio-pages.mjs`; `scripts/build-studio-pages.mjs` generates static fallbacks. Runtime rendering reads the current published CMS data, including images and colours.

