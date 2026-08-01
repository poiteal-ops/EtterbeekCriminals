import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-blog',
  imports: [RouterLink],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog {
  protected readonly translation = inject(TranslationService);
  private readonly requestedPage = signal(1);

  /** Newest first — the content model stores posts oldest-first (append-only monthly log). */
  private readonly posts = computed(() => [...this.translation.t().blogPosts].reverse());

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.posts().length / PAGE_SIZE)));

  /** Clamped so a locale switch that changes the post count can't strand the view past the last page. */
  protected readonly page = computed(() => Math.min(Math.max(this.requestedPage(), 1), this.totalPages()));

  protected readonly pagePosts = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.posts().slice(start, start + PAGE_SIZE);
  });

  protected goToPage(page: number): void {
    this.requestedPage.set(page);
  }
}
