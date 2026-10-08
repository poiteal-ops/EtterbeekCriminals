import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EN_CONTENT } from '../i18n/content/en.content';
import { TranslationService } from './translation.service';

async function activateFrench(frenchJson: Record<string, unknown>): Promise<TranslationService> {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const service = TestBed.inject(TranslationService);
  const http = TestBed.inject(HttpTestingController);
  const activation = service.activate('fr');
  http.expectOne('i18n/fr.json').flush(frenchJson);
  await activation;
  return service;
}

describe('TranslationService game section', () => {
  it('serves English and reports a fallback while the locale has no game block', async () => {
    const service = await activateFrench({ nav: { game: 'JEU' } });

    expect(service.isSectionFallback('game')).toBe(true);
    expect(service.t().game.title).toBe(EN_CONTENT.game.title);
    expect(service.t().nav.game).toBe('JEU');
  });

  it('uses the locale game block once present and fills any missing key from English', async () => {
    const service = await activateFrench({
      game: { title: 'ATTRAPEZ LE CRIMINEL', share: { title: 'PARTAGEZ' }, guide: { title: 'COMMENT JOUER' }, objects: { sofa: 'le canapé' }, mapLabels: { lounge: 'SALON' } },
    });
    const game = service.t().game;

    expect(service.isSectionFallback('game')).toBe(false);
    expect(game.title).toBe('ATTRAPEZ LE CRIMINEL');
    expect(game.share.title).toBe('PARTAGEZ');
    expect(game.share.copy).toBe(EN_CONTENT.game.share.copy);
    expect(game.guide.title).toBe('COMMENT JOUER');
    expect(game.guide.goalTitle).toBe(EN_CONTENT.game.guide.goalTitle);
    expect(game.objects['sofa']).toBe('le canapé');
    expect(game.objects['bin']).toBe(EN_CONTENT.game.objects['bin']);
    expect(game.mapLabels['lounge']).toBe('SALON');
    expect(game.mapLabels['kitchen']).toBe(EN_CONTENT.game.mapLabels['kitchen']);
    expect(game.levelNames.length).toBe(5);
  });
});
