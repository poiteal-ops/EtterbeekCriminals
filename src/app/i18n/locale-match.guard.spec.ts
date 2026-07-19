import { Route, UrlSegment } from '@angular/router';

import { localeCanMatch } from './locale-match.guard';

function matches(code: string): boolean {
  return localeCanMatch(
    {} as Route,
    code ? [new UrlSegment(code, {})] : [],
    {} as any
  ) as boolean;
}

describe('localeCanMatch', () => {
  it.each(['fr', 'nl'])('accepts non-default content-backed locale %s', (code) => {
    expect(matches(code)).toBe(true);
  });

  it('rejects prefixed English because English canonical URLs are unprefixed', () => {
    expect(matches('en')).toBe(false);
  });

  it.each(['ga', 'lv', 'lt', 'mt', 'sk', 'sl'])('rejects locale %s without content', (code) => {
    expect(matches(code)).toBe(false);
  });

  it('rejects an unknown locale', () => {
    expect(matches('zz')).toBe(false);
  });

  it('rejects an empty URL segment list', () => {
    expect(matches('')).toBe(false);
  });
});
