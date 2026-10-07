import Phaser from 'phaser';

import { GameRules, type GameSnapshot } from './rules';
import {
  GRID_SIZE, HOUSE_OBJECTS, TILE_SIZE, WORLD_SIZE, cellCenter, chooseTarget, chooseWanderCell,
  findFleeRoute, findRoute, isWalkable, pointCell, type Cell, type HouseObject,
} from './house';

export type GameEvent = { kind: 'target' | 'caught' | 'damage'; objectId?: string };
export interface Direction { x: number; y: number }
export interface GameCallbacks {
  direction: () => Direction;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onEvent: (event: GameEvent) => void;
  onEnd: (snapshot: GameSnapshot) => void;
  reducedMotion: boolean;
}
export interface GameHandle {
  setPaused: (paused: boolean) => void;
  setSound: (enabled: boolean, volume: number) => void;
  destroy: () => void;
}

type DogMode = 'wander' | 'run' | 'destroy' | 'recover' | 'finished';

class PatrolScene extends Phaser.Scene {
  private readonly rules = new GameRules();
  private player!: Phaser.GameObjects.Container;
  private dog!: Phaser.GameObjects.Container;
  private readonly items = new Map<string, { marker: Phaser.GameObjects.Rectangle; body: Phaser.GameObjects.Container }>();
  private playerPosition = cellCenter({ x: 3, y: 7 });
  private dogPosition = cellCenter({ x: 8, y: 3 });
  private mode: DogMode = 'wander';
  private modeTime = 1.5;
  private route: Cell[] = [];
  private fleeRoute: Cell[] = [];
  private wanderGoal: Cell | null = null;
  private target: HouseObject | null = null;
  private previousTargetId: string | null = null;
  private targetElapsed = 0;
  private lastShownSecond = 180;
  private endedNotified = false;

  constructor(private readonly callbacks: GameCallbacks, private readonly playTone: (kind: GameEvent['kind']) => void) {
    super('patrol');
  }

