import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { TranslationService } from '../../services/translation.service';
import { CONTENT_LOCALES, DEFAULT_LOCALE, LocaleCode, isKnownLocale, localeDisplayName } from '../../i18n/locale-registry';

const STORY_ROUTES = ['/pigeon', '/couch', '/train-ride', '/escape-to-the-country'];

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
  protected readonly langDropdownOpen = signal(false);

  protected readonly localeOptions = CONTENT_LOCALES;

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
        this.langDropdownOpen.set(false);
      });
  }

  protected localeLabel(code: LocaleCode): string {
    return localeDisplayName(code);
  }

  switchLocale(code: LocaleCode): void {
    const segments = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean);
    if (segments.length && isKnownLocale(segments[0])) segments.shift();
    const target = code === DEFAULT_LOCALE ? ['/', ...segments] : ['/', code, ...segments];
    this.router.navigate(target);
    this.langDropdownOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((open) => !open);
  }

  toggleLangDropdown(event: Event): void {
    event.stopPropagation();
    this.langDropdownOpen.update((open) => !open);
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.langDropdownOpen.set(false);
  }
}
