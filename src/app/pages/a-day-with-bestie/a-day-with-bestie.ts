import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-a-day-with-bestie',
  templateUrl: './a-day-with-bestie.html',
  styleUrl: './a-day-with-bestie.scss',
})
export class ADayWithBestie {
  protected readonly translation = inject(TranslationService);
}
