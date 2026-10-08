import type { Cell, HouseObject } from './house';

export const LEVEL_SECONDS = 90;
export const TOTAL_LEVELS = 5;

export type MapLabelKey = 'lounge' | 'kitchen' | 'hall' | 'bedroom' | 'kitchenIsland' | 'hallway' | 'ringHall' | 'corridor';
export interface MapLabel { key: MapLabelKey; x: number; y: number }

/** One playable floor plan. `rows` is 12 strings of 12 characters: `#` wall, `.` floor. */
export interface LevelMap {
  id: string;
  name: string;
  rows: readonly string[];
  objects: readonly HouseObject[];
  labels: readonly MapLabel[];
  playerStart: Cell;
  dogStart: Cell;
}

/** Speed multipliers applied to the base speeds in game-runtime.ts. */
export interface LevelSpec {
  level: number;
  map: LevelMap;
  dogFactor: number;
  playerFactor: number;
}

type ObjectId = 'sofa' | 'cushion' | 'remote' | 'food' | 'bin' | 'plant' | 'shoe' | 'box' | 'slipper' | 'laundry';

const OBJECT_TRAITS: readonly { id: ObjectId; value: number; kind: HouseObject['kind'] }[] = [
  { id: 'sofa', value: 145, kind: 'seat' },
  { id: 'cushion', value: 19, kind: 'small' },
  { id: 'remote', value: 28, kind: 'small' },
  { id: 'food', value: 14, kind: 'food' },
  { id: 'bin', value: 36, kind: 'container' },
  { id: 'plant', value: 24, kind: 'plant' },
  { id: 'shoe', value: 42, kind: 'small' },
  { id: 'box', value: 8, kind: 'container' },
  { id: 'slipper', value: 12, kind: 'small' },
  { id: 'laundry', value: 16, kind: 'container' },
];

function place(cells: Record<ObjectId, readonly [number, number]>): HouseObject[] {
  return OBJECT_TRAITS.map(({ id, value, kind }) => ({ id, value, kind, cell: { x: cells[id][0], y: cells[id][1] } }));
}

const APARTMENT: LevelMap = {
  id: 'apartment',
  name: 'THE APARTMENT',
  rows: [
    '############',
    '#....#.....#',
    '#..........#',
    '#....#.....#',
    '#....#.....#',
    '##.#####.###',
    '#....#.....#',
    '#....#.....#',
    '#..........#',
    '#....#.....#',
    '#....#.....#',
    '############',
  ],
  objects: place({
    sofa: [2, 2], cushion: [3, 3], remote: [2, 4], food: [8, 2], bin: [9, 3],
    plant: [8, 4], shoe: [2, 8], box: [3, 9], slipper: [8, 8], laundry: [9, 9],
  }),
  labels: [
    { key: 'lounge', x: 120, y: 54 }, { key: 'kitchen', x: 360, y: 54 },
    { key: 'hall', x: 120, y: 260 }, { key: 'bedroom', x: 360, y: 260 },
  ],
  playerStart: { x: 3, y: 7 },
  dogStart: { x: 8, y: 3 },
};

const LOFT: LevelMap = {
  id: 'loft',
  name: 'THE OPEN-PLAN LOFT',
  rows: [
    '############',
    '#..........#',
    '#..........#',
    '#..........#',
    '#...####...#',
    '#...####...#',
    '#..........#',
    '#..........#',
    '#.#......#.#',
    '#..........#',
    '#..........#',
    '############',
  ],
  objects: place({
    sofa: [2, 2], cushion: [9, 2], remote: [1, 6], food: [6, 3], bin: [10, 5],
    plant: [6, 7], shoe: [3, 9], box: [9, 9], slipper: [6, 10], laundry: [10, 8],
  }),
  labels: [{ key: 'kitchenIsland', x: 240, y: 200 }],
  playerStart: { x: 3, y: 7 },
  dogStart: { x: 8, y: 3 },
};

const CORRIDOR: LevelMap = {
  id: 'corridor',
  name: 'THE LONG CORRIDOR FLAT',
  rows: [
    '############',
    '#...#..#...#',
    '#...#..#...#',
    '#...#..#...#',
    '##.##.###.##',
    '#..........#',
    '##.##.###.##',
    '#...#..#...#',
    '#...#..#...#',
    '#...#..#...#',
    '#...#..#...#',
    '############',
  ],
  objects: place({
    sofa: [2, 2], cushion: [1, 8], remote: [6, 3], food: [9, 2], bin: [10, 3],
    plant: [6, 5], shoe: [2, 9], box: [5, 8], slipper: [9, 9], laundry: [10, 7],
  }),
  labels: [{ key: 'hallway', x: 180, y: 220 }],
  playerStart: { x: 2, y: 5 },
  dogStart: { x: 9, y: 5 },
};

const RING: LevelMap = {
  id: 'ring',
  name: 'THE RING FLAT',
  rows: [
    '############',
    '#..........#',
    '#.########.#',
    '#....#...#.#',
    '#.#..#.....#',
    '#.########.#',
    '#.#..#...#.#',
    '#....#...#.#',
    '#.#..#...#.#',
    '#.#####.##.#',
    '#..........#',
    '############',
  ],
  objects: place({
    sofa: [7, 7], cushion: [3, 3], remote: [4, 4], food: [7, 3], bin: [6, 4],
    plant: [1, 5], shoe: [3, 7], box: [4, 8], slipper: [10, 6], laundry: [6, 10],
  }),
  labels: [{ key: 'ringHall', x: 240, y: 54 }],
  playerStart: { x: 2, y: 10 },
  dogStart: { x: 9, y: 1 },
};

const MAZE: LevelMap = {
  id: 'maze',
  name: 'THE MAZE FLAT',
  rows: [
    '############',
    '#....#.....#',
    '#....#.....#',
    '##.######.##',
    '#..........#',
    '#.#.....#..#',
    '#####.####.#',
    '#..........#',
    '#.####.###.#',
    '#.####.#####',
    '#..........#',
    '############',
  ],
  objects: place({
    sofa: [3, 2], cushion: [9, 1], remote: [1, 5], food: [10, 8], bin: [6, 8],
    plant: [7, 5], shoe: [2, 10], box: [9, 10], slipper: [4, 7], laundry: [8, 2],
  }),
  labels: [{ key: 'corridor', x: 240, y: 180 }],
  playerStart: { x: 5, y: 7 },
  dogStart: { x: 6, y: 4 },
};

export const LEVEL_MAPS: readonly LevelMap[] = [APARTMENT, LOFT, CORRIDOR, RING, MAZE];

/** Criminal gets faster and the player slower every level. */
export const LEVELS: readonly LevelSpec[] = [
  { level: 1, map: LEVEL_MAPS[0], dogFactor: 1.0, playerFactor: 1.0 },
  { level: 2, map: LEVEL_MAPS[1], dogFactor: 1.1, playerFactor: 0.95 },
  { level: 3, map: LEVEL_MAPS[2], dogFactor: 1.2, playerFactor: 0.9 },
  { level: 4, map: LEVEL_MAPS[3], dogFactor: 1.3, playerFactor: 0.85 },
  { level: 5, map: LEVEL_MAPS[4], dogFactor: 1.4, playerFactor: 0.8 },
];
