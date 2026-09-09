import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-kande-nadege',
  templateUrl: './kande-nadege.html',
  styleUrl: './kande-nadege.scss',
})
export class KandeNadege {
  protected readonly translation = inject(TranslationService);
}
