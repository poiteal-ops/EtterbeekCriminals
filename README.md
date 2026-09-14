# EtterbeekCriminals

Just a fun mockup website I put together as a test — not a real project.
Built with Angular.

## Viewing the site

This repo is published with GitHub Pages, live at:

https://thieffrycriminals.be/

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys
the site automatically on every push to `main`.

### Deployment note

The site is served from the custom domain root, not a `github.io/<repo>`
subpath, so the production build must always use `--base-href /`. Do not
reintroduce `--base-href /EtterbeekCriminals/` — that was only correct back
when the site lived at `poiteal-ops.github.io/EtterbeekCriminals/`.

## Criminal Intelligence Bureau

`/criminal-intelligence` is a filterable dashboard over a fixed, fictional
48-incident archive attributed to the site's usual suspects — same
fictional-mockup content as the rest of the site, not a real crime log. The
incident dataset lives in `src/app/pages/cib-bureau/cib.data.ts`.

To add an incident:

1. Add the incident record (id, date, hour, suspects, offence, status, etc.)
   to `CIB_INCIDENTS` in `src/app/pages/cib-bureau/cib.data.ts`.
2. Add its English copy (title/summary/imageAlt) to `en.content.ts`'s
   `cib.incidents`, then the same key to every `public/i18n/<locale>.json`'s
   `cib.incidents` section, translated.
3. Run `node --test tools/cib-locales.test.mjs` — it fails on any locale
   missing or incomplete for the new incident, so treat it as the checklist
   for step 2.

## Search visibility

The production build generates route-specific HTML, `sitemap.xml`, and
`robots.txt`. Domain verification, sitemap submission, and indexing checks are
owner-managed steps (see the local, untracked Search Console setup notes).

Search Console does not require analytics or tracking code on this site.

## Local development

```
npm install
npm start
```

Then open http://localhost:4200/.
