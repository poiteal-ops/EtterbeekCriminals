# Home Story Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rotating carousel to the homepage, above the Brux Gang promo panel, that cycles through the site's four "adventure" stories (pigeon, couch, train ride, escape to country) every 15 seconds, with a summary and a button through to each story.

**Architecture:** A new standalone Angular component (`StoryCarousel`) owns all carousel state (current index, visibility/fade, pause) and timer logic, reading story data from the existing `TranslationService`. It's dropped into the existing `Home` page template. One new translatable string (`home.storiesCta`) is added across the English source and all 19 locale JSON files.

**Tech Stack:** Angular 22 (standalone components, signals, native control-flow syntax `@for`/`@let`), vitest (via `@angular/build:unit-test`) for unit tests, native `setInterval`/`setTimeout` for the timer (this app has no zone.js — signal writes drive change detection directly, so plain timers work without `fakeAsync`).

## Global Constraints

- Do not modify the `adventures` array's existing fields (`title`, `teaser`, `link`, `image`) — only add the new `home.storiesCta` key.
- Auto-advance interval is exactly 15000ms (15 seconds), per spec.
- Crossfade duration is ~300ms, per spec.
- Every one of the 19 non-English locale JSON files must gain the `storiesCta` key — `tools/validate-locales.mjs` (no args = checks all locales) must report `OK` for every file after Task 2.
- New component files go in `src/app/shared/story-carousel/` (`.ts`/`.html`/`.scss`), matching the existing `src/app/shared/nav-bar/` layout convention.
- Follow existing codebase conventions: `inject()` for DI, `protected readonly` signals for template-bound state (see `src/app/pages/shop/shop.ts`, `src/app/shared/nav-bar/nav-bar.ts`).

---

### Task 1: Add `home.storiesCta` to the content model and English source

**Files:**
- Modify: `src/app/i18n/content/site-content.model.ts` (the `home` interface, after `promoVideoLink`)
- Modify: `src/app/i18n/content/en.content.ts` (the `home` object, after `promoVideoLink`)

**Interfaces:**
- Produces: `SiteContent['home']['storiesCta']: string` — consumed by the `StoryCarousel` component in Task 3/4 as `translation.t().home.storiesCta`.

- [ ] **Step 1: Add the field to the model**

In `src/app/i18n/content/site-content.model.ts`, find the `home` block (currently ends with `promoVideoLink: string;`) and add the new field:

```ts
  home: {
    wanted: string;
    fileNo: string;
    tagline: string;
    kicker: string;
    intro: string;
    promoKicker: string;
    promoTitle: string;
    promoTag: string;
    promoCta: string;
    promoVideoLink: string;
    storiesCta: string;
  };
```

- [ ] **Step 2: Add the English value**

In `src/app/i18n/content/en.content.ts`, find the `home:` object (ends with `promoVideoLink: 'Watch the preview',`) and add:

```ts
  home: {
    wanted: 'WANTED',
    fileNo: 'FILE NO. 001-CR',
    tagline: 'Sawito & Le Criminel — wanted, questioned, and mostly forgiven',
    kicker: '— local operation, two suspects —',
    intro:
      'One man, one dog, one shared disregard for the rules of polite society. Browse the file below — the record speaks for itself.',
    promoKicker: 'NOW IN THE EVIDENCE LOCKER',
    promoTitle: 'BRUX GANG — "THUG LIFE, NO RULES"',
    promoTag: 'The mixtape nobody asked for. Cover art by a certain Spooky-something.',
    promoCta: 'VIEW IN SHOP',
    promoVideoLink: 'Watch the preview',
    storiesCta: 'READ THE CASE FILE',
  },
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd e:/workspace/EtterbeekCriminals && npx tsc --noEmit -p tsconfig.app.json`
Expected: No new type errors (English content object now satisfies the updated `SiteContent` interface). This will actually currently show missing-property errors for the 19 locale JSON files if TypeScript checks them — it doesn't (they're loaded as untyped JSON via `HttpClient.get<SiteContent>`, no compile-time check), so this step is really confirming `en.content.ts` itself still type-checks.

- [ ] **Step 4: Commit**

