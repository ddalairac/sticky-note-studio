import { describe, expect, it } from "vitest";
import { MIN_NOTE_SIZE, clampPosition, clampSize, rectFromPoints } from "./geometry";
import { createMockNotesApi } from "./notesApi";
import { initialNotesState, notesReducer } from "./notesState";
import type { Note } from "./types";

const note: Note = { id: "a", x: 10, y: 10, width: 200, height: 150, text: "hi", color: "yellow", z: 1 };

describe("geometry", () => {
  it("builds a rect from points dragged in any direction", () => {
    expect(rectFromPoints({ x: 300, y: 200 }, { x: 100, y: 50 })).toEqual({ x: 100, y: 50, width: 200, height: 150 });
  });
  it("keeps a moved note inside the board", () => {
    expect(clampPosition({ ...note, x: 950, y: -20 }, { width: 1024, height: 768 })).toMatchObject({ x: 824, y: 0 });
  });
  it("never resizes below the minimum size", () => {
    expect(clampSize({ ...note, width: 5, height: 5 }, { width: 1024, height: 768 })).toMatchObject(MIN_NOTE_SIZE);
  });
});

describe("notesReducer", () => {
  it("removes a note", () => {
    const s = notesReducer({ ...initialNotesState, notes: [note] }, { type: "remove", id: "a" });
    expect(s.notes).toHaveLength(0);
  });
});

describe("mock API", () => {
  it("persists saved notes across instances", async () => {
    const api = createMockNotesApi(window.localStorage, 0);
    await api.save(note);
    expect(await createMockNotesApi(window.localStorage, 0).list()).toEqual([note]);
    await api.remove("a");
    expect(await api.list()).toEqual([]);
  });
});
