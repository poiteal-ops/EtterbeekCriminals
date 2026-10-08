import { describe, expect, it } from 'vitest';

import { GRID_SIZE, TILE_SIZE, findRoute, isWalkable, type Cell } from './house';
import { EN_CONTENT } from '../../../i18n/content/en.content';
import { LEVELS, LEVEL_MAPS, TOTAL_LEVELS, type LevelMap } from './levels';

const key = (cell: Cell) => `${cell.x},${cell.y}`;

function floorCells(map: LevelMap): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) if (isWalkable({ x, y }, null, map)) cells.push({ x, y });
  }
  return cells;
}

describe('level maps', () => {
  it('provides five distinct maps and five levels', () => {
    expect(LEVEL_MAPS.length).toBe(TOTAL_LEVELS);
    expect(LEVELS.length).toBe(TOTAL_LEVELS);
    expect(new Set(LEVEL_MAPS.map((map) => map.rows.join('|'))).size).toBe(TOTAL_LEVELS);
    expect(new Set(LEVEL_MAPS.map((map) => map.id)).size).toBe(TOTAL_LEVELS);
    expect(LEVELS.map((spec) => spec.map)).toEqual([...LEVEL_MAPS]);
  });

  it('keeps map 1 identical to the original house rule', () => {
    const original = (x: number, y: number) => {
      if (x <= 0 || y <= 0 || x >= GRID_SIZE - 1 || y >= GRID_SIZE - 1) return false;
      if (x === 5 && y !== 2 && y !== 8) return false;
      if (y === 5 && x !== 2 && x !== 8) return false;
      return true;
    };
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) expect(isWalkable({ x, y }, null, LEVEL_MAPS[0]), `${x},${y}`).toBe(original(x, y));
    }
  });

  for (const map of LEVEL_MAPS) {
    describe(map.name, () => {
      it('is a 12 x 12 grid with a solid outer ring', () => {
        expect(map.rows.length).toBe(GRID_SIZE);
        for (const row of map.rows) expect(row).toMatch(/^[#.]{12}$/);
        expect(map.rows[0]).toBe('#'.repeat(GRID_SIZE));
        expect(map.rows[GRID_SIZE - 1]).toBe('#'.repeat(GRID_SIZE));
        for (const row of map.rows) expect(row[0] === '#' && row[GRID_SIZE - 1] === '#').toBe(true);
      });

      it('has one connected floor area', () => {
        const floor = floorCells(map);
        const reached = new Set<string>([key(floor[0])]);
        const queue = [floor[0]];
        for (let i = 0; i < queue.length; i++) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const next = { x: queue[i].x + dx, y: queue[i].y + dy };
            if (isWalkable(next, null, map) && !reached.has(key(next))) { reached.add(key(next)); queue.push(next); }
          }
        }
        expect(reached.size).toBe(floor.length);
      });

      it('places ten distinct objects on floor cells away from the starts', () => {
        expect(map.objects.length).toBe(10);
        expect(new Set(map.objects.map((object) => object.id)).size).toBe(10);
        expect(new Set(map.objects.map((object) => key(object.cell))).size).toBe(10);
        for (const object of map.objects) expect(isWalkable(object.cell, null, map), object.id).toBe(true);
        for (const start of [map.playerStart, map.dogStart]) {
          expect(isWalkable(start, null, map)).toBe(true);
          expect(map.objects.some((object) => key(object.cell) === key(start))).toBe(false);
        }
        expect(key(map.playerStart)).not.toBe(key(map.dogStart));
      });

      it('lets both starts reach every object', () => {
        for (const start of [map.playerStart, map.dogStart]) {
          for (const object of map.objects) expect(findRoute(start, object.cell, null, map), object.id).not.toBeNull();
        }
      });

      it('gives at least three objects a legal Pikette entrance', () => {
        const eligible = map.objects.filter((object) => [
          { x: object.cell.x, y: 1 }, { x: object.cell.x, y: GRID_SIZE - 2 },
          { x: 1, y: object.cell.y }, { x: GRID_SIZE - 2, y: object.cell.y },
        ].some((entry) => findRoute(entry, object.cell, null, map)));
        expect(eligible.length).toBeGreaterThanOrEqual(3);
      });

      it('keeps every label on the board', () => {
        for (const label of map.labels) {
          expect(label.x).toBeGreaterThan(0);
          expect(label.x).toBeLessThan(GRID_SIZE * TILE_SIZE);
          expect(label.y).toBeGreaterThan(0);
          expect(label.y).toBeLessThan(GRID_SIZE * TILE_SIZE);
        }
      });

      it('uses translatable game-copy keys for every visible room label', () => {
        const frenchLabels: Record<string, string> = {
          lounge: 'SALON', kitchen: 'CUISINE', hall: 'HALL', bedroom: 'CHAMBRE',
          kitchenIsland: 'ÎLOT DE CUISINE', hallway: 'COULOIR', ringHall: 'COULOIR CIRCULAIRE', corridor: 'COULOIR',
        };
        for (const label of map.labels) {
          expect(EN_CONTENT.game.mapLabels[label.key]).toBeTruthy();
          expect(frenchLabels[label.key]).toBeTruthy();
        }
      });
    });
  }
});

describe('difficulty table', () => {
  it('starts at the original speeds and raises the dog while slowing the player each level', () => {
    expect(LEVELS[0]).toMatchObject({ dogFactor: 1, playerFactor: 1 });
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].dogFactor).toBeGreaterThan(LEVELS[i - 1].dogFactor);
      expect(LEVELS[i].playerFactor).toBeLessThan(LEVELS[i - 1].playerFactor);
      expect(LEVELS[i].level).toBe(i + 1);
    }
  });

  it('keeps every object catchable: the player can reach a destroying dog before it ends', () => {
    // The dog destroys for ~3.6 s (shrinking slightly); the player must be able to cover the
    // distance to any object from the opposite start within that window plus a safety margin.
    for (const spec of LEVELS) {
      const playerSpeed = 155 * spec.playerFactor;
      const reachable = spec.map.objects.filter((object) => {
        const route = findRoute(spec.map.playerStart, object.cell, null, spec.map);
        return route !== null && route.length > 0;
      });
      expect(reachable.length).toBe(10);
      // Average route length from the player's start to objects must be coverable in under 12 s.
      const average = reachable
        .map((object) => (findRoute(spec.map.playerStart, object.cell, null, spec.map)!.length - 1) * TILE_SIZE / playerSpeed)
        .reduce((sum, seconds) => sum + seconds, 0) / reachable.length;
      expect(average, `level ${spec.level}`).toBeLessThan(12);
    }
  });
});
