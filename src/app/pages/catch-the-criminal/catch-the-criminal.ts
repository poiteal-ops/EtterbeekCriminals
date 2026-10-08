import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FallbackBanner } from '../../shared/fallback-banner/fallback-banner';
import { TranslationService } from '../../services/translation.service';
import type { Direction, GameEvent, GameHandle } from './game/game-runtime';
import { LEVEL_SECONDS, TOTAL_LEVELS } from './game/levels';
import { finishLevel, levelSpec, newRun, nextLevel, rankFor, type LevelResult, type RankKey, type RunState } from './game/run';
import type { GameSnapshot } from './game/rules';
import { buildShareLinks, buildShareText, buildShareUrl } from './game/share';

type PagePhase = 'intro' | 'loading' | 'playing' | 'paused' | 'levelComplete' | 'over' | 'error';

function initialSnapshot(): GameSnapshot {
  return {
    secondsLeft: LEVEL_SECONDS, score: 0, prevented: 0, damaged: 0, damagedIds: [], paused: false, ended: false,
    stopAvailable: true, treatAvailable: true, stopSecondsLeft: 0, treatLuring: false,
    treatStunSecondsLeft: 0, fartSecondsLeft: 0, piketteSecondsLeft: 0, piketteObjectId: null,
  };
}

@Component({
  selector: 'app-catch-the-criminal',
  imports: [FallbackBanner, RouterLink],
  templateUrl: './catch-the-criminal.html',
  styleUrl: './catch-the-criminal.scss',
})
export class CatchTheCriminal implements OnDestroy {
  protected readonly translation = inject(TranslationService);
  protected readonly totalLevels = TOTAL_LEVELS;
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  @ViewChild('gameHost') private gameHost?: ElementRef<HTMLDivElement>;
  @ViewChild('gamePanel') private gamePanel?: ElementRef<HTMLDivElement>;
  @ViewChild('focusSurface') private focusSurface?: ElementRef<HTMLDivElement>;

  protected readonly phase = signal<PagePhase>('intro');
  protected readonly snapshot = signal<GameSnapshot>(initialSnapshot());
  protected readonly run = signal<RunState>(newRun());
  protected readonly result = signal<LevelResult | null>(null);
  protected readonly message = signal('');
  protected readonly soundOn = signal(false);
  protected readonly volume = signal(40);
  protected readonly shareStatus = signal('');
  protected readonly canNativeShare = typeof this.document.defaultView?.navigator?.share === 'function';

  protected readonly levelName = computed(() => this.nameFor(this.run().level));
  protected readonly nextLevelName = computed(() => this.nameFor(this.run().level + 1));
  /** Banked score plus the level in progress, so the total never double-counts a finished level. */
  protected readonly totalScore = computed(() => {
    const active = this.phase() === 'playing' || this.phase() === 'paused';
    return this.run().score + (active ? this.snapshot().score : 0);
  });
  protected readonly rank = computed(() => {
    const copy = this.gameCopy;
    const titles: Record<RankKey, string> = {
      insurance: copy.rankInsurance, overwhelmed: copy.rankOverwhelmed, negotiator: copy.rankNegotiator,
      watch: copy.rankWatch, adult: copy.rankAdult,
    };
    return titles[rankFor(this.run())];
  });
  protected readonly runComplete = computed(() => this.result()?.status === 'complete');
  protected readonly shareText = computed(() => buildShareText(
    this.run().score, this.run().level, this.runComplete(), this.gameCopy.share, this.gameLang));
  protected readonly shareUrl = computed(() => buildShareUrl(this.translation.locale(), !this.translation.isSectionFallback('game')));
  protected readonly shareLinks = computed(() => buildShareLinks(this.shareText(), this.shareUrl()));

  /** The game copy for the active locale; English per string (or entirely) until it is translated. */
  protected get gameCopy() { return this.translation.t().game; }
  protected get dogName(): string { return this.translation.t().about.dogName; }
  /** Language of the game content: the locale's own once its `game` block exists, otherwise English. */
  protected get gameLang(): string { return this.translation.isSectionFallback('game') ? 'en' : this.translation.locale(); }

  private game: GameHandle | null = null;
  private readonly keys = new Set<string>();
  private readonly touch = new Set<string>();
  private disposed = false;

  /** Starts a brand-new run at level 1 (Start Patrol and Play Again). */
  protected async start(): Promise<void> {
    this.run.set(newRun());
    this.result.set(null);
    this.shareStatus.set('');
    await this.beginLevel();
  }

  protected async startNextLevel(): Promise<void> {
    this.run.update(nextLevel);
    this.result.set(null);
    await this.beginLevel();
  }

  private async beginLevel(): Promise<void> {
    this.stopGame();
    this.phase.set('loading');
    this.snapshot.set(initialSnapshot());
    this.message.set('');
    try {
      const { mountGame } = await import('./game/game-runtime');
      if (this.disposed || !this.gameHost) return;
      const spec = levelSpec(this.run().level);
      this.game = mountGame(this.gameHost.nativeElement, {
        direction: () => this.direction(),
        mapLabels: this.gameCopy.mapLabels,
        onSnapshot: (data) => this.zone.run(() => this.snapshot.set(data)),
        onEvent: (event) => this.zone.run(() => this.showEvent(event)),
        onEnd: (data) => this.zone.run(() => this.endLevel(data)),
        reducedMotion: this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      }, spec);
      this.game.setSound(this.soundOn(), this.volume() / 100);
      this.phase.set('playing');
      if (spec.level > 1) this.message.set(this.fill(this.gameCopy.levelStartMessage, { n: String(spec.level), name: this.nameFor(spec.level) }));
      this.focusSurface?.nativeElement.focus({ preventScroll: true });
      this.document.defaultView?.requestAnimationFrame(() => {
        if (this.phase() === 'playing') this.gamePanel?.nativeElement.scrollIntoView({ block: 'start' });
      });
    } catch {
      this.phase.set('error');
      this.message.set(this.gameCopy.openError);
    }
  }