```bash
git add src/app/i18n/content/site-content.model.ts src/app/i18n/content/en.content.ts
git commit -m "Add home.storiesCta to content model and English source"
```

---

### Task 2: Add `storiesCta` translations to all 19 non-English locale files

**Files:**
- Modify: `public/i18n/fr.json`, `public/i18n/de.json`, `public/i18n/nl.json`, `public/i18n/es.json`, `public/i18n/it.json`, `public/i18n/ja.json`, `public/i18n/pt.json`, `public/i18n/ro.json`, `public/i18n/bg.json`, `public/i18n/pl.json`, `public/i18n/el.json`, `public/i18n/sv.json`, `public/i18n/nb.json`, `public/i18n/hr.json`, `public/i18n/cs.json`, `public/i18n/da.json`, `public/i18n/et.json`, `public/i18n/fi.json`, `public/i18n/hu.json`

**Interfaces:**
- Consumes: nothing new (pure content addition).
- Produces: same as Task 1 (`storiesCta`), now present in every `CONTENT_LOCALES` file.

Each locale's `home` block currently ends with a `"promoVideoLink"` line. In each file, add `"storiesCta"` immediately after it (remember to add a trailing comma after `promoVideoLink`'s value). These translations follow the existing idiomatic convention (see `src/app/i18n/TRANSLATION_GUIDE.md` and each locale's existing `wantMoreCta`/`fileNo` vocabulary for "case file"):

- [ ] **Step 1: fr.json** — add after `"promoVideoLink": "Voir l'aperçu",`:
  ```json
  "storiesCta": "LIRE LE DOSSIER",
  ```

- [ ] **Step 2: de.json** — add after `"promoVideoLink": "Vorschau ansehen",`:
  ```json
  "storiesCta": "AKTE LESEN",
  ```

- [ ] **Step 3: nl.json** — add after `"promoVideoLink": "Bekijk de preview",`:
  ```json
  "storiesCta": "LEES HET DOSSIER",
  ```

- [ ] **Step 4: es.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LEER EL EXPEDIENTE",
  ```

- [ ] **Step 5: it.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LEGGI IL FASCICOLO",
  ```

- [ ] **Step 6: ja.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "ファイルを読む",
  ```

- [ ] **Step 7: pt.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LER O PROCESSO",
  ```

- [ ] **Step 8: ro.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "CITEȘTE DOSARUL",
  ```

- [ ] **Step 9: bg.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "ПРОЧЕТИ ДОСИЕТО",
  ```

- [ ] **Step 10: pl.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "CZYTAJ AKTA SPRAWY",
  ```

- [ ] **Step 11: el.json** — add after `"promoVideoLink": "Δείτε το τρέιλερ",`:
  ```json
  "storiesCta": "ΔΙΑΒΑΣΤΕ ΤΟΝ ΦΑΚΕΛΟ",
  ```

- [ ] **Step 12: sv.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LÄS AKTEN",
  ```

- [ ] **Step 13: nb.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LES SAKSMAPPEN",
  ```

- [ ] **Step 14: hr.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "PROČITAJ SPIS",
  ```

- [ ] **Step 15: cs.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "ČÍST SPIS",
  ```

- [ ] **Step 16: da.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LÆS SAGSMAPPEN",
  ```

- [ ] **Step 17: et.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LOE TOIMIKUT",
  ```

- [ ] **Step 18: fi.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "LUE ASIAKIRJA",
  ```

- [ ] **Step 19: hu.json** — add after its `promoVideoLink` line:
  ```json
  "storiesCta": "ÜGYIRAT OLVASÁSA",
  ```

- [ ] **Step 20: Validate all locales**

Run: `cd e:/workspace/EtterbeekCriminals && node tools/validate-locales.mjs`
Expected: every file printed as `<code>.json: OK` (20 lines — the validator skips `fr.json` itself as reference and checks the rest; confirm no `MISSING home.storiesCta` errors for any file).

- [ ] **Step 21: Commit**

```bash
git add public/i18n/*.json
git commit -m "Add storiesCta translation to all 19 locales"
```

---

### Task 3: Build the `StoryCarousel` component logic (state + timer), test-first

**Files:**
- Create: `src/app/shared/story-carousel/story-carousel.ts`
- Create: `src/app/shared/story-carousel/story-carousel.spec.ts`
- Create (stub for now, filled in Task 4): `src/app/shared/story-carousel/story-carousel.html` — must exist for the component to compile
- Create (stub for now, filled in Task 4): `src/app/shared/story-carousel/story-carousel.scss` — must exist for the component to compile

**Interfaces:**
- Consumes: `TranslationService.t()` (returns `SiteContent`, from `src/app/services/translation.service.ts`), `TranslationService.path(...)`.
- Produces (used by Task 4's template and Task 5's integration):
  - `protected readonly currentIndex: Signal<number>` — index into `translation.t().adventures`.
  - `protected readonly visible: Signal<boolean>` — drives the fade CSS class.
  - `protected selectStory(index: number): void` — jump to a story and restart the timer.
  - `protected pause(): void` / `protected resume(): void` — pause/resume auto-advance.
  - Selector: `app-story-carousel`.

- [ ] **Step 1: Create template and style stubs**

`src/app/shared/story-carousel/story-carousel.html`:
```html
<div class="carousel-wrap"></div>
```

`src/app/shared/story-carousel/story-carousel.scss`:
```scss
.carousel-wrap {
}
```

- [ ] **Step 2: Write the failing test**

`src/app/shared/story-carousel/story-carousel.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { StoryCarousel } from './story-carousel';

describe('StoryCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [StoryCarousel],
      providers: [provideHttpClient(), provideRouter([])],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on the first story', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('advances to the next story after 15 seconds', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(1);
  });

  it('wraps back to the first story after the last one', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    const total = fixture.componentInstance['translation'].t().adventures.length;

    for (let i = 0; i < total; i++) {
      vi.advanceTimersByTime(15000);
      vi.advanceTimersByTime(300);
    }

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('does not advance while paused', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    fixture.componentInstance['pause']();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('resumes advancing after resume() is called', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    fixture.componentInstance['pause']();
    fixture.componentInstance['resume']();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(1);
  });

  it('selectStory jumps directly to the given index', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    fixture.componentInstance['selectStory'](2);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(2);
  });

  it('selectStory restarts the 15s timer instead of stacking with the old one', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    vi.advanceTimersByTime(10000);
    fixture.componentInstance['selectStory'](2);
    vi.advanceTimersByTime(300);

    // Only 10s left on a stacked old timer would fire here if selectStory hadn't reset it.
    vi.advanceTimersByTime(10000);
    expect(fixture.componentInstance['currentIndex']()).toBe(2);

    vi.advanceTimersByTime(5000);
    vi.advanceTimersByTime(300);
    expect(fixture.componentInstance['currentIndex']()).toBe(3);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd e:/workspace/EtterbeekCriminals && npx ng test --watch=false`
Expected: FAIL — `story-carousel.ts` does not exist yet (module not found / compile error).

- [ ] **Step 4: Implement the component**

`src/app/shared/story-carousel/story-carousel.ts`:
```ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';

const ADVANCE_INTERVAL_MS = 15000;
const FADE_DURATION_MS = 300;

@Component({
  selector: 'app-story-carousel',
  imports: [RouterLink],
  templateUrl: './story-carousel.html',
  styleUrl: './story-carousel.scss',
})
export class StoryCarousel {
  protected readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentIndex = signal(0);
  protected readonly visible = signal(true);
  private readonly paused = signal(false);

  private timer: ReturnType<typeof setInterval> | undefined;
  private fadeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.startTimer();
    this.destroyRef.onDestroy(() => this.stopTimer());
  }

  protected selectStory(index: number): void {
    this.goTo(index);
    this.startTimer();
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.paused()) this.advance();
    }, ADVANCE_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    if (this.fadeTimeout !== undefined) clearTimeout(this.fadeTimeout);
  }

  private advance(): void {
    const count = this.translation.t().adventures.length;
    this.goTo((this.currentIndex() + 1) % count);
  }

  private goTo(index: number): void {
    this.visible.set(false);
    if (this.fadeTimeout !== undefined) clearTimeout(this.fadeTimeout);
    this.fadeTimeout = setTimeout(() => {
      this.currentIndex.set(index);
      this.visible.set(true);
    }, FADE_DURATION_MS);
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd e:/workspace/EtterbeekCriminals && npx ng test --watch=false`
Expected: PASS — all 7 tests in `StoryCarousel` green.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/story-carousel/story-carousel.ts src/app/shared/story-carousel/story-carousel.spec.ts src/app/shared/story-carousel/story-carousel.html src/app/shared/story-carousel/story-carousel.scss
git commit -m "Add StoryCarousel component with auto-advance, pause, and dot navigation"
```

---

### Task 4: Build the carousel template and styles

**Files:**
- Modify: `src/app/shared/story-carousel/story-carousel.html`
- Modify: `src/app/shared/story-carousel/story-carousel.scss`

**Interfaces:**
- Consumes: everything from Task 3 (`currentIndex`, `visible`, `selectStory`, `pause`, `resume`, `translation`).
- Produces: rendered markup consumed by Task 5's integration and by end-to-end manual verification (Task 6).

- [ ] **Step 1: Write the template**

`src/app/shared/story-carousel/story-carousel.html`:
```html
@let stories = translation.t().adventures;
@let story = stories[currentIndex()];

<div class="carousel-wrap">
  <div class="carousel-kicker">{{ translation.t().story.adventuresKicker }}</div>

  <div
    class="carousel-card"
    [class.visible]="visible()"
    (mouseenter)="pause()"
    (mouseleave)="resume()"
    (focusin)="pause()"
    (focusout)="resume()"
  >
    <a class="carousel-main" [routerLink]="translation.path(story.link)">
      <div class="carousel-photo">
        <img [src]="story.image" [alt]="story.title" />
      </div>
      <div class="carousel-details">
        <div class="carousel-title">{{ story.title }}</div>
        <div class="carousel-teaser">{{ story.teaser }}</div>
      </div>
    </a>
    <a class="carousel-cta" [routerLink]="translation.path(story.link)">
      {{ translation.t().home.storiesCta }}
    </a>
  </div>

  <div class="carousel-dots">
    @for (s of stories; track s.link; let i = $index) {
      <button
        type="button"
        class="carousel-dot"
        [class.active]="i === currentIndex()"
        [attr.aria-current]="i === currentIndex() ? 'true' : null"
        [attr.aria-label]="s.title"
        (click)="selectStory(i)"
      ></button>
    }
  </div>
</div>
```

- [ ] **Step 2: Write the styles**

`src/app/shared/story-carousel/story-carousel.scss` (mirrors `.promo` in `src/app/pages/home/home.scss`):
```scss
.carousel-wrap {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 32px 32px;
}

.carousel-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  color: #8a8a8a;
  text-transform: uppercase;
  margin-bottom: 10px;
  text-align: center;
}

