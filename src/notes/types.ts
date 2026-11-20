export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export const NOTE_COLORS = ["yellow", "pink", "blue", "green"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface Note extends Rect {
  readonly id: string;
  text: string;
  color: NoteColor;
  /** Stacking order; higher values render on top. */
  z: number;
}

export type NotePatch = Partial<Omit<Note, "id">>;
