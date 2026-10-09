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
    expect(game.snapshot().secondsLeft).toBe(90);
    game.setPaused(false);
    game.tick(90);
    expect(game.snapshot().secondsLeft).toBe(0);
    expect(game.snapshot().ended).toBe(true);
  });

  it('uses a configurable level length', () => {
    const game = new GameRules(30);
    expect(game.snapshot().secondsLeft).toBe(30);
    game.tick(30);
    expect(game.snapshot().ended).toBe(true);
  });

  it('spends STOP and TREAT once per patrol and freezes their timers while paused', () => {
    const game = new GameRules();
    expect(game.snapshot()).toMatchObject({ stopAvailable: true, treatAvailable: true });
    expect(game.useStop()).toBe(true);
    expect(game.useStop()).toBe(false);
    game.tick(2);
    expect(game.snapshot().stopSecondsLeft).toBe(3);
    game.setPaused(true);
    game.tick(10);
    expect(game.snapshot().stopSecondsLeft).toBe(3);
    game.setPaused(false);
    game.tick(3);
    expect(game.useTreat()).toBe(true);
    expect(game.useTreat()).toBe(false);
    game.beginTreatStun();
    game.tick(3);
    expect(game.snapshot()).toMatchObject({ stopAvailable: false, treatAvailable: false, treatStunSecondsLeft: 0 });
    expect(new GameRules().snapshot()).toMatchObject({ stopAvailable: true, treatAvailable: true });
  });

  it('lets the player use STOP while a TREAT bone is on the floor or being eaten', () => {
    const game = new GameRules();
    expect(game.useTreat()).toBe(true);
    expect(game.snapshot().treatLuring).toBe(true);
    expect(game.useStop()).toBe(true);
    game.tick(5);
    game.beginTreatStun();
    expect(game.snapshot().treatStunSecondsLeft).toBe(3);
  });

  it('never touches STOP, TREAT or object damage when a fart happens', () => {
    const game = new GameRules();
    const before = game.snapshot();
    expect(game.triggerFart()).toBe(true);
    expect(game.snapshot()).toEqual({ ...before, fartSecondsLeft: 3 });
  });

  it('scrambles both actors for three seconds when Pikette scares them, then rests before the next scare', () => {
    const game = new GameRules();
    expect(game.triggerPiketteScare()).toBe(true);
    expect(game.triggerPiketteScare()).toBe(false);
    game.tick(3);
    expect(game.snapshot().scrambleSecondsLeft).toBe(0);
    expect(game.triggerPiketteScare()).toBe(false);
    game.tick(2);
    expect(game.triggerPiketteScare()).toBe(true);
    const paused = new GameRules();
    paused.setPaused(true);
    expect(paused.triggerPiketteScare()).toBe(false);
  });

  it('limits a fart to three active seconds and guards a Pikette object for five', () => {
    const game = new GameRules();
    expect(game.triggerFart()).toBe(true);
    expect(game.triggerFart()).toBe(false);
    game.startPiketteGuard('shoe');
    game.tick(3);
    expect(game.snapshot()).toMatchObject({ fartSecondsLeft: 0, piketteSecondsLeft: 2, piketteObjectId: 'shoe' });
    game.tick(2);
    expect(game.snapshot()).toMatchObject({ piketteSecondsLeft: 0, piketteObjectId: null });
    expect(game.triggerFart()).toBe(false);
    game.tick(7);
    expect(game.triggerFart()).toBe(true);
  });
});
