import { CanMatchFn } from '@angular/router';

import { isKnownLocale } from './locale-registry';

export const localeCanMatch: CanMatchFn = (_route, segments) => {
  const first = segments[0]?.path;
  return !!first && isKnownLocale(first);
};
