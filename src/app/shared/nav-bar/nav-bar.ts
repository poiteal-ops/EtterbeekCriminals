import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { Lang, TranslationService } from '../../services/translation.service';

const STORY_ROUTES = ['/pigeon', '/couch', '/train-ride'];

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly translation = inject(TranslationService);

  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly dropdownOpen = signal(false);

  protected readonly storiesActive = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => STORY_ROUTES.some((route) => this.router.url.startsWith(route))),
      startWith(STORY_ROUTES.some((route) => this.router.url.startsWith(route))),
    ),
    { initialValue: false },
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.dropdownOpen.set(false);
      });
  }

  setLang(lang: Lang): void {
    this.translation.setLang(lang);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((open) => !open);
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }
}
