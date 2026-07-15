import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-pigeon',
  templateUrl: './pigeon.html',
  styleUrl: './pigeon.scss',
})
export class Pigeon {
  protected readonly translation = inject(TranslationService);
}
