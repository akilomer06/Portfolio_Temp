# Webly portfolio

Run `npm run dev` and open http://localhost:5173. Admin: http://localhost:5173/admin/.

The selected work contains The Quality Kitchen, NURA, Prompt Pop 2K26, and Talent Hunt 2K26. Project images are saved in `dist/media/projects/`; NURA uses the original Almarziyah perfume image from its website without alteration. Mobile uses paired cards with a full-width final project when the count is odd.

The header includes Services, Our work, Insights, About, and Let’s talk. The CMS manages the six published pages, four project records, theme colors, fonts, navigation, uploads, and contact inquiries.

Use the admin to edit content, colors, fonts, navigation, project descriptions and screenshots, and inquiries. Save a draft, preview it, and publish it to the local site. Runtime data and archived legacy pages are stored in `.local/` and excluded from Git.

`npm test` checks authentication, publishing, persistence, inquiries, uploads, hidden pages, and migrations. `npm run check` validates page assets and local resources.

## Vercel deployment

Import this repository into Vercel with the Other framework preset and `dist` as the output directory. `vercel.json` routes public pages and the CMS API through `api/index.mjs`, while static assets remain on the CDN.

Connect a **private Vercel Blob store** to the project. Vercel supplies `BLOB_READ_WRITE_TOKEN`; credentials and `.env` files must never be committed. The hosted CMS stores content, accounts, sessions, uploads, and enquiries privately. Public uploaded media is served through `/media/uploads/`. Concurrent content saves use ETags to prevent overwriting newer changes.

The deployed admin is `/admin/`. Its login is the existing studio administrator account. Local development continues to use `.local/`, so local and hosted edits are independent after the initial migration. The public seed contains the published design; passwords and enquiries are excluded from Git.

The homepage intro follows the Accent color and animation toggle, plays once per browser session, and supports reduced motion and Skip/Escape.

