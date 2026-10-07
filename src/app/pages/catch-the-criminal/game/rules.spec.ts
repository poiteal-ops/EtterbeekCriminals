import { describe, expect, it } from 'vitest';
import { GameRules } from './rules';

describe('game rules', () => {
  it('awards catches, damages an object once, and ends on the third loss', () => {
    const game = new GameRules();
    game.catchDog(2500);
    expect(game.snapshot().prevented).toBe(1);
    expect(game.snapshot().score).toBe(120);

    game.damage('sofa');
    game.damage('sofa');
    expect(game.snapshot().damaged).toBe(1);
    game.damage('shoe');
    game.damage('bin');
    expect(game.snapshot().ended).toBe(true);
    expect(game.snapshot().score).toBe(0);
  });

  it('does not advance time while paused and ends at the time limit', () => {
    const game = new GameRules();
    game.setPaused(true);
    game.tick(10);
    expect(game.snapshot().secondsLeft).toBe(180);
    game.setPaused(false);
    game.tick(180);
    expect(game.snapshot().secondsLeft).toBe(0);
    expect(game.snapshot().ended).toBe(true);
  });
});
