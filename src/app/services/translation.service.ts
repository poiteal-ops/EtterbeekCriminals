import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { EN_CONTENT } from '../i18n/content/en.content';
import { SiteContent } from '../i18n/content/site-content.model';
import { DEFAULT_LOCALE, LocaleCode, hasContent } from '../i18n/locale-registry';

export type { SiteContent } from '../i18n/content/site-content.model';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /** The locale currently reflected in the URL. */
  private readonly localeSignal = signal<LocaleCode>(DEFAULT_LOCALE);
  readonly locale = this.localeSignal.asReadonly();

  private readonly contentMap = signal<Partial<Record<LocaleCode, SiteContent>>>({ en: EN_CONTENT });

  /** The locale whose content is actually being rendered (falls back to 'en' if not yet loaded/available). */
  readonly contentLocale = computed<LocaleCode>(() =>
    this.contentMap()[this.localeSignal()] ? this.localeSignal() : DEFAULT_LOCALE,
  );

  readonly t = computed(() => this.contentMap()[this.contentLocale()] ?? EN_CONTENT);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.contentLocale();
    });
  }

  /** Called by the route resolver before a page renders. Resolves once content is ready (or has fallen back). */
  async activate(locale: LocaleCode): Promise<void> {
    this.localeSignal.set(locale);
    const target = hasContent(locale) ? locale : DEFAULT_LOCALE;
    if (!this.contentMap()[target]) {
      await this.loadContent(target);
    }
  }

  private async loadContent(locale: LocaleCode): Promise<void> {
    if (locale === DEFAULT_LOCALE) return;
    try {
      const data = await firstValueFrom(this.http.get<SiteContent>(`i18n/${locale}.json`));
      this.contentMap.update((current) => ({ ...current, [locale]: data }));
    } catch (err) {
      console.warn(`[i18n] Failed to load "${locale}" content, falling back to English.`, err);
    }
  }

  /**
   * Builds a locale-prefixed routerLink command array, e.g. path('shop', slug) => ['/', 'fr', 'shop', slug]
   * when the active locale is 'fr', or ['/', 'shop', slug] for the default locale.
   * Accepts plain segments or already-slashed strings like '/pigeon'.
   */
  path(...segments: Array<string | number | null | undefined>): unknown[] {
    const parts = segments
      .filter((s): s is string | number => s !== null && s !== undefined && s !== '')
      .flatMap((s) => String(s).split('/').filter(Boolean));
    return this.localeSignal() === DEFAULT_LOCALE ? ['/', ...parts] : ['/', this.localeSignal(), ...parts];
  }
}
