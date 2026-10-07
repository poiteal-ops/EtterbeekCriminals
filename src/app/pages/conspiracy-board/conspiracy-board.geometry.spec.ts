import { connectionLine } from './conspiracy-board.geometry';

describe('connectionLine', () => {
  const left = { left: 0, top: 0, right: 100, bottom: 80 };
  const right = { left: 140, top: 10, right: 240, bottom: 90 };
  const below = { left: 20, top: 120, right: 120, bottom: 200 };
  const diagonal = { left: 140, top: 120, right: 240, bottom: 200 };

  it('joins facing edges through the middle of the shared band for side-by-side cards', () => {
    expect(connectionLine(left, right)).toEqual({ x1: 100, y1: 45, x2: 140, y2: 45 });
    expect(connectionLine(right, left)).toEqual({ x1: 140, y1: 45, x2: 100, y2: 45 });
  });

  it('joins bottom and top edges at the shared column for stacked cards', () => {
    expect(connectionLine(left, below)).toEqual({ x1: 60, y1: 80, x2: 60, y2: 120 });
    expect(connectionLine(below, left)).toEqual({ x1: 60, y1: 120, x2: 60, y2: 80 });
  });

  it('joins the nearest corners for diagonal cards so the line stays in the gutter', () => {
    expect(connectionLine(left, diagonal)).toEqual({ x1: 100, y1: 80, x2: 140, y2: 120 });
    expect(connectionLine(diagonal, left)).toEqual({ x1: 140, y1: 120, x2: 100, y2: 80 });
  });

  it('falls back to the centres when the cards overlap', () => {
    const overlapping = { left: 50, top: 40, right: 150, bottom: 120 };
    expect(connectionLine(left, overlapping)).toEqual({ x1: 50, y1: 40, x2: 100, y2: 80 });
  });
});
