export interface BoardRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BoardLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Midpoint of the span two intervals share (their facing band), or null when they do not overlap. */
function sharedMidpoint(aStart: number, aEnd: number, bStart: number, bEnd: number): number | null {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return start < end ? (start + end) / 2 : null;
}

/**
 * Picks where a string between two measured cards should be pinned. Cards that sit side by side or
 * stacked are joined through the middle of their facing edges, and diagonal cards through the
 * nearest corners, so every string runs through the gutter instead of across card text.
 */
export function connectionLine(a: BoardRect, b: BoardRect): BoardLine {
  const sideways = a.right <= b.left ? 1 : b.right <= a.left ? -1 : 0;
  const downwards = a.bottom <= b.top ? 1 : b.bottom <= a.top ? -1 : 0;

  if (sideways === 0 && downwards === 0) {
    return {
      x1: (a.left + a.right) / 2,
      y1: (a.top + a.bottom) / 2,
      x2: (b.left + b.right) / 2,
      y2: (b.top + b.bottom) / 2,
    };
  }

  const sharedX = sharedMidpoint(a.left, a.right, b.left, b.right);
  const sharedY = sharedMidpoint(a.top, a.bottom, b.top, b.bottom);

  return {
    x1: sideways === 1 ? a.right : sideways === -1 ? a.left : sharedX ?? a.left,
    y1: downwards === 1 ? a.bottom : downwards === -1 ? a.top : sharedY ?? a.top,
    x2: sideways === 1 ? b.left : sideways === -1 ? b.right : sharedX ?? b.left,
    y2: downwards === 1 ? b.top : downwards === -1 ? b.bottom : sharedY ?? b.top,
  };
}
