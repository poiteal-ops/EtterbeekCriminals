# Home story carousel

## Purpose

The homepage currently jumps from the intro text straight to the Brux Gang promo panel, with no teaser for the site's actual "case files" (the pigeon, couch, train ride, and escape-to-country stories). Add a rotating carousel above the promo panel that surfaces one story at a time, with a summary and a button through to the full story.

## Data

No new content model needed for the stories themselves. Reuse the existing `adventures` array (`AdventureEntry[]`: `title`, `teaser`, `link`, `image`), already populated for all 4 stories in every locale and already rendered as a static grid on `/story`. Reuse the existing `t.story.adventuresKicker` string ("SELECTED CASE FILES") as the carousel's section label.

One new translatable string is required: a CTA button label (e.g. "READ THE CASE FILE"). This is the only i18n addition.

## Component

New shared component: `src/app/shared/story-carousel/` (`story-carousel.ts` / `.html` / `.scss`), following the existing `src/app/shared/nav-bar/` file layout convention. Imported into `Home` (`src/app/pages/home/home.ts`) and placed in `home.html` between `.intro-block` and `.promo-wrap`.

Inputs: none — reads `adventures` directly from `TranslationService` (same pattern `Home` and `Story` already use via `translation.t()`).

### State

- `currentIndex` signal, 0-based into the adventures array.
- `visible` signal (boolean) driving the crossfade CSS class.
- Interval timer (15000ms) advancing `currentIndex` (wrapping), cleared in `ngOnDestroy`.
- Manual dot click sets `currentIndex` directly and restarts the timer (clearInterval + setInterval), so users get a fresh 15s after interacting.

### Transition

Crossfade, not slide. On advance (auto or manual):
1. Set `visible = false` — CSS `opacity` transition (~300ms) fades the card out.
2. After the transition duration (setTimeout), update `currentIndex`.
3. Set `visible = true` — fades the new card in.

### Pause behavior

Timer pauses on:
- `mouseenter` / `mouseleave` (hover)
- `focusin` / `focusout` on the card (keyboard focus) — required so keyboard users aren't disadvantaged by content that moves out from under them; the existing promo panel doesn't need this since it isn't auto-rotating.

### Markup / styling

Visually matches `.promo` card from `home.scss`: bordered dark card, small thumbnail image, kicker + title + teaser text block, CTA button styled like `.promo-cta`. The whole card is also a link to the story (same dual-link pattern as `.promo-main` — image/text area is clickable, plus an explicit CTA button), per `[routerLink]="translation.path(adventure.link)"`.

Below the card: a row of dot buttons, one per adventure, `aria-current="true"` on the active one, `aria-label` naming the story (e.g. "Show: ONE PIGEON, ONE BALCONY").

## i18n rollout

Add `home.storiesCta: string` to:
- `src/app/i18n/content/site-content.model.ts` (`SiteContent['home']`)
- `src/app/i18n/content/en.content.ts`
- All 19 `public/i18n/*.json` files, translated idiomatically per the existing convention (see `src/app/i18n/TRANSLATION_GUIDE.md` and the "Translation conventions" notes from prior locale work) — not machine-literal, matches the site's deadpan case-file tone.

Verify with `node tools/validate-locales.mjs` (all locales, no args) after adding the key everywhere — structural check will catch any locale left behind.

## Testing / verification

1. `ng build` succeeds.
2. `node tools/validate-locales.mjs` — all locales OK (confirms the new key was added everywhere, no structural drift).
3. Dev server (`npm start`, port 4200): manually verify on `/` —
   - Carousel auto-advances every 15s through all 4 stories.
   - Hover and keyboard focus pause it; leaving resumes it.
   - Dots jump to the correct story and reset the timer.
   - Clicking the card or the CTA button navigates to the correct story route.
   - Crossfade renders smoothly, no layout jump between differently-sized teaser text.
4. Spot-check at least one non-Latin locale (e.g. `/el/` or `/ja/`) to confirm the new CTA string renders correctly and doesn't overflow the card at that font/script.
