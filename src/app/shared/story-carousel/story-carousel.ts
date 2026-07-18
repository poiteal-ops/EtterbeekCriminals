import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';

const ADVANCE_INTERVAL_MS = 15000;
const FADE_DURATION_MS = 300;

@Component({
  selector: 'app-story-carousel',
  imports: [RouterLink],
  templateUrl: './story-carousel.html',
  styleUrl: './story-carousel.scss',
})
export class StoryCarousel {
  protected readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentIndex = signal(0);
  protected readonly visible = signal(true);
  private readonly paused = signal(false);

  private timer: ReturnType<typeof setInterval> | undefined;
  private fadeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.startTimer();
    this.destroyRef.onDestroy(() => this.stopTimer());
  }

  protected selectStory(index: number): void {
    this.startTimer();
    this.goTo(index);
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.paused()) this.advance();
    }, ADVANCE_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    if (this.fadeTimeout !== undefined) clearTimeout(this.fadeTimeout);
  }

  private advance(): void {
    const count = this.translation.t().adventures.length;
    this.goTo((this.currentIndex() + 1) % count);
  }

  private goTo(index: number): void {
    this.visible.set(false);
    if (this.fadeTimeout !== undefined) clearTimeout(this.fadeTimeout);
    this.fadeTimeout = setTimeout(() => {
      this.currentIndex.set(index);
      this.visible.set(true);
    }, FADE_DURATION_MS);
  }
}
