import Phaser from 'phaser';

import { GameRules, type GameSnapshot } from './rules';
import { LEVEL_SECONDS, type LevelMap, type LevelSpec } from './levels';
import {
  GRID_SIZE, TILE_SIZE, WORLD_SIZE, cellCenter, choosePiketteVisit, chooseTarget, chooseWanderCell,
  findFleeRoute, findRoute, isFartOpportunity, isWalkable, pointCell, type Cell, type HouseObject, type PiketteVisit,
} from './house';

export type GameEvent = { kind: 'target' | 'caught' | 'damage' | 'stop' | 'treat' | 'fart' | 'piketteEnter' | 'pikette' | 'piketteGone'; objectId?: string };
export interface Direction { x: number; y: number }
export interface GameCallbacks {
  direction: () => Direction;
  mapLabels: Record<string, string>;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onEvent: (event: GameEvent) => void;
  onEnd: (snapshot: GameSnapshot) => void;
  reducedMotion: boolean;
  random?: () => number;
}
export interface GameHandle {
  setPaused: (paused: boolean) => void;
  setSound: (enabled: boolean, volume: number) => void;
  useStop: () => boolean;
  useTreat: () => boolean;
  destroy: () => void;
}

type DogMode = 'wander' | 'run' | 'destroy' | 'recover' | 'lure' | 'stunned' | 'finished';
type PikettePhase = 'waiting' | 'entering' | 'guarding' | 'leaving';

class PatrolScene extends Phaser.Scene {
  private readonly rules: GameRules;
  private player!: Phaser.GameObjects.Container;
  private dog!: Phaser.GameObjects.Container;
  private readonly items = new Map<string, { marker: Phaser.GameObjects.Rectangle; body: Phaser.GameObjects.Container }>();
  private playerPosition: { x: number; y: number };
  private dogPosition: { x: number; y: number };
  private mode: DogMode = 'wander';
  private modeTime = 1.5;
  private route: Cell[] = [];
  private fleeRoute: Cell[] = [];
  private wanderGoal: Cell | null = null;
  private target: HouseObject | null = null;
  private previousTargetId: string | null = null;
  private targetElapsed = 0;
  private lastShownSecond = LEVEL_SECONDS;
  private endedNotified = false;
  private confusedTurnLeft = 0;
  private confusedDirection: Direction = { x: 0, y: 0 };
  private gasCloud: Phaser.GameObjects.Arc[] = [];
  private gasOrigin = { x: 0, y: 0 };
  private gasElapsed = 0;
  private pikettePhase: PikettePhase = 'waiting';
  private piketteNextIn = 20 + Math.random() * 15;
  private piketteVisit: PiketteVisit | null = null;
  private piketteSprite: Phaser.GameObjects.Image | null = null;
  private piketteWaypoints: { x: number; y: number }[] = [];
  private piketteWaitAtObject = 0;

  constructor(
    private readonly callbacks: GameCallbacks,
    private readonly playTone: (kind: GameEvent['kind']) => void,
    private readonly spec: LevelSpec,
  ) {
    super('patrol');
    this.rules = new GameRules(LEVEL_SECONDS);
    this.playerPosition = cellCenter(spec.map.playerStart);
    this.dogPosition = cellCenter(spec.map.dogStart);
  }

  private get map(): LevelMap { return this.spec.map; }

