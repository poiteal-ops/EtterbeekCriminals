import { Component, inject } from '@angular/core';

import { FallbackBanner } from '../../shared/fallback-banner/fallback-banner';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-heatwave-survival',
  imports: [FallbackBanner],
  templateUrl: './heatwave-survival.html',
  styleUrl: './heatwave-survival.scss',
})
export class HeatwaveSurvival {
  protected readonly translation = inject(TranslationService);
}
