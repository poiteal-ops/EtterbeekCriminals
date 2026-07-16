import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { TranslationService } from '../services/translation.service';
import { DEFAULT_LOCALE, LocaleCode, isKnownLocale } from './locale-registry';

export const localeResolver: ResolveFn<LocaleCode> = async (route) => {
  const translation = inject(TranslationService);
  const param = route.paramMap.get('lang');
  const locale: LocaleCode = param && isKnownLocale(param) ? param : DEFAULT_LOCALE;
  await translation.activate(locale);
  return locale;
};
