import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { NotesApi } from "./notesApi";
import { initialNotesState, notesReducer, topZ } from "./notesState";
import type { Note, NoteColor, NotePatch, Rect } from "./types";

export interface NotesActions {
  create: (rect: Rect, color: NoteColor) => void;
  update: (id: string, patch: NotePatch) => void;
  bringToFront: (id: string) => void;
  remove: (id: string) => void;
  dismissError: () => void;
}

/**
 * Owns the notes collection. Updates are optimistic: local state changes immediately
 * and the API call runs in the background; failures surface as an error message.
 * Returned actions are referentially stable so memoized notes don't re-render.
 */
export function useNotes(api: NotesApi) {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState);
  const notesRef = useRef(state.notes);
  useEffect(() => {
    notesRef.current = state.notes;
  }, [state.notes]);

  useEffect(() => {
    let alive = true;
    api.list().then(
      (notes) => alive && dispatch({ type: "loaded", notes }),
      () => alive && dispatch({ type: "failed", error: "Couldn't load your notes." }),
    );
    return () => {
      alive = false;
    };
  }, [api]);

  const persist = useCallback((request: Promise<unknown>) => {
    request.catch(() => dispatch({ type: "failed", error: "Couldn't save your changes." }));
  }, []);

  const commit = useCallback(
    (note: Note) => {
      // Keep the ref current so consecutive actions in one event see each other.
      const list = notesRef.current;
      notesRef.current = list.some((n) => n.id === note.id)
        ? list.map((n) => (n.id === note.id ? note : n))
        : [...list, note];
      dispatch({ type: "upsert", note });
      persist(api.save(note));
    },
    [api, persist],
  );

  const actions = useMemo<NotesActions>(() => {
    const find = (id: string) => notesRef.current.find((n) => n.id === id);
    return {
      create: (rect, color) =>
        commit({
          ...rect,
          id: crypto.randomUUID(),
          text: "",
          color,
          z: topZ(notesRef.current) + 1,
        }),
      update: (id, patch) => {
        const note = find(id);
        if (note) commit({ ...note, ...patch });
      },
      bringToFront: (id) => {
        const note = find(id);
        const top = topZ(notesRef.current);
        const alreadyOnTop =
          note?.z === top && notesRef.current.filter((n) => n.z === top).length === 1;
        if (note && !alreadyOnTop) commit({ ...note, z: top + 1 });
      },
      remove: (id) => {
        notesRef.current = notesRef.current.filter((n) => n.id !== id);
        dispatch({ type: "remove", id });
        persist(api.remove(id));
      },
      dismissError: () => dispatch({ type: "dismissError" }),
    };
  }, [api, commit, persist]);

  return { ...state, actions };
}
