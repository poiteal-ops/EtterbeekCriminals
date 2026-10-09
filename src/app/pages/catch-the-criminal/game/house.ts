import { LEVEL_MAPS, type LevelMap } from './levels';

export interface Cell { x: number; y: number }
export interface HouseObject {
  id: string;
  cell: Cell;
  value: number;
  kind: 'seat' | 'small' | 'food' | 'plant' | 'container';
}

export interface PiketteVisit {
  object: HouseObject;
  entry: Cell;
  offboard: { x: number; y: number };
  route: Cell[];
  catSeconds: number;
  dogSeconds: number;
}

export const GRID_SIZE = 12;
export const TILE_SIZE = 40;
export const WORLD_SIZE = GRID_SIZE * TILE_SIZE;

export const HOUSE_OBJECTS: readonly HouseObject[] = LEVEL_MAPS[0].objects;

export function chooseTarget(
  damagedIds: ReadonlySet<string>,
  previousId: string | null,
  random: () => number = Math.random,
  blockedId: string | null = null,
  map: LevelMap = LEVEL_MAPS[0],
): HouseObject | null {
  const intact = map.objects.filter((object) => !damagedIds.has(object.id) && object.id !== blockedId);
  if (!intact.length) return null;
  const alternatives = intact.filter((object) => object.id !== previousId);
  const candidates = alternatives.length ? alternatives : intact;
  const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)));
  return candidates[index];
}

export function chooseWanderCell(start: Cell, random: () => number = Math.random, blocked: Cell | null = null, map: LevelMap = LEVEL_MAPS[0]): Cell {
  const neighbours = [
    { x: start.x + 1, y: start.y }, { x: start.x, y: start.y + 1 },
    { x: start.x - 1, y: start.y }, { x: start.x, y: start.y - 1 },
  ].filter((cell) => isWalkable(cell, blocked, map));
  if (!neighbours.length) return start;
  const index = Math.min(neighbours.length - 1, Math.max(0, Math.floor(random() * neighbours.length)));
  return neighbours[index];
}

export function isWalkable(cell: Cell, blocked: Cell | null = null, map: LevelMap = LEVEL_MAPS[0]): boolean {
  const { x, y } = cell;
  if (blocked?.x === x && blocked.y === y) return false;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x <= 0 || y <= 0 || x >= GRID_SIZE - 1 || y >= GRID_SIZE - 1) return false;
  return map.rows[y]?.[x] === '.';
}

export function cellCenter(cell: Cell): { x: number; y: number } {
  return { x: (cell.x + 0.5) * TILE_SIZE, y: (cell.y + 0.5) * TILE_SIZE };
}

export function pointCell(x: number, y: number): Cell {
  return { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) };
}

export const PIKETTE_SCARE_RADIUS = TILE_SIZE * 3;

export function isInPiketteScareRange(pikette: { x: number; y: number }, actor: { x: number; y: number }): boolean {
  return Math.hypot(pikette.x - actor.x, pikette.y - actor.y) < PIKETTE_SCARE_RADIUS;
}

export function isFartOpportunity(player: { x: number; y: number }, dog: { x: number; y: number }, target: { x: number; y: number }): boolean {
  return Math.hypot(player.x - dog.x, player.y - dog.y) < TILE_SIZE &&
    Math.hypot(dog.x - target.x, dog.y - target.y) > TILE_SIZE * 2;
}

export function findRoute(start: Cell, goal: Cell, blocked: Cell | null = null, map: LevelMap = LEVEL_MAPS[0]): Cell[] | null {
  if (!isWalkable(start, blocked, map) || !isWalkable(goal, blocked, map)) return null;
  const key = (cell: Cell) => `${cell.x},${cell.y}`;
  const queue: Cell[] = [start];
  const previous = new Map<string, Cell | null>([[key(start), null]]);
  const steps: Cell[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (current.x === goal.x && current.y === goal.y) {
      const route: Cell[] = [];
      let cursor: Cell | null = current;
      while (cursor) {
        route.unshift(cursor);
        cursor = previous.get(key(cursor)) ?? null;
      }
      return route;
    }
    for (const step of steps) {
      const next = { x: current.x + step.x, y: current.y + step.y };
      const nextKey = key(next);
      if (isWalkable(next, blocked, map) && !previous.has(nextKey)) {
        previous.set(nextKey, current);
        queue.push(next);
      }
    }
  }
  return null;
}

export function findFleeRoute(start: Cell, player: Cell, blocked: Cell | null = null, map: LevelMap = LEVEL_MAPS[0]): Cell[] {
  const candidates: Cell[] = [];
  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      const cell = { x, y };
      if (isWalkable(cell, blocked, map)) candidates.push(cell);
    }
  }
  candidates.sort((a, b) =>
    ((b.x - player.x) ** 2 + (b.y - player.y) ** 2) -
    ((a.x - player.x) ** 2 + (a.y - player.y) ** 2));
  for (const candidate of candidates) {
    const route = findRoute(start, candidate, blocked, map);
    if (route) return route;
  }
  return [start];
}

export function choosePiketteVisit(
  dog: Cell,
  player: Cell,
  damagedIds: ReadonlySet<string>,
  random: () => number = Math.random,
  dogSpeed = 112,
  map: LevelMap = LEVEL_MAPS[0],
  activeObjectId: string | null = null,
): PiketteVisit | null {
  if (!activeObjectId) return null;
  const visits: PiketteVisit[] = [];
  for (const object of map.objects) {
    if (object.id !== activeObjectId || damagedIds.has(object.id) ||
      (object.cell.x === dog.x && object.cell.y === dog.y) ||
      (object.cell.x === player.x && object.cell.y === player.y)) continue;
    const dogRoute = findRoute(dog, object.cell, null, map);
    if (!dogRoute) continue;
    const dogSeconds = (dogRoute.length - 1) * TILE_SIZE / dogSpeed;
    const entrances = [
      { entry: { x: object.cell.x, y: 1 }, offboard: { x: (object.cell.x + 0.5) * TILE_SIZE, y: -20 } },
      { entry: { x: object.cell.x, y: GRID_SIZE - 2 }, offboard: { x: (object.cell.x + 0.5) * TILE_SIZE, y: WORLD_SIZE + 20 } },
      { entry: { x: 1, y: object.cell.y }, offboard: { x: -20, y: (object.cell.y + 0.5) * TILE_SIZE } },
      { entry: { x: GRID_SIZE - 2, y: object.cell.y }, offboard: { x: WORLD_SIZE + 20, y: (object.cell.y + 0.5) * TILE_SIZE } },
    ];
    for (const entrance of entrances) {
      const route = findRoute(entrance.entry, object.cell, null, map);
      if (!route) continue;
      const entryCenter = cellCenter(entrance.entry);
      const approach = Math.hypot(entryCenter.x - entrance.offboard.x, entryCenter.y - entrance.offboard.y);
      const catSeconds = (approach + (route.length - 1) * TILE_SIZE) / 300;
      if (catSeconds + 0.35 < dogSeconds) {
        visits.push({ object, ...entrance, route, catSeconds, dogSeconds });
      }
    }
  }
  if (!visits.length) return null;
  const index = Math.min(visits.length - 1, Math.max(0, Math.floor(random() * visits.length)));
  return visits[index];
}
