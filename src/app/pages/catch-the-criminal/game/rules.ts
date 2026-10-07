export interface GameSnapshot {
  secondsLeft: number;
  score: number;
  prevented: number;
  damaged: number;
  damagedIds: readonly string[];
  paused: boolean;
  ended: boolean;
}

export class GameRules {
  private secondsLeft = 180;
  private score = 0;
  private prevented = 0;
  private damagedIds = new Set<string>();
  private paused = false;
  private ended = false;

  snapshot(): GameSnapshot {
    return {
      secondsLeft: Math.ceil(this.secondsLeft),
      score: this.score,
      prevented: this.prevented,
      damaged: this.damagedIds.size,
      damagedIds: [...this.damagedIds],
      paused: this.paused,
      ended: this.ended,
    };
  }

  tick(seconds: number): void {
    if (this.paused || this.ended || !Number.isFinite(seconds) || seconds <= 0) return;
    this.secondsLeft = Math.max(0, this.secondsLeft - seconds);
    if (this.secondsLeft === 0) this.ended = true;
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
