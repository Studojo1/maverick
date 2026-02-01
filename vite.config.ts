import { resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: { port: 3002 },
  resolve: {
    alias: {
      // Virtual server-build loads /app/routes/*; ensure it resolves to ./app (Docker root /src)
      "/app": resolve(process.cwd(), "app"),
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize server-only dependencies for SSR build
        if (
          id === "drizzle-orm" ||
          id.startsWith("drizzle-orm/") ||
          id === "pg" ||
          id.startsWith("pg/") ||
          id === "@azure/storage-blob" ||
          id.startsWith("@azure/storage-blob/") ||
          id === "slugify" ||
          id === "reading-time"
        ) {
          return true;
        }
        return false;
      },
    },
  },
});

