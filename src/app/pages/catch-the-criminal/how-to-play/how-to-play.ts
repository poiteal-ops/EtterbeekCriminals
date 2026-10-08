import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../../services/translation.service';
import { FallbackBanner } from '../../../shared/fallback-banner/fallback-banner';

@Component({
  selector: 'app-how-to-play',
  imports: [RouterLink, FallbackBanner],
  templateUrl: './how-to-play.html',
  styleUrl: './how-to-play.scss',
})
export class HowToPlay {
  protected readonly translation = inject(TranslationService);

  protected get game() { return this.translation.t().game; }
  /** English until the locale's own `game` block exists. */
  protected get gameLang(): string { return this.translation.isSectionFallback('game') ? 'en' : this.translation.locale(); }
}
