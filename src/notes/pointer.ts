import type { Point } from "./types";

export interface PointerTrackHandlers {
  /** Called on every move with the offset from the starting point. */
  onMove: (delta: Point, event: PointerEvent) => void;
  /** Called once when the gesture ends; `cancelled` is true for pointercancel / Escape. */
  onEnd: (delta: Point, event: PointerEvent | null, cancelled: boolean) => void;
}

/** Gestures call preventDefault (no text selection), which also stops focus moving; blur manually so edits commit. */
export function blurActiveElement(): void {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/**
 * Tracks a single pointer gesture started by `start`. Listeners live on window so the
 * gesture keeps working when the cursor leaves the element, and are removed on finish.
 */
export function trackPointer(
  start: { clientX: number; clientY: number; pointerId: number },
  handlers: PointerTrackHandlers,
): void {
  const origin = { x: start.clientX, y: start.clientY };
  let last: Point = { x: 0, y: 0 };
  const deltaOf = (e: PointerEvent): Point => ({
    x: e.clientX - origin.x,
    y: e.clientY - origin.y,
  });

  const move = (e: PointerEvent) => {
    if (e.pointerId !== start.pointerId) return;
    last = deltaOf(e);
    handlers.onMove(last, e);
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== start.pointerId) return;
    cleanup();
    handlers.onEnd(deltaOf(e), e, false);
  };
  const cancel = (e: PointerEvent) => {
    if (e.pointerId !== start.pointerId) return;
    cleanup();
    handlers.onEnd(last, e, true);
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    cleanup();
    handlers.onEnd(last, null, true);
  };
  function cleanup() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", key);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", key);
}
