import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';
import { StoryCarousel } from '../../shared/story-carousel/story-carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, StoryCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly translation = inject(TranslationService);
}
