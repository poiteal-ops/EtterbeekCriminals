import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  protected readonly translation = inject(TranslationService);
}
