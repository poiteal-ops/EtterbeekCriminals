import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-footer-bar',
  templateUrl: './footer-bar.html',
  styleUrl: './footer-bar.scss',
})
export class FooterBar {
  protected readonly translation = inject(TranslationService);
}
