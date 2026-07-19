import { CanMatchFn } from '@angular/router';

import { DEFAULT_LOCALE, hasContent, isKnownLocale } from './locale-registry';

export const localeCanMatch: CanMatchFn = (_route, segments) => {
  const first = segments[0]?.path;
  return !!first && first !== DEFAULT_LOCALE && isKnownLocale(first) && hasContent(first);
};
