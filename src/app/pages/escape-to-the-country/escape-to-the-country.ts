import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-escape-to-the-country',
  templateUrl: './escape-to-the-country.html',
  styleUrl: './escape-to-the-country.scss',
})
export class EscapeToTheCountry {
  protected readonly translation = inject(TranslationService);
}
