## Project rules
- Notes domain logic (types, geometry, pointer tracking, reducer, API) lives framework-free in `src/notes/`; components in `src/components/` stay presentational — keeps logic testable.
- Persistence only via the `NotesApi` interface — lets the mock be swapped for a real backend.
- Drag/resize state stays local to the note and commits on release — avoids re-rendering every note per pointer move.
- No stock UI component libraries — hiring-task constraint.
