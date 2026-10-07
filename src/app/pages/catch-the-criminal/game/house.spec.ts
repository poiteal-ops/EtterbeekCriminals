import { describe, expect, it } from 'vitest';
import { HOUSE_OBJECTS, chooseTarget, chooseWanderCell, findFleeRoute, findRoute, isWalkable, type Cell } from './house';

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
    expect(route.every(isWalkable)).toBe(true);
    const destination = route.at(-1)!;
    expect(Math.hypot(destination.x - player.x, destination.y - player.y)).toBeGreaterThan(6);
  });
});
