# Endcap website recreation

A self-contained static recreation of https://endcap.design/, captured November 2, 2026. It includes the homepage and 68 linked pages, with local copies of the reference fonts, styles, images, illustrations, and interaction scripts.

## Preview

Run `npm run dev` in this directory, then open http://localhost:5173. No dependency installation or compilation is required. All deployable files are in `dist/`.

## Design and interactions

The reference's Hanken Grotesk and serif typefaces, precise spacing and responsive breakpoints, hero word entrances, scroll reveals, drawing animations, project hover cursor, process rail, word highlighting, animated statistics, FAQ disclosures, mobile navigation, and footer letter interactions are retained.

The original analytics and inquiry-submission scripts are excluded. Contact forms validate normally and save a draft in browser local storage, with an explicit message that nothing was sent. External email, telephone, and project links retain their original destinations. Links outside the 69 included pages open the reference site.

## Files

- `dist/index.html`: homepage
- `dist/media/`: local fonts, images, styles and animation scripts
- `dist/recreation.js`: local-only form behavior
- `scripts/serve.mjs`: dependency-free development server
- `scripts/recreate.py`: reproducible public asset import (requires Python and beautifulsoup4)
- `recreation-manifest.json`: page list, asset count and download results

This is a visual recreation of the reference studio's site. Its original branding, project imagery, copy and contact details are retained to match the requested reference.
