import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." imports as the app (see tsconfig.json paths).
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
