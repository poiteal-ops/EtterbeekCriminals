import { Component, inject, input } from '@angular/core';

import { SiteContent, TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-fallback-banner',
  templateUrl: './fallback-banner.html',
  styleUrl: './fallback-banner.scss',
})
export class FallbackBanner {
  readonly section = input.required<keyof SiteContent>();
  readonly englishOnly = input(false);
  protected readonly translation = inject(TranslationService);
}
