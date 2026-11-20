[< Back to Readme](./README.md)

# Sticky Notes — Architecture

## Summary

The app is a single-page React + TypeScript application built with Vite (a static client-side bundle, deployable to
GitHub Pages) with no UI component libraries. Code is split into a framework-free domain layer in `src/notes/` and
presentational components in `src/components/`. The domain layer holds the `Note`/`Rect` types, pure geometry helpers
(normalising a drawn rectangle, clamping moves and resizes to the board and to a minimum size, hit-testing), a tiny
`trackPointer` utility that follows one pointer gesture via window listeners (Escape/pointercancel abort it), a reducer
for the notes collection and the `NotesApi` interface. A `useNotes` hook joins these together: it loads notes, applies
changes optimistically to local state and sends them to the API in the background, showing an error toast if a request
fails.

Persistence goes through the `NotesApi` interface (`list`/`save`/`remove`, all Promise-based). The bundled
implementation is an asynchronous mock of a REST backend with simulated latency. It stores data in `localStorage`, runs
requests through a queue so writes land in the order they were issued, and type-checks the stored data when reading it
back. A real HTTP client can replace it without touching the UI.

For speed, a note keeps its in-progress position or size in its own local `draft` state while being dragged, so only
that note re-renders on each pointer move. The final rect is written to the store once, on pointer release. Notes are
wrapped in `React.memo` and all callbacks passed to them are stable, so changing one note never re-renders the others.

The sections below are a reference for the details.

## Module map

```
src/
├── main.tsx              Entry point: creates the mock API and renders <Board api={api} />
├── notes/                Framework-free domain layer (unit-testable without a DOM)
│   ├── types.ts          Note, Rect, Point, Size, NoteColor, NotePatch
│   ├── geometry.ts       Pure helpers: rectFromPoints, clampPosition, clampSize, containsPoint, size limits
│   ├── pointer.ts        trackPointer (one gesture via window listeners) and blurActiveElement
│   ├── notesState.ts     Reducer for { status, notes, error } and topZ
│   ├── notesApi.ts       NotesApi interface and the localStorage-backed async mock
│   └── useNotes.ts       Hook: loading, optimistic updates, background persistence, stable actions
└── components/           Presentational; no domain rules live here
    ├── Board.tsx         Draw-to-create, double-click-to-create, trash hit-testing, toast
    ├── StickyNote.tsx    One note: move / resize gestures, text, colour (memoised)
    ├── Toolbar.tsx       Colour for new notes, hint, note count
    └── TrashZone.tsx     Drop target, visible only while a note is being moved
```

Imports use the `@/` alias for `src/`.

## Data flow

```
 user gesture ─► component ─► useNotes action ─┬─► reducer ─► React state ─► UI   (optimistic, immediate)
                                               └─► NotesApi.save/remove ─► backend (background)
                                                       └─ on failure: "failed" action ─► error toast
```

- `useNotes` keeps a `notesRef` that mirrors the notes. Actions read from the ref instead of from state, which is what
  keeps their identities stable (so memoised notes are not re-rendered). `commit` also updates the ref synchronously, so
  two actions fired in the same event (for example "bring to front" followed by "move") see each other's result before
  React re-renders.
- On startup `list()` populates the state. A flag in the effect cleanup ignores a response that arrives after unmount.

## Gesture performance

A move or resize runs entirely inside `StickyNote`:

1. `pointerdown` on the header or the corner handle calls `trackPointer`, which registers `pointermove`, `pointerup`,
   `pointercancel` and `keydown` (Escape) listeners on `window`. Listening on `window` keeps the gesture working when
   the cursor leaves the element, and everything is removed when the gesture ends.
2. Every `pointermove` computes a clamped rect from the origin captured at the start and stores it in the local `draft`
   state. Only this note re-renders.
3. On release the rect is committed once through `onChange` (skipped if nothing changed). Dropping a moved note over the
   trash calls `onRemove` instead. Escape or `pointercancel` discards the draft.

Gestures call `preventDefault` to avoid text selection, which also prevents focus from moving. `blurActiveElement`
blurs the focused textarea by hand so pending text edits are committed before the gesture starts.

