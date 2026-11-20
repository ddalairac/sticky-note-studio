import { NOTE_COLORS, type NoteColor } from "@/notes/types";

interface ToolbarProps {
  color: NoteColor;
  onColorChange: (color: NoteColor) => void;
  count: number;
}

export function Toolbar({ color, onColorChange, count }: ToolbarProps) {
  return (
    <div className="toolbar" onPointerDown={(e) => e.stopPropagation()}>
      <h1 className="toolbar__title">Pinboard</h1>
      <div className="toolbar__swatches" role="radiogroup" aria-label="Color for new notes">
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={c}
            className="swatch"
            data-color={c}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>
      <p className="toolbar__hint">
        Drag on the board to draw a note · double-click for a quick one · {count} {count === 1 ? "note" : "notes"}
      </p>
    </div>
  );
}
