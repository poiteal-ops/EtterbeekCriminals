import { describe, expect, it } from 'vitest';
import { HOUSE_OBJECTS, TILE_SIZE, chooseTarget, chooseWanderCell, findFleeRoute, findRoute, isWalkable, type Cell } from './house';
import * as house from './house';

describe('house routes', () => {
  it('passes through a doorway rather than a wall between rooms', () => {
    const route = findRoute({ x: 2, y: 2 }, { x: 8, y: 2 });
    expect(route).not.toBeNull();
    expect(route).toContainEqual({ x: 5, y: 2 });
    expect(route?.every((cell: Cell) => isWalkable(cell))).toBe(true);
  });

  it('keeps every target reachable from the player start', () => {
    for (const object of HOUSE_OBJECTS) {
      expect(findRoute({ x: 3, y: 7 }, object.cell), object.id).not.toBeNull();
    }
  });

  it('rejects walls and cells outside the house', () => {
    expect(isWalkable({ x: 5, y: 3 })).toBe(false);
    expect(isWalkable({ x: -1, y: 2 })).toBe(false);
  });

  it('chooses an intact target other than the previous one when possible', () => {
    const chosen = chooseTarget(new Set(['sofa', 'cushion']), 'remote', () => 0);
    expect(chosen?.id).toBe('food');
  });

  it('chooses a walkable neighbouring cell when the dog wanders beside a wall', () => {
    expect(chooseWanderCell({ x: 4, y: 3 }, () => 0)).toEqual({ x: 4, y: 4 });
  });

  it('routes a caught dog away from the player before the next chase', () => {
    const player = { x: 3, y: 7 };
    const route = findFleeRoute({ x: 3, y: 8 }, player);
    expect(route.length).toBeGreaterThan(1);
    expect(route.every(cell => isWalkable(cell))).toBe(true);
    const destination = route.at(-1)!;
    expect(Math.hypot(destination.x - player.x, destination.y - player.y)).toBeGreaterThan(6);
  });

  it('avoids Pikette\'s guarded object cell while still finding another route', () => {
    const blocked = { x: 2, y: 2 };
    expect(findRoute({ x: 2, y: 4 }, blocked, blocked)).toBeNull();
    const route = findRoute({ x: 2, y: 4 }, { x: 3, y: 3 }, blocked);
    expect(route).not.toBeNull();
    expect(route).not.toContainEqual(blocked);
    expect(isWalkable(blocked, blocked)).toBe(false);
  });

  it('allows a fart only near the dog and far from its current target', () => {
    const allowed = Reflect.get(house, 'isFartOpportunity') as ((player: { x: number; y: number }, dog: { x: number; y: number }, target: { x: number; y: number }) => boolean) | undefined;
    expect(allowed?.({ x: 100, y: 100 }, { x: 130, y: 100 }, { x: 250, y: 100 })).toBe(true);
    expect(allowed?.({ x: 100, y: 100 }, { x: 145, y: 100 }, { x: 250, y: 100 })).toBe(false);
    expect(allowed?.({ x: 100, y: 100 }, { x: 130, y: 100 }, { x: 170, y: 100 })).toBe(false);
  });

  it('detects an actor inside Pikette\'s three-square scare range', () => {
    const near = { x: 100, y: 100 };
    expect(house.isInPiketteScareRange(near, { x: 100 + TILE_SIZE * 3 - 1, y: 100 })).toBe(true);
    expect(house.isInPiketteScareRange(near, { x: 100 + TILE_SIZE * 3, y: 100 })).toBe(false);
    expect(house.isInPiketteScareRange(near, { x: 100 + TILE_SIZE * 2, y: 100 + TILE_SIZE * 2 })).toBe(true);
  });

  it('only sends Pikette to the active target object, never another one', () => {
    for (const object of HOUSE_OBJECTS) {
      const visit = house.choosePiketteVisit({ x: 8, y: 3 }, { x: 3, y: 7 }, new Set(), () => 0, 112, undefined, object.id);
      if (visit) expect(visit.object.id).toBe(object.id);
    }
    expect(house.choosePiketteVisit({ x: 8, y: 3 }, { x: 3, y: 7 }, new Set(), () => 0, 112, undefined, null)).toBeNull();
    expect(house.choosePiketteVisit({ x: 8, y: 3 }, { x: 3, y: 7 }, new Set(['sofa']), () => 0, 112, undefined, 'sofa')).toBeNull();
  });

  it('plans a visible edge route that reaches an unoccupied object before the dog', () => {
    const choose = (dog: Cell, player: Cell, damaged: ReadonlySet<string>, random: () => number) =>
      house.choosePiketteVisit(dog, player, damaged, random, 112, undefined, 'shoe');
    const visit = choose({ x: 8, y: 3 }, { x: 3, y: 7 }, new Set(), () => 0);
    expect(visit).toBeTruthy();
    if (!visit) throw new Error('Expected an eligible Pikette visit');
    expect(visit.route[0]).toEqual(visit?.entry);
    expect(visit?.route.at(-1)).toEqual(visit?.object.cell);
    expect(visit?.catSeconds).toBeLessThan(visit!.dogSeconds);
    expect(visit.offboard.x < 0 || visit.offboard.x > 480 || visit.offboard.y < 0 || visit.offboard.y > 480).toBe(true);
    expect(visit?.object.cell).not.toEqual({ x: 8, y: 3 });
    expect(visit?.object.cell).not.toEqual({ x: 3, y: 7 });
  });
});