.carousel-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #2c2c2c;
  background: #161616;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease, border-color 0.15s ease;

  &.visible {
    opacity: 1;
  }

  &:has(.carousel-main:hover) {
    border-color: #6e6e6e;
  }
}

.carousel-main {
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  color: inherit;
}

.carousel-photo {
  flex: 0 0 auto;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border: 1px solid #2c2c2c;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.15);
  }
}

.carousel-details {
  min-width: 0;
}

.carousel-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  letter-spacing: 1px;
  color: #eeeeec;
  margin-bottom: 4px;
}

.carousel-teaser {
  font-size: 12px;
  line-height: 1.5;
  color: #8a8a8a;
}

.carousel-cta {
  display: inline-block;
  align-self: flex-start;
  border: 1px solid #cfcfcc;
  font-size: 10px;
  letter-spacing: 1.5px;
  padding: 6px 12px;
  text-decoration: none;
  color: #eeeeec;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: #eeeeec;
    color: #0c0c0c;
  }
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #6e6e6e;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &.active {
    background: #eeeeec;
    border-color: #eeeeec;
  }
}

@media (max-width: 480px) {
  .carousel-card {
    align-items: center;
    text-align: center;
  }

  .carousel-main {
    flex-direction: column;
  }

  .carousel-cta {
    align-self: center;
  }
}
```

- [ ] **Step 3: Run existing tests to confirm nothing broke**

Run: `cd e:/workspace/EtterbeekCriminals && npx ng test --watch=false`
Expected: PASS — same 7 `StoryCarousel` tests still green (template/style changes don't affect them, but confirms the component still compiles with the real template).

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/story-carousel/story-carousel.html src/app/shared/story-carousel/story-carousel.scss
git commit -m "Add StoryCarousel template and styles matching the promo panel design"
```

