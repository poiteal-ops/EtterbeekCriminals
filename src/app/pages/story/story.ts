import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-story',
  templateUrl: './story.html',
  styleUrl: './story.scss',
})
export class Story {
  protected readonly translation = inject(TranslationService);
}
