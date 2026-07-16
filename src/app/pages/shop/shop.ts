import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-shop',
  imports: [RouterLink],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  protected readonly translation = inject(TranslationService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly playingVideos = signal<ReadonlySet<string>>(new Set());

  protected isPlaying(videoId: string): boolean {
    return this.playingVideos().has(videoId);
  }

  protected play(videoId: string): void {
    this.playingVideos.update((set) => new Set(set).add(videoId));
  }

  protected thumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  protected embedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
    );
  }
}
