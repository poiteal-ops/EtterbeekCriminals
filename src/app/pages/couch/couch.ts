import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-couch',
  templateUrl: './couch.html',
  styleUrl: './couch.scss',
})
export class Couch {
  protected readonly translation = inject(TranslationService);
}
