import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';
import {
  BoardConnection,
  BoardNode,
  CONSPIRACY_CONNECTIONS,
  CONSPIRACY_NODES,
  sequenceStateFor,
} from './conspiracy-board.data';
import { BoardLine, BoardRect, connectionLine } from './conspiracy-board.geometry';

const REVEAL_INTERVAL_MS = 900;

interface ConnectionLine {
  id: string;
  connection: BoardConnection;
  line: BoardLine;
}

@Component({
  selector: 'app-conspiracy-board',
  imports: [RouterLink],
  templateUrl: './conspiracy-board.html',
  styleUrl: './conspiracy-board.scss',
})
export class ConspiracyBoard {
  protected readonly translation = inject(TranslationService);
  protected readonly nodes = CONSPIRACY_NODES;
  protected readonly connections = CONSPIRACY_CONNECTIONS;

  private readonly boardElement = viewChild<ElementRef<HTMLElement>>('board');

  protected readonly selectedNodeId = signal<string | null>(null);
  // Reduced motion skips the reveal animation entirely: the whole board is shown from the start.
  private readonly sequenceStep = signal(prefersReducedMotion() ? CONSPIRACY_NODES.length : 0);
  protected readonly playing = signal(false);
  protected readonly sequence = computed(() => sequenceStateFor(this.sequenceStep()));
  protected readonly selectedConnections = computed<readonly BoardConnection[]>(() => {
    const selected = this.selectedNodeId();
    return selected === null
      ? []
      : this.connections.filter((connection) => connection.from === selected || connection.to === selected);
  });

  private readonly nodeRects = signal<Readonly<Record<string, BoardRect>>>({});
  protected readonly boardSize = signal({ width: 1000, height: 560 });
  protected readonly connectionLines = computed<readonly ConnectionLine[]>(() => {
    const rects = this.nodeRects();
    return this.connections.flatMap((connection) => {
      const from = rects[connection.from];
      const to = rects[connection.to];
      return from && to ? [{ id: connection.id, connection, line: connectionLine(from, to) }] : [];
    });
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.stopTimer());

    afterNextRender(() => {
      this.measureBoard();
      const board = this.boardElement()?.nativeElement;
      if (board && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => this.measureBoard());
        observer.observe(board);
        destroyRef.onDestroy(() => observer.disconnect());
      }
    });
  }

  protected selectNode(id: string): void {
    this.selectedNodeId.update((current) => current === id ? null : id);
  }

  protected startSequence(): void {
    this.sequenceStep.set(1);
    this.resumeSequence();
  }

  protected resumeSequence(): void {
    this.stopTimer();
    if (this.sequenceStep() >= this.nodes.length) return;
    this.playing.set(true);
    this.timer = setInterval(() => {
      this.sequenceStep.update((step) => step + 1);
      if (this.sequenceStep() >= this.nodes.length) this.stopTimer();
    }, REVEAL_INTERVAL_MS);
  }

  protected pauseSequence(): void {
    this.stopTimer();
  }

  protected skipSequence(): void {
    this.stopTimer();
    this.sequenceStep.set(this.nodes.length);
  }

  protected replaySequence(): void {
    this.stopTimer();
    this.sequenceStep.set(0);
  }

  protected clearSelection(): void {
    this.selectedNodeId.set(null);
  }

  protected nodeCopy(node: BoardNode) {
    return this.translation.t().conspiracyBoard.nodes[node.id];
  }

  protected connectionCopy(connection: BoardConnection): string {
    return this.translation.t().conspiracyBoard.connections[connection.id] ?? '';
  }

  protected isConnectionActive(connection: BoardConnection): boolean {
    const selected = this.selectedNodeId();
    return selected !== null && (connection.from === selected || connection.to === selected);
  }

  protected isConnectionRevealed(connection: BoardConnection): boolean {
    return this.sequence().revealedConnectionIds.includes(connection.id);
  }

  /** Stores each card's rectangle relative to the board's top-left corner. */
  protected setNodeRects(rects: Readonly<Record<string, BoardRect>>): void {
    this.nodeRects.set(rects);
  }

  private measureBoard(): void {
    const board = this.boardElement()?.nativeElement;
    if (!board) return;

    const origin = board.getBoundingClientRect();
    const rects: Record<string, BoardRect> = {};
    board.querySelectorAll<HTMLElement>('[data-node]').forEach((item) => {
      const box = item.getBoundingClientRect();
      rects[item.dataset['node'] as string] = {
        left: box.left - origin.left,
        top: box.top - origin.top,
        right: box.right - origin.left,
        bottom: box.bottom - origin.top,
      };
    });

    this.boardSize.set({ width: origin.width, height: origin.height });
    this.setNodeRects(rects);
  }

  private stopTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.playing.set(false);
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
