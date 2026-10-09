import { LEVEL_SECONDS } from './levels';

export interface GameSnapshot {
  secondsLeft: number;
  score: number;
  prevented: number;
  damaged: number;
  damagedIds: readonly string[];
  paused: boolean;
  ended: boolean;
  stopAvailable: boolean;
  treatAvailable: boolean;
  stopSecondsLeft: number;
  treatLuring: boolean;
  treatStunSecondsLeft: number;
  fartSecondsLeft: number;
  scrambleSecondsLeft: number;
  piketteSecondsLeft: number;
  piketteObjectId: string | null;
}

export class GameRules {
  private secondsLeft: number;
  private score = 0;
  private prevented = 0;
  private damagedIds = new Set<string>();
  private paused = false;
  private ended = false;
  private stopAvailable = true;
  private treatAvailable = true;
  private stopSecondsLeft = 0;
  private treatLuring = false;
  private treatStunSecondsLeft = 0;
  private fartSecondsLeft = 0;
  private fartCooldownSeconds = 0;
  private scrambleSecondsLeft = 0;
  private scareCooldownSeconds = 0;
  private piketteSecondsLeft = 0;
  private piketteObjectId: string | null = null;

  constructor(levelSeconds = LEVEL_SECONDS) {
    this.secondsLeft = levelSeconds;
  }

  snapshot(): GameSnapshot {
    return {
      secondsLeft: Math.ceil(this.secondsLeft),
      score: this.score,
      prevented: this.prevented,
      damaged: this.damagedIds.size,
      damagedIds: [...this.damagedIds],
      paused: this.paused,
      ended: this.ended,
      stopAvailable: this.stopAvailable,
      treatAvailable: this.treatAvailable,
      stopSecondsLeft: this.stopSecondsLeft,
      treatLuring: this.treatLuring,
      treatStunSecondsLeft: this.treatStunSecondsLeft,
      fartSecondsLeft: this.fartSecondsLeft,
      scrambleSecondsLeft: this.scrambleSecondsLeft,
      piketteSecondsLeft: this.piketteSecondsLeft,
      piketteObjectId: this.piketteObjectId,
    };
  }

  tick(seconds: number): void {
    if (this.paused || this.ended || !Number.isFinite(seconds) || seconds <= 0) return;
    this.secondsLeft = Math.max(0, this.secondsLeft - seconds);
    this.stopSecondsLeft = Math.max(0, this.stopSecondsLeft - seconds);
    this.treatStunSecondsLeft = Math.max(0, this.treatStunSecondsLeft - seconds);
    this.fartSecondsLeft = Math.max(0, this.fartSecondsLeft - seconds);
    this.fartCooldownSeconds = Math.max(0, this.fartCooldownSeconds - seconds);
    this.scrambleSecondsLeft = Math.max(0, this.scrambleSecondsLeft - seconds);
    this.scareCooldownSeconds = Math.max(0, this.scareCooldownSeconds - seconds);
    this.piketteSecondsLeft = Math.max(0, this.piketteSecondsLeft - seconds);
    if (this.piketteSecondsLeft === 0) this.piketteObjectId = null;
    if (this.secondsLeft === 0) this.ended = true;
  }

  useStop(): boolean {
    if (this.paused || this.ended || !this.stopAvailable || this.stopSecondsLeft > 0) return false;
    this.stopAvailable = false;
    this.stopSecondsLeft = 5;
    return true;
  }

  useTreat(): boolean {
    if (this.paused || this.ended || !this.treatAvailable || this.stopSecondsLeft > 0 || this.treatLuring || this.treatStunSecondsLeft > 0) return false;
    this.treatAvailable = false;
    this.treatLuring = true;
    return true;
  }

  beginTreatStun(): void {
    if (!this.treatLuring || this.ended) return;
    this.treatLuring = false;
    this.treatStunSecondsLeft = 3;
  }

  clearDogControl(): void {
    this.stopSecondsLeft = 0;
    this.treatLuring = false;
    this.treatStunSecondsLeft = 0;
  }

  triggerFart(): boolean {
    if (this.paused || this.ended || this.fartSecondsLeft > 0 || this.fartCooldownSeconds > 0) return false;
    this.fartSecondsLeft = 3;
    this.fartCooldownSeconds = 12;
    return true;
  }

  /** Pikette hisses at anyone within three squares: both actors are scrambled for three seconds, then get a two-second breather. */
  triggerPiketteScare(): boolean {
    if (this.paused || this.ended || this.scareCooldownSeconds > 0) return false;
    this.scrambleSecondsLeft = 3;
    this.scareCooldownSeconds = 5;
    return true;
  }

  startPiketteGuard(id: string): boolean {
    if (this.paused || this.ended || this.piketteSecondsLeft > 0) return false;
    this.piketteObjectId = id;
    this.piketteSecondsLeft = 5;
    return true;
  }

  setPaused(paused: boolean): void {
    if (!this.ended) this.paused = paused;
  }

  catchDog(remainingThreatMs: number): void {
    if (this.paused || this.ended) return;
    const bonus = Math.min(25, Math.max(0, Math.floor(remainingThreatMs / 125)));
    this.score += 100 + bonus;
    this.prevented++;
  }

  damage(id: string): void {
    if (this.paused || this.ended || this.damagedIds.has(id)) return;
    this.damagedIds.add(id);
    this.score = Math.max(0, this.score - 50);
    if (this.damagedIds.size >= 3) this.ended = true;
  }
}
