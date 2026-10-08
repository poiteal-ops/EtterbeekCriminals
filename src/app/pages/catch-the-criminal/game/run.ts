import { LEVELS, TOTAL_LEVELS } from './levels';
import type { GameSnapshot } from './rules';

export const MAX_DAMAGE = 3;

export type RunStatus = 'next' | 'complete' | 'failed';
export type RankKey = 'insurance' | 'overwhelmed' | 'negotiator' | 'watch' | 'adult';

/** Totals carried between levels. `level` is the level being played (or last played). */
export interface RunState {
  level: number;
  score: number;
  prevented: number;
  cleared: number;
}

export interface LevelResult {
  run: RunState;
  status: RunStatus;
  levelScore: number;
  bonus: number;
}

export function newRun(): RunState {
  return { level: 1, score: 0, prevented: 0, cleared: 0 };
}

export function levelClearBonus(level: number, intactObjects: number): number {
  return 50 * level + 10 * Math.max(0, intactObjects);
}

/** A level is passed by surviving its timer with fewer than three damaged objects. */
export function levelPassed(snapshot: GameSnapshot): boolean {
  return snapshot.damaged < MAX_DAMAGE;
}

/** Folds a finished level into the run. Does not mutate the input run. */
export function finishLevel(run: RunState, snapshot: GameSnapshot, objectCount = 10): LevelResult {
  const passed = levelPassed(snapshot);
  const bonus = passed ? levelClearBonus(run.level, objectCount - snapshot.damaged) : 0;
  const levelScore = snapshot.score + bonus;
  const updated: RunState = {
    level: run.level,
    score: run.score + levelScore,
    prevented: run.prevented + snapshot.prevented,
    cleared: run.cleared + (passed ? 1 : 0),
  };
  const status: RunStatus = !passed ? 'failed' : run.level >= TOTAL_LEVELS ? 'complete' : 'next';
  return { run: updated, status, levelScore, bonus };
}

export function nextLevel(run: RunState): RunState {
  return { ...run, level: Math.min(TOTAL_LEVELS, run.level + 1) };
}

export function rankFor(run: RunState): RankKey {
  if (run.cleared >= TOTAL_LEVELS) return 'adult';
  if (run.cleared >= 3) return 'watch';
  if (run.cleared >= 1) return 'negotiator';
  return run.score >= 150 ? 'overwhelmed' : 'insurance';
}

export function levelSpec(level: number) {
  return LEVELS[Math.min(LEVELS.length, Math.max(1, Math.floor(level))) - 1];
}
