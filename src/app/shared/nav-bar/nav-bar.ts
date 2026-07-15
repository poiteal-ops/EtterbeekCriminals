import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Lang, TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly translation = inject(TranslationService);

  setLang(lang: Lang): void {
    this.translation.setLang(lang);
  }
}
