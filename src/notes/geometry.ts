import type { Point, Rect, Size } from "./types";

export const MIN_NOTE_SIZE: Size = { width: 120, height: 90 };
export const DEFAULT_NOTE_SIZE: Size = { width: 200, height: 160 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** Builds a rectangle spanning two arbitrary corner points. */
export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** Keeps the whole rectangle inside the bounds without changing its size. */
export function clampPosition(rect: Rect, bounds: Size): Rect {
  return {
    ...rect,
    x: clamp(rect.x, 0, bounds.width - rect.width),
    y: clamp(rect.y, 0, bounds.height - rect.height),
  };
}

/** Enforces the minimum note size and keeps the bottom-right corner inside the bounds. */
export function clampSize(rect: Rect, bounds: Size): Rect {
  return {
    ...rect,
    width: clamp(rect.width, MIN_NOTE_SIZE.width, bounds.width - rect.x),
    height: clamp(rect.height, MIN_NOTE_SIZE.height, bounds.height - rect.y),
  };
}

export function isLargeEnough(size: Size): boolean {
  return size.width >= MIN_NOTE_SIZE.width && size.height >= MIN_NOTE_SIZE.height;
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
