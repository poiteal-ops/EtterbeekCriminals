import { describe, expect, it } from 'vitest';

import { finishLevel, levelClearBonus, levelSpec, newRun, nextLevel, rankFor, type RunState } from './run';
import { GameRules, type GameSnapshot } from './rules';

function snapshot(partial: Partial<GameSnapshot>): GameSnapshot {
  return { ...new GameRules().snapshot(), ...partial };
}

describe('run progression', () => {
  it('starts at level 1 with nothing banked', () => {
    expect(newRun()).toEqual({ level: 1, score: 0, prevented: 0, cleared: 0 });
  });

  it('banks the level score plus a clear bonus when a level is survived', () => {
    const result = finishLevel(newRun(), snapshot({ score: 220, prevented: 2, damaged: 1 }));
    expect(result.status).toBe('next');
    expect(result.bonus).toBe(levelClearBonus(1, 9));
    expect(result.run).toEqual({ level: 1, score: 220 + 50 + 90, prevented: 2, cleared: 1 });
  });

  it('ends the run on three damaged objects without a bonus', () => {
    const result = finishLevel({ level: 3, score: 500, prevented: 6, cleared: 2 }, snapshot({ score: 40, damaged: 3 }));
    expect(result.status).toBe('failed');
    expect(result.bonus).toBe(0);
    expect(result.run).toEqual({ level: 3, score: 540, prevented: 6, cleared: 2 });
  });

  it('completes the run after level 5', () => {
    const result = finishLevel({ level: 5, score: 1000, prevented: 20, cleared: 4 }, snapshot({ score: 100 }));
    expect(result.status).toBe('complete');
    expect(result.run.cleared).toBe(5);
  });

  it('advances one level at a time and never past 5', () => {
    let run: RunState = newRun();
    for (let i = 0; i < 8; i++) run = nextLevel(run);
    expect(run.level).toBe(5);
  });

  it('does not mutate the input run', () => {
    const run = newRun();
    finishLevel(run, snapshot({ score: 100 }));
    expect(run).toEqual(newRun());
  });

  it('ranks by levels cleared, with the worst rank for an early collapse', () => {
    expect(rankFor({ level: 1, score: 20, prevented: 0, cleared: 0 })).toBe('insurance');
    expect(rankFor({ level: 1, score: 300, prevented: 3, cleared: 0 })).toBe('overwhelmed');
    expect(rankFor({ level: 2, score: 500, prevented: 5, cleared: 1 })).toBe('negotiator');
    expect(rankFor({ level: 4, score: 900, prevented: 9, cleared: 3 })).toBe('watch');
    expect(rankFor({ level: 5, score: 2000, prevented: 20, cleared: 5 })).toBe('adult');
  });

  it('looks up a level spec and clamps out-of-range requests', () => {
    expect(levelSpec(2).level).toBe(2);
    expect(levelSpec(0).level).toBe(1);
    expect(levelSpec(99).level).toBe(5);
  });
});
