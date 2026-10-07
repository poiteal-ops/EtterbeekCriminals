import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EN_CONTENT } from '../../../i18n/content/en.content';
import { TranslationService } from '../../../services/translation.service';
import { FallbackBanner } from '../../../shared/fallback-banner/fallback-banner';

@Component({
  selector: 'app-how-to-play',
  imports: [RouterLink, FallbackBanner],
  templateUrl: './how-to-play.html',
  styleUrl: './how-to-play.scss',
})
export class HowToPlay {
  protected readonly game = EN_CONTENT.game;
  protected readonly translation = inject(TranslationService);
}