  preload(): void {
    this.load.svg('player', '/assets/game/icons/player.svg', { width: 96, height: 96 });
    this.load.svg('criminal', '/assets/game/icons/criminal.svg', { width: 96, height: 96 });
    this.load.svg('pikette', '/assets/game/icons/pikette.svg', { width: 96, height: 96 });
    for (const object of this.map.objects) {
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
        const walkable = isWalkable({ x, y }, null, this.map);
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
    for (const { key, x, y } of this.map.labels) {
      this.add.text(x, y, this.callbacks.mapLabels[key], { fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#999994' })
        .setOrigin(0.5).setDepth(1);
    }
  }

  private drawObjects(): void {
    for (const object of this.map.objects) {
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

  useStop(): boolean {
    if (!this.rules.useStop()) return false;
    this.callbacks.onEvent({ kind: 'stop' });
    this.callbacks.onSnapshot(this.rules.snapshot());
    return true;
  }

  useTreat(): boolean {
    if (!this.rules.useTreat()) return false;
    this.clearTarget();
    this.mode = 'lure';
    this.route = [];
    this.callbacks.onEvent({ kind: 'treat' });
    this.callbacks.onSnapshot(this.rules.snapshot());
    return true;
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
    this.updatePikette(seconds);
    if (this.mode === 'run' && this.target && this.rules.snapshot().stopSecondsLeft === 0 &&
      isFartOpportunity(this.playerPosition, this.dogPosition, cellCenter(this.target.cell)) && this.rules.triggerFart()) {
      this.startGasCloud();
      this.callbacks.onEvent({ kind: 'fart' });
      this.callbacks.onSnapshot(this.rules.snapshot());
      this.playTone('fart');
    }
    this.movePlayer(seconds);
    this.moveDog(seconds);
    this.updateGasCloud(seconds);
    if ((this.mode === 'run' || this.mode === 'destroy' || this.mode === 'stunned' || this.rules.snapshot().stopSecondsLeft > 0) &&
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
    const confused = this.rules.snapshot().fartSecondsLeft > 0;
    if (confused) {
      this.confusedTurnLeft -= seconds;
      if (this.confusedTurnLeft <= 0) {
        const options: Direction[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        this.confusedDirection = options[Math.floor((this.callbacks.random?.() ?? Math.random()) * options.length)] ?? options[0];
        this.confusedTurnLeft = 0.28;
      }
    } else {
      this.confusedTurnLeft = 0;
      this.player.angle = 0;
    }
    const direction = confused ? this.confusedDirection : this.callbacks.direction();
    const length = Math.hypot(direction.x, direction.y);
    if (!length) return;
    const speed = (confused ? 95 : 155) * this.spec.playerFactor / length;
    const stepX = direction.x * speed * seconds;
    const stepY = direction.y * speed * seconds;
    const nextX = this.playerPosition.x + stepX;
    const nextY = this.playerPosition.y + stepY;
    if (this.canStand(nextX, this.playerPosition.y)) this.playerPosition.x = nextX;
    if (this.canStand(this.playerPosition.x, nextY)) this.playerPosition.y = nextY;
    this.player.setPosition(this.playerPosition.x, this.playerPosition.y);
    if (confused && !this.callbacks.reducedMotion) this.player.angle = Math.sin(this.time.now / 45) * 12;
  }

  private startGasCloud(): void {
    this.clearGasCloud();
    this.gasOrigin = { ...this.dogPosition };
    this.gasElapsed = 0;
    for (const [x, y, radius] of [[-13, -9, 8], [1, -17, 10], [14, -9, 7]] as const) {
      this.gasCloud.push(this.add.circle(this.gasOrigin.x + x, this.gasOrigin.y + y, radius, 0x78bc54, 0.72).setDepth(8));
    }
  }

  private updateGasCloud(seconds: number): void {
    if (!this.gasCloud.length) return;
    if (this.rules.snapshot().fartSecondsLeft === 0) {
      this.clearGasCloud();
      return;
    }
    this.gasElapsed += seconds;
    this.gasCloud.forEach((cloud, index) => {
      cloud.setAlpha(Math.max(0.2, 0.72 - this.gasElapsed * 0.18));
      if (!this.callbacks.reducedMotion) cloud.setPosition(this.gasOrigin.x + (index - 1) * 13, this.gasOrigin.y - 12 - this.gasElapsed * (6 + index * 2));
    });
  }

  private clearGasCloud(): void {
    this.gasCloud.forEach((cloud) => cloud.destroy());
    this.gasCloud = [];
  }

  private canStand(x: number, y: number): boolean {
    const radius = 12;
    return [
      pointCell(x - radius, y - radius), pointCell(x + radius, y - radius),
      pointCell(x - radius, y + radius), pointCell(x + radius, y + radius),
    ].every((cell) => isWalkable(cell, this.piketteBlockedCell(), this.map));
  }

  private piketteBlockedCell(): Cell | null {
    if (!this.piketteVisit) return null;
    if (this.pikettePhase === 'guarding') return this.piketteVisit.object.cell;
    if (this.pikettePhase !== 'leaving' || !this.piketteSprite) return null;
    const center = cellCenter(this.piketteVisit.object.cell);
    return Math.hypot(this.piketteSprite.x - center.x, this.piketteSprite.y - center.y) < 25
      ? this.piketteVisit.object.cell : null;
  }

  private updatePikette(seconds: number): void {
    if (this.pikettePhase === 'waiting') {
      this.piketteNextIn -= seconds;
      if (this.piketteNextIn > 0) return;
      const visit = choosePiketteVisit(
        pointCell(this.dogPosition.x, this.dogPosition.y), pointCell(this.playerPosition.x, this.playerPosition.y),
        new Set(this.rules.snapshot().damagedIds), this.callbacks.random ?? Math.random, this.dogSpeed(), this.map,
      );
      if (!visit) { this.piketteNextIn = 2; return; }
      this.piketteVisit = visit;
      this.piketteSprite = this.add.image(visit.offboard.x, visit.offboard.y, 'pikette').setDisplaySize(40, 40).setDepth(9);
      this.piketteWaypoints = visit.route.map(cellCenter);
      this.pikettePhase = 'entering';
      this.piketteWaitAtObject = 0;
      this.callbacks.onEvent({ kind: 'piketteEnter', objectId: visit.object.id });
      this.playTone('piketteEnter');
      if (this.target?.id === visit.object.id) {
        this.clearTarget();
        this.mode = 'wander';
        this.modeTime = 0.4;
      }
      return;
    }
    if (this.pikettePhase === 'guarding') {
      if (this.rules.snapshot().piketteSecondsLeft === 0) {
        this.pikettePhase = 'leaving';
        this.piketteWaypoints = [...this.piketteVisit!.route.slice(0, -1).reverse().map(cellCenter), this.piketteVisit!.offboard];
        this.items.get(this.piketteVisit!.object.id)?.marker.setStrokeStyle(2, 0x676763);
      }
      return;
    }
    const sprite = this.piketteSprite;
    const visit = this.piketteVisit;
    if (!sprite || !visit) return;
    const destination = this.piketteWaypoints[0];
    if (!destination) {
      if (this.pikettePhase === 'entering') {
        this.pikettePhase = 'guarding';
        this.rules.startPiketteGuard(visit.object.id);
        this.items.get(visit.object.id)?.marker.setStrokeStyle(4, 0x8fc77b);
        this.wanderGoal = null;
        if (this.mode === 'recover') this.fleeRoute = findFleeRoute(pointCell(this.dogPosition.x, this.dogPosition.y), pointCell(this.playerPosition.x, this.playerPosition.y), visit.object.cell, this.map);
        if (this.target) {
          const route = findRoute(pointCell(this.dogPosition.x, this.dogPosition.y), this.target.cell, visit.object.cell, this.map);
          if (route) this.route = route;
          else { this.clearTarget(); this.mode = 'wander'; this.modeTime = 0.4; }
        }
        this.callbacks.onEvent({ kind: 'pikette', objectId: visit.object.id });
        this.callbacks.onSnapshot(this.rules.snapshot());
      } else {
        sprite.destroy();
        this.piketteSprite = null;
        this.piketteVisit = null;
        this.pikettePhase = 'waiting';
        this.piketteNextIn = 20 + (this.callbacks.random?.() ?? Math.random()) * 15;
        this.callbacks.onEvent({ kind: 'piketteGone' });
      }
      return;
    }
    if (this.pikettePhase === 'entering' && this.piketteWaypoints.length === 1 &&
      (pointCell(this.playerPosition.x, this.playerPosition.y).x === visit.object.cell.x && pointCell(this.playerPosition.x, this.playerPosition.y).y === visit.object.cell.y)) {
      this.piketteWaitAtObject += seconds;
      if (this.piketteWaitAtObject > 2) {
        this.pikettePhase = 'leaving';
        this.piketteWaypoints = [...visit.route.slice(0, -1).reverse().map(cellCenter), visit.offboard];
      }
      return;
    }
    const distance = Math.hypot(destination.x - sprite.x, destination.y - sprite.y);
    const amount = Math.min(distance, 300 * seconds);
    if (distance > 0) sprite.setPosition(sprite.x + (destination.x - sprite.x) / distance * amount, sprite.y + (destination.y - sprite.y) / distance * amount);
    if (!this.callbacks.reducedMotion) sprite.angle = Math.sin(this.time.now / 75) * 7;
    if (distance <= amount + 0.1) this.piketteWaypoints.shift();
  }

  private moveDog(seconds: number): void {
    if (this.mode === 'finished') return;
    if (this.rules.snapshot().stopSecondsLeft > 0) return;
    if (this.mode === 'stunned') {
      if (this.rules.snapshot().treatStunSecondsLeft === 0) {
        this.mode = 'wander';
        this.modeTime = 0.5;
      }
      return;
    }
    if (this.mode === 'lure') {
      const distanceToPlayer = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, this.playerPosition.x, this.playerPosition.y);
      if (distanceToPlayer <= TILE_SIZE + 4) {
        this.rules.beginTreatStun();
        this.mode = 'stunned';
        this.callbacks.onSnapshot(this.rules.snapshot());
        return;
      }
      const route = findRoute(pointCell(this.dogPosition.x, this.dogPosition.y), pointCell(this.playerPosition.x, this.playerPosition.y), this.piketteBlockedCell(), this.map);
      const next = route?.[1];
      if (next) {
        const destination = cellCenter(next);
        const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
        const amount = Math.min(distance, 170 * this.spec.dogFactor * seconds);
        if (distance > 0) {
          this.dogPosition.x += (destination.x - this.dogPosition.x) / distance * amount;
          this.dogPosition.y += (destination.y - this.dogPosition.y) / distance * amount;
          this.dog.setPosition(this.dogPosition.x, this.dogPosition.y);
        }
      }
      return;
    }
    if (this.mode === 'wander' || this.mode === 'recover') {
      this.modeTime -= seconds;
      if (this.mode === 'recover' && this.fleeRoute.length) {
        const destination = cellCenter(this.fleeRoute[0]);
        const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
        const amount = Math.min(distance, 190 * this.spec.dogFactor * seconds);
        if (distance > 0) {
          this.dogPosition.x += (destination.x - this.dogPosition.x) / distance * amount;
          this.dogPosition.y += (destination.y - this.dogPosition.y) / distance * amount;
          this.dog.setPosition(this.dogPosition.x, this.dogPosition.y);
        }
        if (distance <= amount + 0.1) this.fleeRoute.shift();
      }
      if (this.mode === 'wander') {
        this.wanderGoal ??= chooseWanderCell(pointCell(this.dogPosition.x, this.dogPosition.y), Math.random, this.piketteBlockedCell(), this.map);
        const destination = cellCenter(this.wanderGoal);
        const distance = Phaser.Math.Distance.Between(this.dogPosition.x, this.dogPosition.y, destination.x, destination.y);
        const amount = Math.min(distance, 48 * this.spec.dogFactor * seconds);
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
    const reservedId = this.piketteVisit?.object.id ?? null;
    const candidate = chooseTarget(damaged, this.previousTargetId, Math.random, reservedId, this.map);
    if (!candidate) {
      if (this.map.objects.every((object) => damaged.has(object.id))) this.finish();
      else { this.mode = 'wander'; this.modeTime = 0.5; }
      return;
    }
    const route = findRoute(pointCell(this.dogPosition.x, this.dogPosition.y), candidate.cell, this.piketteBlockedCell(), this.map);
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
    this.rules.clearDogControl();
    this.clearTarget();
    this.mode = 'recover';
    this.fleeRoute = findFleeRoute(pointCell(this.dogPosition.x, this.dogPosition.y), pointCell(this.playerPosition.x, this.playerPosition.y), this.piketteBlockedCell(), this.map);
    this.modeTime = Math.max(1.6, this.fleeRoute.length * TILE_SIZE / (190 * this.spec.dogFactor));
    this.dog.angle = 0;
    this.callbacks.onEvent({ kind: 'caught' });
    this.callbacks.onSnapshot(this.rules.snapshot());
    this.playTone('caught');
  }

  private damageObject(): void {
    const object = this.target;
    if (!object) return;
    if (object.id === this.piketteVisit?.object.id) {
      this.clearTarget();
      this.mode = 'wander';
      this.modeTime = 0.5;
      return;
    }
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

  private elapsedSeconds(): number { return LEVEL_SECONDS - this.rules.snapshot().secondsLeft; }
  private dogSpeed(): number { return (112 + this.elapsedSeconds() * 0.16) * this.spec.dogFactor; }
  private destructionTime(): number { return 3.6 - this.elapsedSeconds() * 0.004; }

  private finish(): void {
    if (this.endedNotified) return;
    this.endedNotified = true;
    this.mode = 'finished';
    this.clearGasCloud();
    this.callbacks.onSnapshot(this.rules.snapshot());
    this.callbacks.onEnd(this.rules.snapshot());
  }
}

export function mountGame(host: HTMLElement, callbacks: GameCallbacks, spec: LevelSpec): GameHandle {
  let enabled = false;
  let volume = 0.4;
  let audio: AudioContext | null = null;
  let musicBus: GainNode | null = null;
  let effectsBus: GainNode | null = null;
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
    if (effectsBus) effectsBus.gain.setValueAtTime(shouldPlay ? volume : 0, audio.currentTime);
    if (!shouldPlay && musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    } else if (shouldPlay && !musicTimer) {
      playMusicStep();
      musicTimer = setInterval(playMusicStep, 160);
    }
  };
  let noise: AudioBuffer | null = null;
  const noiseSource = (ctx: AudioContext): AudioBufferSourceNode => {
    if (!noise || noise.sampleRate !== ctx.sampleRate) {
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noise;
    return source;
  };
  /** Comical fart: a low, raspy, flapping tone that wobbles in pitch, with breathy noise. */
  const playFart = (ctx: AudioContext, bus: GainNode) => {
    const now = ctx.currentTime;
    const length = 0.85;
    const body = ctx.createOscillator();
    body.type = 'sawtooth';
    body.frequency.setValueAtTime(150, now);
    body.frequency.exponentialRampToValueAtTime(78, now + 0.3);
    body.frequency.exponentialRampToValueAtTime(105, now + 0.45);
    body.frequency.exponentialRampToValueAtTime(48, now + length);
    const flutter = ctx.createOscillator();
    flutter.type = 'square';
    flutter.frequency.setValueAtTime(34, now);
    flutter.frequency.linearRampToValueAtTime(19, now + length);
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = 22;
    flutter.connect(flutterDepth).connect(body.frequency);
    const flap = ctx.createGain();
    flap.gain.value = 0.55;
    const flapLfo = ctx.createOscillator();
    flapLfo.type = 'square';
    flapLfo.frequency.value = 27;
    const flapDepth = ctx.createGain();
    flapDepth.gain.value = 0.45;
    flapLfo.connect(flapDepth).connect(flap.gain);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 700;
    const hiss = noiseSource(ctx);
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 520;
    hissFilter.Q.value = 0.8;
    const hissLevel = ctx.createGain();
    hissLevel.gain.value = 0.35;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.9, now + 0.03);
    out.gain.setValueAtTime(0.9, now + 0.6);
    out.gain.exponentialRampToValueAtTime(0.001, now + length);
    body.connect(flap).connect(tone).connect(out);
    hiss.connect(hissFilter).connect(hissLevel).connect(out);
    out.connect(bus);
    for (const node of [body, flutter, flapLfo, hiss]) node.start(now);
    for (const node of [body, flutter, flapLfo, hiss]) node.stop(now + length);
    body.onended = () => { for (const node of [body, flutter, flapLfo, hiss, flap, tone, hissFilter, hissLevel, out]) node.disconnect(); };
  };
  /** Angry cat: a rising "mee-ow" yowl with a growl, formant sweep and a hiss at the start. */
  const playMeow = (ctx: AudioContext, bus: GainNode) => {
    const now = ctx.currentTime;
    const length = 0.95;
    const voice = ctx.createOscillator();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(380, now);
    voice.frequency.exponentialRampToValueAtTime(860, now + 0.22);
    voice.frequency.setValueAtTime(860, now + 0.3);
    voice.frequency.exponentialRampToValueAtTime(300, now + length);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 7;
    const vibratoDepth = ctx.createGain();
    vibratoDepth.gain.value = 24;
    vibrato.connect(vibratoDepth).connect(voice.frequency);
    const growl = ctx.createGain();
    growl.gain.value = 0.6;
    const growlLfo = ctx.createOscillator();
    growlLfo.type = 'sawtooth';
    growlLfo.frequency.value = 62;
    const growlDepth = ctx.createGain();
    growlDepth.gain.value = 0.4;
    growlLfo.connect(growlDepth).connect(growl.gain);
    const first = ctx.createBiquadFilter();
    first.type = 'bandpass';
    first.Q.value = 5;
    first.frequency.setValueAtTime(700, now);
    first.frequency.linearRampToValueAtTime(1100, now + 0.25);
    first.frequency.linearRampToValueAtTime(500, now + length);
    const second = ctx.createBiquadFilter();
    second.type = 'bandpass';
    second.Q.value = 7;
    second.frequency.setValueAtTime(1800, now);
    second.frequency.linearRampToValueAtTime(2600, now + 0.25);
    second.frequency.linearRampToValueAtTime(1500, now + length);
    const secondLevel = ctx.createGain();
    secondLevel.gain.value = 0.7;
    const hiss = noiseSource(ctx);
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3500;
    const hissLevel = ctx.createGain();
    hissLevel.gain.setValueAtTime(0.5, now);
    hissLevel.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.8, now + 0.05);
    out.gain.setValueAtTime(0.8, now + 0.55);
    out.gain.exponentialRampToValueAtTime(0.001, now + length);
    voice.connect(growl);
    growl.connect(first).connect(out);
    growl.connect(second).connect(secondLevel).connect(out);
    hiss.connect(hissFilter).connect(hissLevel).connect(out);
    out.connect(bus);
    const sources = [voice, vibrato, growlLfo, hiss];
    for (const node of sources) node.start(now);
    for (const node of sources) node.stop(now + length);
    voice.onended = () => { for (const node of [...sources, growl, first, second, secondLevel, hissFilter, hissLevel, out]) node.disconnect(); };
  };
  const sound = (kind: GameEvent['kind']) => {
    if (!enabled) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') void audio.resume();
      if (!effectsBus) {
        effectsBus = audio.createGain();
        effectsBus.gain.value = volume;
        effectsBus.connect(audio.destination);
      }
      if (kind === 'fart') { playFart(audio, effectsBus); return; }
      if (kind === 'piketteEnter') { playMeow(audio, effectsBus); return; }
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const duration = 0.16;
      oscillator.type = 'sine';
      oscillator.frequency.value = kind === 'caught' ? 660 : kind === 'damage' ? 180 : 390;
      gain.gain.setValueAtTime(Math.min(volume * 0.12, 0.12), audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain).connect(effectsBus);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
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
  }, sound, spec);
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
    useStop: () => scene.useStop(),
    useTreat: () => scene.useTreat(),
    destroy: () => {
      ended = true;
      syncMusic();
      game.destroy(true);
      if (audio) void audio.close();
    },
  };
}
