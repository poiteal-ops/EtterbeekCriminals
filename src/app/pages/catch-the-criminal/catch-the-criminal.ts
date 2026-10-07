import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EN_CONTENT } from '../../i18n/content/en.content';
import { FallbackBanner } from '../../shared/fallback-banner/fallback-banner';
import { TranslationService } from '../../services/translation.service';
import type { Direction, GameEvent, GameHandle } from './game/game-runtime';
import type { GameSnapshot } from './game/rules';

type PagePhase = 'intro' | 'loading' | 'playing' | 'paused' | 'over' | 'error';

@Component({
  selector: 'app-catch-the-criminal',
  imports: [FallbackBanner, RouterLink],
  templateUrl: './catch-the-criminal.html',
  styleUrl: './catch-the-criminal.scss',
})
export class CatchTheCriminal implements OnDestroy {
  protected readonly gameCopy = EN_CONTENT.game;
  protected readonly translation = inject(TranslationService);
  protected readonly dogName = EN_CONTENT.about.dogName;
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  @ViewChild('gameHost') private gameHost?: ElementRef<HTMLDivElement>;
  @ViewChild('gamePanel') private gamePanel?: ElementRef<HTMLDivElement>;
  @ViewChild('focusSurface') private focusSurface?: ElementRef<HTMLDivElement>;

  protected readonly phase = signal<PagePhase>('intro');
  protected readonly snapshot = signal<GameSnapshot>({
    secondsLeft: 180, score: 0, prevented: 0, damaged: 0, damagedIds: [], paused: false, ended: false,
    stopAvailable: true, treatAvailable: true, stopSecondsLeft: 0, treatLuring: false,
    treatStunSecondsLeft: 0, fartSecondsLeft: 0, piketteSecondsLeft: 0, piketteObjectId: null,
  });
  protected readonly message = signal('');
  protected readonly soundOn = signal(false);
  protected readonly volume = signal(40);
  protected readonly rank = computed(() => {
    const data = this.snapshot();
    const copy = this.gameCopy;
    if (data.damaged >= 3) return copy.rankInsurance;
    if (data.prevented >= 12) return copy.rankAdult;
    if (data.prevented >= 8) return copy.rankWatch;
    if (data.prevented >= 4) return copy.rankNegotiator;
    return copy.rankOverwhelmed;
  });

  private game: GameHandle | null = null;
  private readonly keys = new Set<string>();
  private readonly touch = new Set<string>();
  private disposed = false;

  protected async start(): Promise<void> {
    this.stopGame();
    this.phase.set('loading');
    this.message.set('');
    try {
      const { mountGame } = await import('./game/game-runtime');
      if (this.disposed || !this.gameHost) return;
      this.game = mountGame(this.gameHost.nativeElement, {
        direction: () => this.direction(),
        onSnapshot: (data) => this.zone.run(() => this.snapshot.set(data)),
        onEvent: (event) => this.zone.run(() => this.showEvent(event)),
        onEnd: (data) => this.zone.run(() => {
          this.snapshot.set(data);
          this.phase.set('over');
        }),
        reducedMotion: this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      });
      this.game.setSound(this.soundOn(), this.volume() / 100);
      this.phase.set('playing');
      this.focusSurface?.nativeElement.focus({ preventScroll: true });
      this.document.defaultView?.requestAnimationFrame(() => {
        if (this.phase() === 'playing') this.gamePanel?.nativeElement.scrollIntoView({ block: 'start' });
      });
    } catch {
      this.phase.set('error');
      this.message.set('The case file could not open. Please try again.');
    }
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
