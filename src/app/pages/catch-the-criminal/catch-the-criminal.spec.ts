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

  it('keeps the game in English and shows the English-only notice below it on a localized route', () => {
    TestBed.configureTestingModule({
      imports: [CatchTheCriminal],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: TranslationService,
          useValue: {
            locale: () => 'fr',
            isSectionFallback: () => false,
            path: (...segments: string[]) => ['/', 'fr', ...segments],
            t: () => ({ ...EN_CONTENT, game: { ...EN_CONTENT.game, title: 'Jeu traduit' } }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CatchTheCriminal);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const section = page.querySelector('.game-page') as HTMLElement;
    const banner = page.querySelector('.fallback-banner') as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('CATCH THE CRIMINAL');
    expect(section.getAttribute('lang')).toBe('en');
    expect(banner.textContent).toContain('This game is available in English only.');
    expect(section.lastElementChild?.querySelector('.fallback-banner')).toBe(banner);
  });
});
