import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EN_CONTENT } from '../../i18n/content/en.content';
import { TranslationService } from '../../services/translation.service';
import { CatchTheCriminal } from './catch-the-criminal';

describe('CatchTheCriminal', () => {
  it('explains the chase and waits for Start before loading the playfield', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('LE CRIMINEL');
    expect(page.textContent).toContain('WASD');
    expect(page.querySelector('button.start-button')).not.toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
    expect(page.querySelector('a.game-guide-link')?.getAttribute('href')).toBe('/game/how-to-play');
  });

  it('exposes the labelled game, item and touch-control containers as groups', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    (Reflect.get(fixture.componentInstance, 'phase') as { set(value: string): void }).set('playing');
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    for (const selector of ['.game-panel', '.game-abilities', '.d-pad']) {
      const group = page.querySelector(selector);
      expect(group?.getAttribute('role')).toBe('group');
      expect(group?.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('restores playfield keyboard focus after sound controls and a playfield click', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    const phase = Reflect.get(fixture.componentInstance, 'phase') as { set(value: string): void };
    phase.set('playing');
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const stage = page.querySelector('.game-stage') as HTMLElement;
    const soundButton = Array.from(page.querySelectorAll('button')).find(button => button.textContent?.includes('SOUND ON')) as HTMLButtonElement;

    soundButton.focus();
    soundButton.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(stage);

    soundButton.focus();
    (page.querySelector('.game-canvas') as HTMLElement).click();
    expect(document.activeElement).toBe(stage);
  });

  it('releases touch movement when pointer capture is lost', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    const component = fixture.componentInstance;
    (Reflect.get(component, 'phase') as { set(value: string): void }).set('playing');
    fixture.detectChanges();
    const right = fixture.nativeElement.querySelector('.d-pad .right') as HTMLButtonElement;
    Object.defineProperty(right, 'setPointerCapture', { value: () => undefined });
    right.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
    expect((Reflect.get(component, 'direction') as () => { x: number; y: number }).call(component).x).toBe(1);

    right.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }));
    expect((Reflect.get(component, 'direction') as () => { x: number; y: number }).call(component).x).toBe(0);
  });

  it('offers STOP and TREAT once and returns focus to the playfield after use', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    const component = fixture.componentInstance;
    (Reflect.get(component, 'phase') as { set(value: string): void }).set('playing');
    let stops = 0;
    let treats = 0;
    Reflect.set(component, 'game', {
      useStop: () => { stops++; return true; },
      useTreat: () => { treats++; return true; },
      destroy: () => undefined,
    });
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const stage = page.querySelector('.game-stage') as HTMLElement;
    const stop = page.querySelector('.ability-stop') as HTMLButtonElement;
    const treat = page.querySelector('.ability-treat') as HTMLButtonElement;
    expect(stop).not.toBeNull();
    expect(treat).not.toBeNull();
    stop.click();
    treat.click();
    expect(stops).toBe(1);
    expect(treats).toBe(1);
    expect(document.activeElement).toBe(stage);
  });

  it('announces Pikette when she enters from the board edge', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [provideHttpClient(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    fixture.detectChanges();
    const showEvent = Reflect.get(fixture.componentInstance, 'showEvent') as (event: { kind: string }) => void;
    showEvent.call(fixture.componentInstance, { kind: 'piketteEnter' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pikette is charging in');
  });

  describe('levels and sharing', () => {
    const finish = (component: CatchTheCriminal, damaged: number, score = 200) => {
      const snapshot = { secondsLeft: 0, score, prevented: 2, damaged, damagedIds: [], paused: false, ended: true,
        stopAvailable: true, treatAvailable: true, stopSecondsLeft: 0, treatLuring: false, treatStunSecondsLeft: 0,
        fartSecondsLeft: 0, piketteSecondsLeft: 0, piketteObjectId: null };
      (Reflect.get(component, 'endLevel') as (data: typeof snapshot) => void).call(component, snapshot);
    };
    const setup = () => {
      TestBed.configureTestingModule({
        imports: [CatchTheCriminal],
        providers: [provideHttpClient(), provideRouter([])],
      });
      const fixture = TestBed.createComponent(CatchTheCriminal);
      fixture.detectChanges();
      return fixture;
    };
    const phaseOf = (component: CatchTheCriminal) => (Reflect.get(component, 'phase') as () => string).call(component);

    it('shows a level-cleared card with a Next Level button, and no share panel yet', () => {
      const fixture = setup();
      finish(fixture.componentInstance, 1);
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;

      expect(phaseOf(fixture.componentInstance)).toBe('levelComplete');
      expect(page.textContent).toContain('LEVEL 1 CLEARED');
      expect(page.textContent).toContain('THE OPEN-PLAN LOFT');
      expect(page.textContent).toContain('faster and you are slower');
      expect(page.querySelector('.start-button')?.textContent).toContain('NEXT LEVEL');
      expect(page.querySelector('.share-panel')).toBeNull();
    });

    it('ends the run on three damaged objects and offers sharing with safe links', () => {
      const fixture = setup();
      finish(fixture.componentInstance, 3, 40);
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;

      expect(phaseOf(fixture.componentInstance)).toBe('over');
      const panel = page.querySelector('.share-panel') as HTMLElement;
      expect(panel).not.toBeNull();
      expect(panel.textContent).toContain('reached Level 1 of 5');
      const links = Array.from(panel.querySelectorAll('a.share-link')) as HTMLAnchorElement[];
      expect(links.map(link => new URL(link.href).host)).toEqual(['x.com', 'www.facebook.com', 'wa.me', 'bsky.app']);
      for (const link of links) {
        expect(link.target).toBe('_blank');
        expect(link.rel).toContain('noopener');
        expect(link.rel).toContain('noreferrer');
      }
      expect(panel.textContent).toContain('own privacy terms');
    });

    it('celebrates clearing level 5 and shares a completed run', () => {
      const fixture = setup();
      const component = fixture.componentInstance;
      (Reflect.get(component, 'run') as { set(value: unknown): void }).set({ level: 5, score: 1500, prevented: 14, cleared: 4 });
      finish(component, 0, 300);
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;

      expect(phaseOf(component)).toBe('over');
      expect(page.textContent).toContain('ALL FIVE LEVELS CLEARED');
      expect(page.querySelector('.share-text')?.textContent).toContain('cleared all 5 levels');
    });

    it('copies the share text and confirms it', async () => {
      const fixture = setup();
      finish(fixture.componentInstance, 3);
      fixture.detectChanges();
      let copied = '';
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied = text; } } });
      const copy = Array.from(fixture.nativeElement.querySelectorAll('.share-actions button')).find(
        (button) => (button as HTMLElement).textContent?.includes('COPY')) as HTMLButtonElement;
      copy.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(copied).toContain('https://thieffrycriminals.be/game/');
      expect(fixture.nativeElement.querySelector('.share-status')?.textContent).toContain('Copied');
    });
  });

  const localized = (isFallback: boolean) => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: TranslationService,
          useValue: {
            locale: () => 'fr',
            isSectionFallback: () => isFallback,
            path: (...segments: string[]) => ['/', 'fr', ...segments],
            t: () => ({ ...EN_CONTENT, game: { ...EN_CONTENT.game, ...(isFallback ? {} : { title: 'Jeu traduit' }) } }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    fixture.detectChanges();
    return fixture;
  };

  it('shows English content and the English-only notice below the game while a locale has no game translation', () => {
    const fixture = localized(true);
    const page = fixture.nativeElement as HTMLElement;
    const section = page.querySelector('.game-page') as HTMLElement;
    const banner = page.querySelector('.fallback-banner') as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('CATCH THE CRIMINAL');
    expect(section.getAttribute('lang')).toBe('en');
    expect(banner.textContent).toContain('This game is available in English only.');
    expect(section.lastElementChild?.querySelector('.fallback-banner')).toBe(banner);
  });

  it('shows the translated game in the locale language, without the notice, once the locale has a game block', () => {
    const fixture = localized(false);
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Jeu traduit');
    expect(page.querySelector('.game-page')?.getAttribute('lang')).toBe('fr');
    expect(page.querySelector('.fallback-banner')).toBeNull();
  });
});
