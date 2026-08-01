import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-jury-tampering',
  templateUrl: './jury-tampering.html',
  styleUrl: './jury-tampering.scss',
})
export class JuryTampering {
  protected readonly translation = inject(TranslationService);
}