---

### Task 5: Integrate the carousel into the homepage

**Files:**
- Modify: `src/app/pages/home/home.ts`
- Modify: `src/app/pages/home/home.html`

**Interfaces:**
- Consumes: `StoryCarousel` (selector `app-story-carousel`) from Task 3/4.

- [ ] **Step 1: Import the component**

In `src/app/pages/home/home.ts`, add the import and register it:

```ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';
import { StoryCarousel } from '../../shared/story-carousel/story-carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, StoryCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly translation = inject(TranslationService);
}
```

- [ ] **Step 2: Place it in the template**

In `src/app/pages/home/home.html`, insert `<app-story-carousel></app-story-carousel>` between `.intro-block` and `.promo-wrap`:

```html
<div class="intro-block">
  <div class="kicker">{{ t.home.kicker }}</div>
  <div class="intro">{{ t.home.intro }}</div>
</div>

<app-story-carousel></app-story-carousel>

<div class="promo-wrap">
  <div class="promo">
    <a class="promo-main" [routerLink]="translation.path('shop')">
      <div class="promo-photo">
        <img src="assets/images/shop-brux-gang.jpg" alt="Brux Gang mixtape cover" />
      </div>
      <div class="promo-details">
        <div class="promo-kicker">{{ t.home.promoKicker }}</div>
        <div class="promo-title">{{ t.home.promoTitle }}</div>
        <div class="promo-tag">{{ t.home.promoTag }}</div>
        <div class="promo-cta">{{ t.home.promoCta }}</div>
      </div>
    </a>
    <a class="promo-video" href="https://www.youtube.com/watch?v=7l6RhWyPk4s" target="_blank" rel="noopener noreferrer">
      <span class="promo-video-icon" aria-hidden="true">&#9658;</span>
      {{ t.home.promoVideoLink }}
    </a>
  </div>
</div>
```

