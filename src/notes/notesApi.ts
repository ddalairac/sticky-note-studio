import { NOTE_COLORS, type Note } from "./types";

/** Contract of the notes backend. The app depends only on this interface. */
export interface NotesApi {
  list(): Promise<Note[]>;
  save(note: Note): Promise<Note>;
  remove(id: string): Promise<void>;
}

const STORAGE_KEY = "sticky-notes:v1";

function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["id"] === "string" &&
    typeof v["text"] === "string" &&
    ["x", "y", "width", "height", "z"].every((k) => typeof v[k] === "number") &&
    (NOTE_COLORS as readonly unknown[]).includes(v["color"])
  );
}

/**
 * Asynchronous mock of a REST API (GET /notes, PUT /notes/:id, DELETE /notes/:id)
 * persisted to localStorage. Requests are queued so writes apply in the order issued,
 * as a real server would see them over a single connection.
 */
export function createMockNotesApi(storage: Storage | undefined, latencyMs = 120): NotesApi {
  let queue: Promise<unknown> = Promise.resolve();

  const read = (): Note[] => {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter(isNote) : [];
    } catch {
      return [];
    }
  };
  const write = (notes: Note[]) => storage?.setItem(STORAGE_KEY, JSON.stringify(notes));

  const request = <T>(handler: () => T): Promise<T> => {
    const next = queue.then(
      () =>
        new Promise<T>((resolve, reject) => {
          setTimeout(() => {
            try {
              resolve(handler());
            } catch (e) {
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          }, latencyMs);
        }),
    );
    queue = next.catch(() => undefined);
    return next;
  };

  return {
    list: () => request(read),
    save: (note) =>
      request(() => {
        const copy = { ...note };
        write([...read().filter((n) => n.id !== note.id), copy]);
        return copy;
      }),
    remove: (id) => request(() => write(read().filter((n) => n.id !== id))),
  };
}
