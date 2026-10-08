import { describe, expect, it } from 'vitest';

import { SHARE_URL, buildShareLinks, buildShareText, buildShareUrl } from './share';

describe('score sharing', () => {
  it('words a loss with the level reached and a win with all levels cleared', () => {
    expect(buildShareText(1240, 4, false)).toBe('I scored 1,240 and reached Level 4 of 5 in Catch the Criminal. Can you beat me?');
    expect(buildShareText(2600, 5, true)).toBe('I scored 2,600 and cleared all 5 levels of Catch the Criminal. Can you beat me?');
  });

  it('clamps out-of-range or non-numeric values to safe integers', () => {
    expect(buildShareText(Number.NaN, 99, false)).toContain('scored 0 and reached Level 5');
    expect(buildShareText(-50, -3, false)).toContain('scored 0 and reached Level 1');
    expect(buildShareText(1e12, 2, false)).toContain('scored 999,999');
    expect(buildShareText(12.9, 2.9, false)).toContain('scored 12 and reached Level 2');
  });

  it('builds links on fixed https hosts that round-trip the text', () => {
    const text = buildShareText(1240, 4, false);
    const links = buildShareLinks(text);
    const urls = Object.values(links).map((href) => new URL(href));
    expect(urls.map((url) => url.protocol)).toEqual(['https:', 'https:', 'https:', 'https:']);
    expect(urls.map((url) => url.host)).toEqual(['x.com', 'www.facebook.com', 'wa.me', 'bsky.app']);
    expect(new URL(links.x).searchParams.get('text')).toBe(text);
    expect(new URL(links.x).searchParams.get('url')).toBe(SHARE_URL);
    expect(new URL(links.facebook).searchParams.get('u')).toBe(SHARE_URL);
    expect(new URL(links.whatsapp).searchParams.get('text')).toBe(`${text} ${SHARE_URL}`);
    expect(new URL(links.bluesky).searchParams.get('text')).toBe(`${text} ${SHARE_URL}`);
  });

  it('encodes hostile text instead of letting it add parameters', () => {
    const links = buildShareLinks('a&url=https://evil.example#x', SHARE_URL);
    const params = new URL(links.x).searchParams;
    expect(params.get('url')).toBe(SHARE_URL);
    expect(params.get('text')).toBe('a&url=https://evil.example#x');
  });

  it('always points at the canonical English game route', () => {
    expect(SHARE_URL).toBe('https://thieffrycriminals.be/game/');
  });

  it('fills translated templates and formats the score for the locale', () => {
    const templates = { textReached: 'Ich habe {score} Punkte, Level {level}/{total}.', textComplete: 'Alles geschafft: {score} ({total} Level).' };
    expect(buildShareText(1240, 4, false, templates, 'de')).toBe('Ich habe 1.240 Punkte, Level 4/5.');
    expect(buildShareText(2600, 5, true, templates, 'de')).toBe('Alles geschafft: 2.600 (5 Level).');
  });

  it('keeps unknown placeholders and survives an unsupported locale tag', () => {
    expect(buildShareText(10, 1, false, { textReached: '{score} {oops}', textComplete: '' }, 'zz-invalid-tag-xx')).toBe('10 {oops}');
  });

  it('shares the localized game route only when the game is translated into that locale', () => {
    expect(buildShareUrl('fr', true)).toBe('https://thieffrycriminals.be/fr/game/');
    expect(buildShareUrl('fr', false)).toBe(SHARE_URL);
    expect(buildShareUrl('en', true)).toBe(SHARE_URL);
    expect(buildShareUrl('../evil', true)).toBe(SHARE_URL);
  });
});
