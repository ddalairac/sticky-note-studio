import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/Board";
import { createMockNotesApi } from "@/notes/notesApi";

// The route renders client-only; the server-side module copy gets no storage.
const api = createMockNotesApi(typeof window === "undefined" ? undefined : window.localStorage);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pinboard — Sticky Notes" },
      {
        name: "description",
        content: "Draw, move, resize and trash sticky notes on a cork board.",
      },
      { property: "og:title", content: "Pinboard — Sticky Notes" },
      {
        property: "og:description",
        content: "Draw, move, resize and trash sticky notes on a cork board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: () => <Board api={api} />,
});
