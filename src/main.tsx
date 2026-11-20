import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Board } from "@/components/Board";
import { createMockNotesApi } from "@/notes/notesApi";
import "./styles.css";

const api = createMockNotesApi(window.localStorage);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Board api={api} />
  </StrictMode>,
);
