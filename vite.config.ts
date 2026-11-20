import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs keep the build working under any subpath (e.g. GitHub Pages).
  base: "./",
  resolve: { tsconfigPaths: true },
  plugins: [react()],
});
