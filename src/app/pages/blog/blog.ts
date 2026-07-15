import { Component, inject } from '@angular/core';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog {
  protected readonly translation = inject(TranslationService);
}
