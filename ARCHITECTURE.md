[< Back to Readme](./README.md)

# Sticky Notes — Architecture

The app is a single React + TypeScript page (TanStack Start/Vite, rendered client-only) with no UI component
libraries. Code is split into a framework-free domain layer in `src/notes/` and presentational components in
`src/components/`. The domain layer holds the `Note`/`Rect` types, pure geometry helpers (normalising a drawn
rectangle, clamping moves and resizes to the board and to a minimum size, hit-testing), a tiny `trackPointer`
utility that follows one pointer gesture via window listeners (Escape/pointercancel abort it), a reducer for the
notes collection and the `NotesApi` interface. A `useNotes` hook joins these together: it loads notes, applies
changes optimistically to local state and sends them to the API in the background, showing an error toast if a
request fails.

Persistence goes through the `NotesApi` interface (`list`/`save`/`remove`, all Promise-based). The bundled
implementation is an asynchronous mock of a REST backend with simulated latency. It stores data in localStorage,
runs requests through a queue so writes land in the order they were issued, and type-checks the stored data
when reading it back. A real HTTP client can replace it without touching the UI.

For speed, a note keeps its in-progress position or size in its own local `draft` state while being dragged,
so only that note re-renders on each pointer move. The final rect is written to the store once, on pointer
release. Notes are wrapped in `React.memo` and all callbacks passed to them are stable (`useNotes` actions are
memoised and read the latest data from a ref), so changing one note never re-renders the others. The interaction
model works like this: drag on empty board space to draw a note of any size at any position (a dashed preview
shows when it is large enough), or double-click to create a default-sized note. Drag a note's header to move it,
and drag the bottom-right corner to resize it. Drop a note on the trash zone (which highlights during the drag)
to delete it. Clicking a note brings it to the front, a dot in the header cycles its colour, and text is saved
when the note loses focus.
