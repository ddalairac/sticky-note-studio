import { memo, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { clampPosition, clampSize } from "@/notes/geometry";
import { blurActiveElement, trackPointer } from "@/notes/pointer";
import {
  NOTE_COLORS,
  type Note,
  type NotePatch,
  type Point,
  type Rect,
  type Size,
} from "@/notes/types";

export interface StickyNoteProps {
  note: Note;
  getBounds: () => Size;
  isOverTrash: (client: Point) => boolean;
  /** Reports trash hover while moving; `null` means the drag ended. */
  onTrashHover: (hovering: boolean | null) => void;
  onChange: (id: string, patch: NotePatch) => void;
  onFocus: (id: string) => void;
  onRemove: (id: string) => void;
}

type Gesture = "move" | "resize";

/**
 * A single note. While a gesture is in progress the rect lives in local `draft` state,
 * so only this note re-renders per pointer move; the result is committed once on release.
 */
export const StickyNote = memo(function StickyNote({
  note,
  getBounds,
  isOverTrash,
  onTrashHover,
  onChange,
  onFocus,
  onRemove,
}: StickyNoteProps) {
  const [draft, setDraft] = useState<Rect | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [text, setText] = useState(note.text);
  useEffect(() => setText(note.text), [note.text]);

  const rect = draft ?? note;

  const startGesture = (kind: Gesture) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    blurActiveElement();
    e.stopPropagation();
    onFocus(note.id);
    const origin: Rect = { x: note.x, y: note.y, width: note.width, height: note.height };
    const compute = (d: Point): Rect =>
      kind === "move"
        ? clampPosition({ ...origin, x: origin.x + d.x, y: origin.y + d.y }, getBounds())
        : clampSize(
            { ...origin, width: origin.width + d.x, height: origin.height + d.y },
            getBounds(),
          );

    setGesture(kind);
    trackPointer(e, {
      onMove: (d, ev) => {
        setDraft(compute(d));
        if (kind === "move") {
          const hovering = isOverTrash({ x: ev.clientX, y: ev.clientY });
          setOverTrash(hovering);
          onTrashHover(hovering);
        }
      },
      onEnd: (d, ev, cancelled) => {
        setDraft(null);
        setGesture(null);
        setOverTrash(false);
        onTrashHover(null);
        if (cancelled) return;
        if (kind === "move" && ev && isOverTrash({ x: ev.clientX, y: ev.clientY })) {
          onRemove(note.id);
          return;
        }
        const next = compute(d);
        if (
          next.x !== note.x ||
          next.y !== note.y ||
          next.width !== note.width ||
          next.height !== note.height
        ) {
          onChange(note.id, next);
        }
      },
    });
  };

  const cycleColor = () => {
    const next =
      NOTE_COLORS[(NOTE_COLORS.indexOf(note.color) + 1) % NOTE_COLORS.length] ?? note.color;
    onChange(note.id, { color: next });
  };

  return (
    <article
      className="note"
      data-color={note.color}
      data-gesture={gesture ?? undefined}
      data-over-trash={overTrash || undefined}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, zIndex: note.z }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onFocus(note.id);
      }}
    >
      <header className="note__header" onPointerDown={startGesture("move")}>
        <span className="note__grip" aria-hidden />
        <button
          type="button"
          className="note__color"
          title="Change color"
          aria-label="Change note color"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={cycleColor}
        />
      </header>
      <textarea
        id={`note-text-${note.id}`}
        name={`note-text-${note.id}`}
        className="note__text"
        value={text}
        placeholder="Write something…"
        aria-label="Note text"
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== note.text && onChange(note.id, { text })}
      />
      <div
        className="note__resize"
        onPointerDown={startGesture("resize")}
        aria-label="Resize note"
        role="separator"
      />
    </article>
  );
});
