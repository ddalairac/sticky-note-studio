import type { Note } from "./types";

export interface NotesState {
  status: "loading" | "ready";
  notes: Note[];
  error: string | null;
}

export type NotesAction =
  | { type: "loaded"; notes: Note[] }
  | { type: "failed"; error: string }
  | { type: "dismissError" }
  | { type: "upsert"; note: Note }
  | { type: "remove"; id: string };

export const initialNotesState: NotesState = { status: "loading", notes: [], error: null };

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case "loaded":
      return { ...state, status: "ready", notes: action.notes };
    case "failed":
      return { ...state, status: "ready", error: action.error };
    case "dismissError":
      return { ...state, error: null };
    case "upsert": {
      const exists = state.notes.some((n) => n.id === action.note.id);
      return {
        ...state,
        notes: exists
          ? state.notes.map((n) => (n.id === action.note.id ? action.note : n))
          : [...state.notes, action.note],
      };
    }
    case "remove":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
  }
}

export const topZ = (notes: readonly Note[]): number =>
  notes.reduce((max, n) => Math.max(max, n.z), 0);