## Persistence

`NotesApi` is the only persistence boundary. The mock mirrors a REST backend:

| Method       | Equivalent request  |
| ------------ | ------------------- |
| `list()`     | `GET /notes`        |
| `save(note)` | `PUT /notes/:id`    |
| `remove(id)` | `DELETE /notes/:id` |

- Every call goes through a promise queue with simulated latency, so writes are applied in the order issued, as a
  server would see them over a single connection.
- Data is stored under the versioned key `sticky-notes:v1`. On read, `isNote` validates each record and drops invalid
  ones, so corrupted storage cannot crash the app.

**Swapping the backend:** implement the three methods against an HTTP client and pass the instance to `<Board api={...} />`
in `main.tsx`. Nothing else changes.

## Interaction model

| Gesture                           | Result                                                                   |
| --------------------------------- | ------------------------------------------------------------------------ |
| Drag on empty board space         | Draws a note of any size; a dashed preview shows once it is large enough |
| Double-click on empty board space | Creates a default-sized note centred on the cursor                       |
| Drag a note's header              | Moves the note, clamped to the board                                     |
| Drag the bottom-right corner      | Resizes the note, respecting the minimum size and the board edge         |
| Drop a note on the trash zone     | Deletes it (the zone appears and highlights during the drag)             |
| Click a note                      | Brings it to the front                                                   |
| Click the dot in a note's header  | Cycles its colour                                                        |
| Edit text and leave the textarea  | Saves the text on blur                                                   |
| Escape during any gesture         | Cancels it                                                               |

## Design decisions

| Decision                                        | Why                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Domain logic outside React (`src/notes/`)       | Types, geometry, pointer tracking and the reducer are testable without rendering |
| `NotesApi` interface, injected into the hook    | The mock can be swapped for a real backend; tests can pass a fake                |
| Local `draft` state per note, commit on release | Avoids re-rendering every note on every pointer move                             |
| `React.memo` + stable callbacks via `notesRef`  | A change to one note does not re-render the others                               |
| Optimistic updates                              | The UI never waits for the (simulated) network                                   |
| Window-level listeners in `trackPointer`        | Gestures survive the cursor leaving the element and can be cancelled uniformly   |
| Note text kept in local state, saved on blur    | One write per edit instead of one per keystroke                                  |

## Known limitations

- **No rollback.** If a `save` or `remove` fails, local state is not reverted; the user only sees an error toast.
- **Unbounded `z`.** `bringToFront` stores `topZ + 1` on each change; values grow over time and are never normalised.
- **Last write wins.** There is no conflict handling between tabs or clients.
- **Pointer only.** Moving and resizing have no keyboard alternative.
- **Desktop only.** The board targets viewports of at least 1024×768 and the latest Chrome, Firefox and Edge.

## Testing

`npm test` runs Vitest (`src/notes/notes.test.ts`). It covers the geometry helpers, the reducer and the mock API
(persistence across instances and removal). `useNotes` and the components have no automated tests yet; the next
candidates are optimistic updates with a failing API and the gesture commit/cancel behaviour.

## Brief coverage

| Requirement (see [BRIEF.md](./BRIEF.md))      | Where                                          |
| --------------------------------------------- | ---------------------------------------------- |
| 1. Create a note at a given size and position | `Board` (draw / double-click), `geometry.ts`   |
| 2. Resize by dragging                         | `StickyNote`, `clampSize`                      |
| 3. Move by dragging                           | `StickyNote`, `clampPosition`                  |
| 4. Remove by dropping on the trash zone       | `StickyNote`, `TrashZone`, `Board.isOverTrash` |
| I. Edit note text                             | `StickyNote` textarea                          |
| II. Move to front                             | `useNotes.bringToFront`, `z`                   |
| III. Restore from local storage               | `createMockNotesApi`                           |
| IV. Note colours                              | `Toolbar`, `StickyNote.cycleColor`             |
| V. Save to a REST API (asynchronous mock)     | `NotesApi`, `createMockNotesApi`               |
