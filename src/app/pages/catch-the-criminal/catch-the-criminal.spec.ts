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
