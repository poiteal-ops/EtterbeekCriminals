import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-shop-item',
  imports: [RouterLink],
  templateUrl: './shop-item.html',
  styleUrl: './shop-item.scss',
})
export class ShopItemPage {
  protected readonly translation = inject(TranslationService);

  readonly slug = input<string>();

  protected readonly item = computed(() =>
    this.translation.t().shopItems.find((item) => item.slug === this.slug()),
  );
}