  preload(): void {
    this.load.svg('player', '/assets/game/icons/player.svg', { width: 96, height: 96 });
    this.load.svg('criminal', '/assets/game/icons/criminal.svg', { width: 96, height: 96 });
    for (const object of HOUSE_OBJECTS) {
      this.load.svg(`object-${object.id}`, `/assets/game/icons/${object.id}.svg`, { width: 96, height: 96 });
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#111111');
    this.drawHouse();
    this.drawObjects();
    this.player = this.makePlayer();
    this.dog = this.makeDog();
    this.callbacks.onSnapshot(this.rules.snapshot());
  }

  private drawHouse(): void {
    const graphics = this.add.graphics();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const walkable = isWalkable({ x, y });
        const color = walkable ? ((x + y) % 2 ? 0x202020 : 0x252525) : 0x080808;
        graphics.fillStyle(color);
        graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (walkable) {
          graphics.lineStyle(1, 0x303030, 0.55);
          graphics.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    graphics.lineStyle(3, 0x777773);
    graphics.strokeRect(TILE_SIZE, TILE_SIZE, WORLD_SIZE - TILE_SIZE * 2, WORLD_SIZE - TILE_SIZE * 2);
    for (const [label, x, y] of [
      ['LOUNGE', 120, 54], ['KITCHEN', 360, 54], ['HALL', 120, 260], ['BEDROOM', 360, 260],
    ] as const) {
      this.add.text(x, y, label, { fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#999994' })
        .setOrigin(0.5).setDepth(1);
    }
  }

  private drawObjects(): void {
    for (const object of HOUSE_OBJECTS) {
      const { x, y } = cellCenter(object.cell);
      const marker = this.add.rectangle(x, y, 39, 39, 0x000000, 0).setStrokeStyle(2, 0x676763);
      const icon = this.add.image(0, 0, `object-${object.id}`).setDisplaySize(34, 34);
      const body = this.add.container(x, y, [icon]);
      this.items.set(object.id, { marker, body });
    }
  }

  private makePlayer(): Phaser.GameObjects.Container {
    const icon = this.add.image(0, 0, 'player').setDisplaySize(38, 38);
    return this.add.container(this.playerPosition.x, this.playerPosition.y, [icon]).setDepth(5);
  }

  private makeDog(): Phaser.GameObjects.Container {
    const icon = this.add.image(0, 0, 'criminal').setDisplaySize(40, 40);
    return this.add.container(this.dogPosition.x, this.dogPosition.y, [icon]).setDepth(6);
  }

  setPaused(paused: boolean): void {
    this.rules.setPaused(paused);
    this.callbacks.onSnapshot(this.rules.snapshot());
  }

  override update(_time: number, delta: number): void {
    const before = this.rules.snapshot();
    if (before.paused || before.ended) return;
    const seconds = Math.min(delta, 50) / 1000;
    this.rules.tick(delta / 1000);
    if (this.rules.snapshot().ended) {
      this.finish();
      return;
    }
    this.movePlayer(seconds);
    this.moveDog(seconds);
    if ((this.mode === 'run' || this.mode === 'destroy') &&
      Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, this.dogPosition.x, this.dogPosition.y) < 27) {
      this.catchDog();
    }
    const now = this.rules.snapshot();
    if (now.secondsLeft !== this.lastShownSecond) {
      this.lastShownSecond = now.secondsLeft;
      this.callbacks.onSnapshot(now);
    }
  }

  private movePlayer(seconds: number): void {
    const direction = this.callbacks.direction();
    const length = Math.hypot(direction.x, direction.y);
    if (!length) return;
    const speed = 155 / length;
    const stepX = direction.x * speed * seconds;
    const stepY = direction.y * speed * seconds;
    const nextX = this.playerPosition.x + stepX;
    const nextY = this.playerPosition.y + stepY;
    if (this.canStand(nextX, this.playerPosition.y)) this.playerPosition.x = nextX;
    if (this.canStand(this.playerPosition.x, nextY)) this.playerPosition.y = nextY;
    this.player.setPosition(this.playerPosition.x, this.playerPosition.y);
  }

  private canStand(x: number, y: number): boolean {
    const radius = 12;
    return [
      pointCell(x - radius, y - radius), pointCell(x + radius, y - radius),
      pointCell(x - radius, y + radius), pointCell(x + radius, y + radius),
    ].every(isWalkable);
  }

  private moveDog(seconds: number): void {
    if (this.mode === 'finished') return;
    if (this.mode === 'wander' || this.mode === 'recover') {
      this.modeTime -= seconds;
      if (this.mode === 'recover' && this.fleeRoute.length) {
        const destination = cellCenter(this.fleeRoute[0]);
        const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
        const amount = Math.min(distance, 190 * seconds);
        if (distance > 0) {
          this.dogPosition.x += (destination.x - this.dogPosition.x) / distance * amount;
          this.dogPosition.y += (destination.y - this.dogPosition.y) / distance * amount;
          this.dog.setPosition(this.dogPosition.x, this.dogPosition.y);
        }
        if (distance <= amount + 0.1) this.fleeRoute.shift();
      }
      if (this.mode === 'wander') {
        this.wanderGoal ??= chooseWanderCell(pointCell(this.dogPosition.x, this.dogPosition.y));
        const destination = cellCenter(this.wanderGoal);
        const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
        const amount = Math.min(distance, 48 * seconds);
        if (distance > 0) {
          this.dogPosition.x += (destination.x - this.dogPosition.x) / distance * amount;
          this.dogPosition.y += (destination.y - this.dogPosition.y) / distance * amount;
          this.dog.setPosition(this.dogPosition.x, this.dogPosition.y);
        }
        if (distance <= amount + 0.1) this.wanderGoal = null;
        if (!this.callbacks.reducedMotion) this.dog.angle = Math.sin(this.time.now / 110) * 4;
      }
      if (this.modeTime <= 0 && (this.mode === 'wander' || this.fleeRoute.length === 0)) this.selectTarget();
      return;
    }
    this.targetElapsed += seconds;
    if (this.mode === 'run') {
      const next = this.route[0];
      if (!next) {
        this.mode = 'destroy';
        this.modeTime = this.destructionTime();
        return;
      }
      const destination = cellCenter(next);
      const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
      const amount = Math.min(distance, this.dogSpeed() * seconds);
      if (distance > 0) {
        this.dogPosition.x += (destination.x - this.dogPosition.x) / distance * amount;
        this.dogPosition.y += (destination.y - this.dogPosition.y) / distance * amount;
      }
      this.dog.setPosition(this.dogPosition.x, this.dogPosition.y);
      this.dog.angle = Math.sin(this.time.now / 65) * (this.callbacks.reducedMotion ? 1 : 5);
      if (distance <= amount + 0.1) this.route.shift();
      return;
    }
    this.modeTime -= seconds;
    if (this.target) {
      const item = this.items.get(this.target.id);
      if (item && !this.callbacks.reducedMotion) item.body.angle = Math.sin(this.time.now / 75) * 6;
    }
    if (this.modeTime <= 0) this.damageObject();
  }

  private selectTarget(): void {
    const damaged = new Set(this.rules.snapshot().damagedIds);
    const candidate = chooseTarget(damaged, this.previousTargetId);
    if (!candidate) {
      this.finish();
      return;
    }
    const route = findRoute(pointCell(this.dogPosition.x, this.dogPosition.y), candidate.cell);
    if (!route) {
      this.mode = 'wander';
      this.modeTime = 0.5;
      return;
    }
    this.target = candidate;
    this.wanderGoal = null;
    this.previousTargetId = candidate.id;
    this.route = route;
    this.targetElapsed = 0;
    this.mode = 'run';
    this.items.get(candidate.id)?.marker.setStrokeStyle(4, 0xe0645b);
    this.callbacks.onEvent({ kind: 'target', objectId: candidate.id });
    this.playTone('target');
  }

  private catchDog(): void {
    this.rules.catchDog(Math.max(0, 3000 - this.targetElapsed * 500));
    this.clearTarget();
    this.mode = 'recover';
    this.fleeRoute = findFleeRoute(pointCell(this.dogPosition.x, this.dogPosition.y), pointCell(this.playerPosition.x, this.playerPosition.y));
    this.modeTime = Math.max(1.6, this.fleeRoute.length * TILE_SIZE / 190);
    this.dog.angle = 0;
    this.callbacks.onEvent({ kind: 'caught' });
    this.callbacks.onSnapshot(this.rules.snapshot());
    this.playTone('caught');
  }

  private damageObject(): void {
    const object = this.target;
    if (!object) return;
    this.rules.damage(object.id);
    const item = this.items.get(object.id);
    item?.body.setAlpha(0.35).setAngle(18);
    item?.marker.setStrokeStyle(2, 0x666666);
    this.callbacks.onEvent({ kind: 'damage', objectId: object.id });
    this.callbacks.onSnapshot(this.rules.snapshot());
    this.playTone('damage');
    this.clearTarget();
    if (this.rules.snapshot().ended) this.finish();
    else {
      this.mode = 'wander';
      this.modeTime = 1.2;
      this.wanderGoal = null;
    }
  }

  private clearTarget(): void {
    if (this.target) {
      const item = this.items.get(this.target.id);
      if (item && !this.rules.snapshot().damagedIds.includes(this.target.id)) item.marker.setStrokeStyle(2, 0x676763);
      if (item && !this.rules.snapshot().damagedIds.includes(this.target.id)) item.body.setAngle(0);
    }
    this.target = null;
    this.route = [];
  }

  private dogSpeed(): number { return 112 + (180 - this.rules.snapshot().secondsLeft) * 0.16; }
  private destructionTime(): number { return 3.6 - (180 - this.rules.snapshot().secondsLeft) * 0.004; }

  private finish(): void {
    if (this.endedNotified) return;
    this.endedNotified = true;
    this.mode = 'finished';
    this.callbacks.onSnapshot(this.rules.snapshot());
    this.callbacks.onEnd(this.rules.snapshot());
  }
}

export function mountGame(host: HTMLElement, callbacks: GameCallbacks): GameHandle {
  let enabled = false;
  let volume = 0.4;
  let audio: AudioContext | null = null;
  let musicBus: GainNode | null = null;
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicStep = 0;
  let paused = false;
  let ended = false;
  const melody = [659.25, 783.99, 880, 0, 783.99, 659.25, 587.33, 0,
    523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 0];
  const bass = [130.81, 146.83, 174.61, 130.81];

  const playSynthNote = (frequency: number, type: OscillatorType, duration: number, level: number) => {
    if (!audio || !musicBus || !frequency) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(musicBus);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + duration);
  };
  const playMusicStep = () => {
    playSynthNote(melody[musicStep % melody.length], 'square', 0.14, 0.12);
    if (musicStep % 4 === 0) playSynthNote(bass[Math.floor(musicStep / 4) % bass.length], 'triangle', 0.27, 0.08);
    musicStep++;
  };
  const syncMusic = () => {
    if (!audio) return;
    const shouldPlay = enabled && !paused && !ended;
    if (musicBus) musicBus.gain.setTargetAtTime(shouldPlay ? volume * 0.5 : 0, audio.currentTime, 0.01);
    if (!shouldPlay && musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    } else if (shouldPlay && !musicTimer) {
      playMusicStep();
      musicTimer = setInterval(playMusicStep, 160);
    }
  };
  const sound = (kind: GameEvent['kind']) => {
    if (!enabled) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = kind === 'caught' ? 660 : kind === 'damage' ? 180 : 390;
      gain.gain.setValueAtTime(Math.min(volume * 0.12, 0.12), audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.16);
    } catch {
      enabled = false;
    }
  };
  const scene = new PatrolScene({
    ...callbacks,
    onEnd: (snapshot) => {
      ended = true;
      syncMusic();
      callbacks.onEnd(snapshot);
    },
  }, sound);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: WORLD_SIZE,
    height: WORLD_SIZE,
    backgroundColor: '#111111',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WORLD_SIZE, height: WORLD_SIZE },
    scene,
  });
  return {
    setPaused: (nextPaused) => {
      paused = nextPaused;
      scene.setPaused(nextPaused);
      syncMusic();
    },
    setSound: (nextEnabled, nextVolume) => {
      enabled = nextEnabled;
      volume = Math.max(0, Math.min(1, nextVolume));
      if (enabled) {
        try {
          audio ??= new AudioContext();
          if (audio.state === 'suspended') void audio.resume();
          if (!musicBus) {
            musicBus = audio.createGain();
            musicBus.gain.value = 0;
            musicBus.connect(audio.destination);
          }
        } catch {
          enabled = false;
        }
      }
      syncMusic();
    },
    destroy: () => {
      ended = true;
      syncMusic();
      game.destroy(true);
      if (audio) void audio.close();
    },
  };
}
