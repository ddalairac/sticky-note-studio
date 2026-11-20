import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  DEFAULT_NOTE_SIZE,
  clampPosition,
  containsPoint,
  isLargeEnough,
  rectFromPoints,
} from "@/notes/geometry";
import type { NotesApi } from "@/notes/notesApi";
import { blurActiveElement, trackPointer } from "@/notes/pointer";
import type { NoteColor, Point, Rect, Size } from "@/notes/types";
import { useNotes } from "@/notes/useNotes";
import { StickyNote } from "./StickyNote";
import { Toolbar } from "./Toolbar";
import { TrashZone } from "./TrashZone";

export function Board({ api }: { api: NotesApi }) {
  const { notes, status, error, actions } = useNotes(api);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState<NoteColor>("yellow");
  const [draft, setDraft] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [trashHover, setTrashHover] = useState(false);

  // Stable callbacks: notes are memoized and must not re-render when the board does.
  const getBounds = useCallback((): Size => {
    const el = boardRef.current;
    return { width: el?.clientWidth ?? 0, height: el?.clientHeight ?? 0 };
  }, []);
  const isOverTrash = useCallback((p: Point) => {
    const r = trashRef.current?.getBoundingClientRect();
    return !!r && containsPoint({ x: r.left, y: r.top, width: r.width, height: r.height }, p);
  }, []);
  const onTrashHover = useCallback((hovering: boolean | null) => {
    setDragging(hovering !== null);
    setTrashHover(hovering === true);
  }, []);
  const onRemove = useCallback((id: string) => actions.remove(id), [actions]);

  const toBoardPoint = (clientX: number, clientY: number): Point => {
    const r = boardRef.current?.getBoundingClientRect();
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) };
  };

  const startDrawing = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    e.preventDefault();
    blurActiveElement();
    const start = toBoardPoint(e.clientX, e.clientY);
    const bounds = getBounds();
    const rectFor = (d: Point) => {
      const end = {
        x: Math.min(Math.max(start.x + d.x, 0), bounds.width),
        y: Math.min(Math.max(start.y + d.y, 0), bounds.height),
      };
      return rectFromPoints(start, end);
    };
    trackPointer(e, {
      onMove: (d) => setDraft(rectFor(d)),
      onEnd: (d, _ev, cancelled) => {
        setDraft(null);
        const rect = rectFor(d);
        if (!cancelled && isLargeEnough(rect)) actions.create(rect, color);
      },
    });
  };

  const createAt = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const p = toBoardPoint(e.clientX, e.clientY);
    actions.create(
      clampPosition(
        { ...DEFAULT_NOTE_SIZE, x: p.x - DEFAULT_NOTE_SIZE.width / 2, y: p.y - 20 },
        getBounds(),
      ),
      color,
    );
  };

  return (
    <main className="board" ref={boardRef} onPointerDown={startDrawing} onDoubleClick={createAt}>
      <Toolbar color={color} onColorChange={setColor} count={notes.length} />

      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          getBounds={getBounds}
          isOverTrash={isOverTrash}
          onTrashHover={onTrashHover}
          onChange={actions.update}
          onFocus={actions.bringToFront}
          onRemove={onRemove}
        />
      ))}

      {draft && (
        <div
          className="draft"
          data-color={color}
          data-valid={isLargeEnough(draft) || undefined}
          style={{ left: draft.x, top: draft.y, width: draft.width, height: draft.height }}
        />
      )}

      <TrashZone ref={trashRef} active={trashHover} visible={dragging} />

      {status === "loading" && <div className="board__status">Loading notes…</div>}
      {status === "ready" && notes.length === 0 && !draft && (
        <div className="board__empty">Drag anywhere to pin your first note</div>
      )}
      {error && (
        <div className="toast" role="alert" onPointerDown={(e) => e.stopPropagation()}>
          {error}
          <button type="button" onClick={actions.dismissError}>
            Dismiss
          </button>
        </div>
      )}
    </main>
  );
}
