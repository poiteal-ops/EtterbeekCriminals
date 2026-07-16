import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-train-ride',
  templateUrl: './train-ride.html',
  styleUrl: './train-ride.scss',
})
export class TrainRide {
  protected readonly translation = inject(TranslationService);
}
