import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { EN_CONTENT } from '../../i18n/content/en.content';
import { TranslationService } from '../../services/translation.service';
import { NavBar } from '../../shared/nav-bar/nav-bar';
import { Home } from '../home/home';
import { CriminalIntelligence } from './criminal-intelligence';

describe('CIB entry points', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
  }));

  it('translates chart summaries, table controls and date labels with the page', async () => {
    const activation = TestBed.inject(TranslationService).activate('fr');
    TestBed.inject(HttpTestingController).expectOne('i18n/fr.json').flush({
      ...EN_CONTENT,
      cib: {
        ...EN_CONTENT.cib,
        chart: {
          peakSummary: 'Maximum : {label} — incidents : {count}.',
          emptySummary: 'Aucun incident pour ces filtres.',
          viewTable: 'Voir le tableau',
          fullData: 'Données complètes',
          category: 'Catégorie',
          incidents: 'Incidents',
        },
      },
    });
    await activation;
    const fixture = TestBed.createComponent(CriminalIntelligence);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.chart-summary')?.textContent).toContain('Maximum :');
    expect(element.querySelector('.data-table summary')?.textContent).toBe('Voir le tableau');
    expect(element.querySelector('.data-table caption')?.textContent).toContain('Données complètes');
    expect(element.querySelector('.data-table th')?.textContent).toBe('Catégorie');
    expect(element.querySelector('.data-table tbody th')?.textContent).toBe('juil. 24');
  });

  it('registers the same dedicated lazy page for default and localized URLs', async () => {
    for (const parent of routes.slice(0, 2)) {
      const route = parent.children?.find((child) => child.path === 'criminal-intelligence');
      expect(route?.loadComponent).toBeTypeOf('function');
      expect(route?.component).toBeUndefined();
      expect(await (route!.loadComponent!() as Promise<unknown>)).toBe(CriminalIntelligence);
    }
  });

  it('offers a translated intelligence link outside the Stories menu', async () => {
    const translation = TestBed.inject(TranslationService);
    const activation = translation.activate('fr');
    TestBed.inject(HttpTestingController).expectOne('i18n/fr.json').flush({
      ...EN_CONTENT, nav: { ...EN_CONTENT.nav, cib: 'RENSEIGNEMENT' },
    });
    await activation;
    const fixture = TestBed.createComponent(NavBar);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/fr/criminal-intelligence"]');
    expect(link?.textContent?.trim()).toBe('RENSEIGNEMENT');
    expect(link?.closest('.dropdown-menu')).toBeNull();
  });

  it('opens the archive from the home teaser in the active locale', async () => {
    const translation = TestBed.inject(TranslationService);
    const activation = translation.activate('de');
    TestBed.inject(HttpTestingController).expectOne('i18n/de.json').flush({
      ...EN_CONTENT, cib: { ...EN_CONTENT.cib, cibCta: 'ARCHIV ÖFFNEN' },
    });
    await activation;
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/de/criminal-intelligence"]');
    expect(link?.textContent).toContain('ARCHIV ÖFFNEN');
    expect(fixture.nativeElement.querySelector('app-story-carousel a[href="/de/criminal-intelligence"]')).toBeNull();
  });

  it('retains the archive route when switching between localized and English navigation', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/criminal-intelligence');
    expect(router.url).toBe('/criminal-intelligence');
    const fixture = TestBed.createComponent(NavBar);
    fixture.detectChanges();
    fixture.componentInstance.switchLocale('ja');
    await vi.waitFor(() => {
      const request = TestBed.inject(HttpTestingController).match('i18n/ja.json')[0];
      expect(request).toBeDefined();
      request.flush(EN_CONTENT);
    });
    await vi.waitFor(() => expect(router.url).toBe('/ja/criminal-intelligence'));
    expect(fixture.componentInstance['storiesActive']()).toBe(false);
    fixture.componentInstance.switchLocale('en');
    await vi.waitFor(() => expect(router.url).toBe('/criminal-intelligence'));
  });
});
