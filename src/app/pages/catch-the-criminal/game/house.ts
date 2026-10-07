export interface Cell { x: number; y: number }
export interface HouseObject {
  id: string;
  cell: Cell;
  value: number;
  kind: 'seat' | 'small' | 'food' | 'plant' | 'container';
}

export const GRID_SIZE = 12;
export const TILE_SIZE = 40;
export const WORLD_SIZE = GRID_SIZE * TILE_SIZE;

export const HOUSE_OBJECTS: readonly HouseObject[] = [
  { id: 'sofa', cell: { x: 2, y: 2 }, value: 145, kind: 'seat' },
  { id: 'cushion', cell: { x: 3, y: 3 }, value: 19, kind: 'small' },
  { id: 'remote', cell: { x: 2, y: 4 }, value: 28, kind: 'small' },
  { id: 'food', cell: { x: 8, y: 2 }, value: 14, kind: 'food' },
  { id: 'bin', cell: { x: 9, y: 3 }, value: 36, kind: 'container' },
  { id: 'plant', cell: { x: 8, y: 4 }, value: 24, kind: 'plant' },
  { id: 'shoe', cell: { x: 2, y: 8 }, value: 42, kind: 'small' },
  { id: 'box', cell: { x: 3, y: 9 }, value: 8, kind: 'container' },
  { id: 'slipper', cell: { x: 8, y: 8 }, value: 12, kind: 'small' },
  { id: 'laundry', cell: { x: 9, y: 9 }, value: 16, kind: 'container' },
];

export function chooseTarget(
  damagedIds: ReadonlySet<string>,
  previousId: string | null,
  random: () => number = Math.random,
): HouseObject | null {
  const intact = HOUSE_OBJECTS.filter((object) => !damagedIds.has(object.id));
  if (!intact.length) return null;
  const alternatives = intact.filter((object) => object.id !== previousId);
  const candidates = alternatives.length ? alternatives : intact;
  const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)));
  return candidates[index];
}

export function chooseWanderCell(start: Cell, random: () => number = Math.random): Cell {
  const neighbours = [
    { x: start.x + 1, y: start.y }, { x: start.x, y: start.y + 1 },
    { x: start.x - 1, y: start.y }, { x: start.x, y: start.y - 1 },
  ].filter(isWalkable);
  if (!neighbours.length) return start;
  const index = Math.min(neighbours.length - 1, Math.max(0, Math.floor(random() * neighbours.length)));
  return neighbours[index];
}

export function isWalkable(cell: Cell): boolean {
  const { x, y } = cell;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x <= 0 || y <= 0 || x >= GRID_SIZE - 1 || y >= GRID_SIZE - 1) return false;
  if (x === 5 && y !== 2 && y !== 8) return false;
  if (y === 5 && x !== 2 && x !== 8) return false;
  return true;
}

export function cellCenter(cell: Cell): { x: number; y: number } {
  return { x: (cell.x + 0.5) * TILE_SIZE, y: (cell.y + 0.5) * TILE_SIZE };
}

export function pointCell(x: number, y: number): Cell {
  return { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) };
}

export function findRoute(start: Cell, goal: Cell): Cell[] | null {
  if (!isWalkable(start) || !isWalkable(goal)) return null;
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
      if (isWalkable(next) && !previous.has(nextKey)) {
        previous.set(nextKey, current);
        queue.push(next);
      }
    }
  }
  return null;
}

export function findFleeRoute(start: Cell, player: Cell): Cell[] {
  const candidates: Cell[] = [];
  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      const cell = { x, y };
      if (isWalkable(cell)) candidates.push(cell);
    }
  }
  candidates.sort((a, b) =>
    ((b.x - player.x) ** 2 + (b.y - player.y) ** 2) -
    ((a.x - player.x) ** 2 + (a.y - player.y) ** 2));
  for (const candidate of candidates) {
    const route = findRoute(start, candidate);
    if (route) return route;
  }
  return [start];
}
