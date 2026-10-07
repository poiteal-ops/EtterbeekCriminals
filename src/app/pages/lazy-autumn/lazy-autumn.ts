import { Component, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-lazy-autumn',
  templateUrl: './lazy-autumn.html',
  styleUrl: './lazy-autumn.scss',
})
export class LazyAutumn {
  protected readonly translation = inject(TranslationService);
}