- [ ] **Step 3: Run the full test suite**

Run: `cd e:/workspace/EtterbeekCriminals && npx ng test --watch=false`
Expected: PASS — all tests (`App`, `StoryCarousel`) green.

- [ ] **Step 4: Run the build**

Run: `cd e:/workspace/EtterbeekCriminals && npx ng build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/home/home.ts src/app/pages/home/home.html
git commit -m "Integrate StoryCarousel into the homepage"
```

---

### Task 6: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Validate locale structure one more time**

Run: `cd e:/workspace/EtterbeekCriminals && node tools/validate-locales.mjs`
Expected: every locale `OK`.

- [ ] **Step 2: Start the dev server**

Run: `cd e:/workspace/EtterbeekCriminals && npm start` (background) — wait for it to report the local URL (typically `http://localhost:4200`).

- [ ] **Step 3: Manually verify in a browser at `http://localhost:4200/`**

Check each of the following (per the design spec's testing section):
- Carousel card appears above the Brux Gang promo panel, styled consistently with it.
- Leave the tab open and watch it auto-advance through all 4 stories, ~15s apart, with a smooth crossfade (not an abrupt cut).
- Hover over the card — it should stop advancing. Move the mouse away — it resumes.
- Tab to the card with the keyboard — it should stop advancing while focused; tab away and it resumes.
- Click each dot — the card should jump to that story immediately and the 15s countdown should restart (wait and confirm it doesn't jump again until a fresh 15s has passed).
- Click the card image/text area, and separately the CTA button — both should navigate to the correct story route (e.g. `/pigeon`, `/couch`, `/train-ride`, `/escape-to-the-country`).

- [ ] **Step 4: Spot-check a non-Latin locale**

Visit `http://localhost:4200/el/` and `http://localhost:4200/ja/` — confirm the carousel renders with translated title/teaser/CTA text, no layout overflow or clipped text in the CTA button.

- [ ] **Step 5: Final commit (if any fixes were needed during manual verification)**

```bash
git add -A
git commit -m "Fix issues found during manual verification of StoryCarousel"
```

(Skip this step if no fixes were needed.)