  private endLevel(data: GameSnapshot): void {
    this.snapshot.set(data);
    this.clearInput();
    const outcome = finishLevel(this.run(), data);
    this.run.set(outcome.run);
    this.result.set(outcome);
    this.phase.set(outcome.status === 'next' ? 'levelComplete' : 'over');
  }

  protected togglePause(): void {
    if (this.phase() === 'playing') {
      this.game?.setPaused(true);
      this.clearInput();
      this.phase.set('paused');
    } else if (this.phase() === 'paused') {
      this.game?.setPaused(false);
      this.phase.set('playing');
      this.focusSurface?.nativeElement.focus();
    }
  }

  protected toggleSound(): void {
    this.soundOn.update((enabled) => !enabled);
    this.game?.setSound(this.soundOn(), this.volume() / 100);
    this.focusPlayfield();
  }

  protected focusPlayfield(): void {
    if (this.phase() === 'playing') this.focusSurface?.nativeElement.focus();
  }

  protected setVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume.set(Number(input.value));
    this.game?.setSound(this.soundOn(), this.volume() / 100);
  }

  protected useItem(kind: 'stop' | 'treat'): void {
    if (this.phase() !== 'playing') return;
    const used = kind === 'stop' ? this.game?.useStop() : this.game?.useTreat();
    if (used) this.focusPlayfield();
  }

  protected async nativeShare(): Promise<void> {
    try {
      await this.document.defaultView?.navigator.share({ text: this.shareText(), url: this.shareUrl() });
    } catch {
      // Dismissing the share sheet rejects with AbortError; nothing to report.
    }
  }

  protected async copyShare(): Promise<void> {
    const text = `${this.shareText()} ${this.shareUrl()}`;
    const copy = this.gameCopy.share;
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(text);
      this.shareStatus.set(copy.copied);
    } catch {
      this.shareStatus.set(this.copyWithSelection(text) ? copy.copied : copy.copyFailed);
    }
  }

  private copyWithSelection(text: string): boolean {
    const field = this.document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    this.document.body.appendChild(field);
    try {
      field.select();
      return this.document.execCommand('copy');
    } catch {
      return false;
    } finally {
      field.remove();
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      event.preventDefault();
      this.togglePause();
      return;
    }
    if (key === '1' || key === '2') {
      event.preventDefault();
      this.useItem(key === '1' ? 'stop' : 'treat');
      return;
    }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      this.keys.add(key);
    }
  }

  protected onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
  }

  protected press(direction: string, event: PointerEvent): void {
    if (this.phase() !== 'playing') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.touch.add(direction);
  }

  protected release(direction: string): void {
    this.touch.delete(direction);
  }

  protected timeLabel(): string {
    const seconds = this.snapshot().secondsLeft;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  protected levelLabel(): string {
    return this.fill(this.gameCopy.levelOf, { n: String(this.run().level), total: String(TOTAL_LEVELS) });
  }

  protected clearedTitle(): string {
    return this.fill(this.gameCopy.levelClearedTitle, { n: String(this.run().level) });
  }

  protected nextIntro(): string {
    return this.fill(this.gameCopy.nextLevelIntro, { name: this.nextLevelName() });
  }

  protected reachedLabel(): string {
    return this.fill(this.gameCopy.reachedLevel, { n: String(this.run().level), total: String(TOTAL_LEVELS) });
  }

  private nameFor(level: number): string {
    const names = this.gameCopy.levelNames;
    return names[Math.min(names.length, Math.max(1, level)) - 1] ?? '';
  }

  private fill(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  }

  private direction(): Direction {
    const has = (key: string, arrow: string, touch: string) => this.keys.has(key) || this.keys.has(arrow) || this.touch.has(touch);
    return {
      x: Number(has('d', 'arrowright', 'right')) - Number(has('a', 'arrowleft', 'left')),
      y: Number(has('s', 'arrowdown', 'down')) - Number(has('w', 'arrowup', 'up')),
    };
  }

  private showEvent(event: GameEvent): void {
    const copy = this.gameCopy;
    const object = event.objectId ? (copy.objects[event.objectId] ?? event.objectId) : '';
    const messages = {
      target: copy.targetMessage,
      caught: copy.caughtMessage,
      damage: copy.damageMessage,
      stop: copy.stopMessage,
      treat: copy.treatMessage,
      fart: copy.fartMessage,
      piketteEnter: copy.piketteEnterMessage,
      pikette: copy.piketteMessage,
      piketteGone: copy.piketteGoneMessage,
    };
    this.message.set(messages[event.kind].replace('{object}', object));
  }

  private clearInput(): void {
    this.keys.clear();
    this.touch.clear();
  }

  private stopGame(): void {
    this.clearInput();
    this.game?.destroy();
    this.game = null;
  }

  @HostListener('window:blur')
  @HostListener('document:visibilitychange')
  protected autoPause(): void {
    if ((this.document.hidden || !this.document.hasFocus()) && this.phase() === 'playing') this.togglePause();
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.stopGame();
  }
}
