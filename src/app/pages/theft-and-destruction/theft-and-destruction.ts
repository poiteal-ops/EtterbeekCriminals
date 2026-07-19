import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-theft-and-destruction',
  templateUrl: './theft-and-destruction.html',
  styleUrl: './theft-and-destruction.scss',
})
export class TheftAndDestruction {
  protected readonly translation = inject(TranslationService);
}
