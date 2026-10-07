import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConspiracyBoard } from './conspiracy-board';

function createComponent() {
  TestBed.configureTestingModule({
    imports: [ConspiracyBoard],
    providers: [provideHttpClient(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(ConspiracyBoard);
  fixture.detectChanges();
  return fixture;
}

describe('ConspiracyBoard', () => {
  it('selects a card and exposes only its direct relationship notes', () => {
    const fixture = createComponent();
    const couch = Array.from(
      fixture.nativeElement.querySelectorAll('.evidence-card') as NodeListOf<HTMLButtonElement>,
    ).find((card) => card.textContent?.includes('THE COUCH'));

    couch?.click();
    fixture.detectChanges();

    expect(couch?.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance['selectedNodeId']()).toBe('couch');
    expect(fixture.nativeElement.querySelectorAll('.connection-note')).toHaveLength(2);
  });

  it('skips to a complete board and replay returns to the initial state', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    instance['skipSequence']();
    expect(instance['sequence']().complete).toBe(true);

    instance['replaySequence']();
    expect(instance['sequence']()).toEqual({ revealedNodeIds: [], revealedConnectionIds: [], complete: false });
  });

  describe('sequence playback', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('reveals one step per tick after Build the case, and pause holds the current step', () => {
      vi.useFakeTimers();
      const fixture = createComponent();
      const instance = fixture.componentInstance;

      instance['startSequence']();
      expect(instance['sequence']().revealedNodeIds).toEqual(['le-criminel']);

      vi.advanceTimersByTime(1000);
      expect(instance['sequence']().revealedNodeIds).toEqual(['le-criminel', 'couch']);

      instance['pauseSequence']();
      vi.advanceTimersByTime(5000);
      expect(instance['sequence']().revealedNodeIds).toHaveLength(2);

      instance['resumeSequence']();
      vi.advanceTimersByTime(4000);
      expect(instance['sequence']().complete).toBe(true);
      expect(instance['playing']()).toBe(false);
    });

    it('stops the timer when the sequence is skipped or replayed', () => {
      vi.useFakeTimers();
      const fixture = createComponent();
      const instance = fixture.componentInstance;

      instance['startSequence']();
      instance['skipSequence']();
      expect(instance['playing']()).toBe(false);
      expect(instance['sequence']().complete).toBe(true);

      instance['replaySequence']();
      vi.advanceTimersByTime(5000);
      expect(instance['sequence']().revealedNodeIds).toEqual([]);
    });

    it('starts with the full board revealed when the visitor prefers reduced motion', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
      const fixture = createComponent();

      expect(fixture.componentInstance['sequence']().complete).toBe(true);
    });
  });

  it('draws one anchored line per connection from the measured card rectangles', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;
    const cell = (column: number, row: number) => ({
      left: column * 140, top: row * 120, right: column * 140 + 100, bottom: row * 120 + 80,
    });

    instance['setNodeRects']({
      balcony: cell(0, 0), 'le-criminel': cell(1, 0), couch: cell(2, 0),
      shoe: cell(0, 1), pikette: cell(1, 1), 'pikette-visits': cell(2, 1),
    });

    const lines = instance['connectionLines']();
    expect(lines).toHaveLength(6);
    expect(lines.find((line) => line.id === 'le-criminel-couch')?.line).toEqual({ x1: 240, y1: 40, x2: 280, y2: 40 });
    expect(lines.find((line) => line.id === 'le-criminel-pikette')?.line).toEqual({ x1: 190, y1: 80, x2: 190, y2: 120 });
  });

  it('marks only direct SVG connections active for the selected evidence card', () => {
    const fixture = createComponent();
    const cell = (column: number, row: number) => ({
      left: column * 140, top: row * 120, right: column * 140 + 100, bottom: row * 120 + 80,
    });
    fixture.componentInstance['setNodeRects']({
      balcony: cell(0, 0), 'le-criminel': cell(1, 0), couch: cell(2, 0),
      shoe: cell(0, 1), pikette: cell(1, 1), 'pikette-visits': cell(2, 1),
    });
    fixture.detectChanges();
    const couch = Array.from(
      fixture.nativeElement.querySelectorAll('.evidence-card') as NodeListOf<HTMLButtonElement>,
    ).find((card) => card.textContent?.includes('THE COUCH'));

    couch?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.connection').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.connection.is-active')).toHaveLength(2);
  });
});
