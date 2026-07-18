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

## Local development

```
npm install
npm start
```

Then open http://localhost:4200/.
